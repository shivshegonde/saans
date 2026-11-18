import crypto from "node:crypto";
import { Clock } from "../core/ports/clock.js";
import { HouseholdRepository } from "../repositories/ports/householdRepo.js";
import { AuditRepository } from "../repositories/ports/auditRepo.js";
import { ForbiddenError, NotFoundError, ConflictError } from "./errors.js";
import { InvitationDto, INVITATION_SCOPE_MAP, InvitationScopeType } from "shared";

export class InvitationService {
  constructor(
    private householdRepo: HouseholdRepository,
    private auditRepo: AuditRepository,
    private clock: Clock,
  ) {}

  private hashToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  async createInvitation(
    householdId: string,
    inviterUserId: string,
    scopes: InvitationScopeType[],
    expiresInDays = 7,
    recipientEmail?: string,
    correlationId = "system",
  ): Promise<{ invitation: InvitationDto; token: string }> {
    const inviterMembership = await this.householdRepo.getMembership(householdId, inviterUserId);
    if (
      !inviterMembership ||
      inviterMembership.status !== "ACTIVE" ||
      !inviterMembership.scopes.includes("INVITE")
    ) {
      throw new ForbiddenError("You do not have permission to invite members to this household");
    }

    const household = await this.householdRepo.getHousehold(householdId);
    if (!household) throw new NotFoundError("Household not found");

    const rawToken = crypto.randomBytes(24).toString("hex");
    const tokenHash = this.hashToken(rawToken);
    const now = this.clock.now();
    const expiresAt = new Date(now.getTime() + expiresInDays * 24 * 60 * 60 * 1000);
    const invitationId = crypto.randomUUID();

    const invitation: InvitationDto & { tokenHash: string } = {
      id: invitationId,
      householdId,
      householdName: household.name,
      role: "MEMBER",
      scopes,
      tokenHash,
      inviterUserId,
      recipientEmail,
      status: "PENDING",
      expiresAt: expiresAt.toISOString(),
      createdAt: now.toISOString(),
    };

    await this.householdRepo.createInvitation(invitation);

    await this.auditRepo.append({
      tenantId: householdId,
      actorId: inviterUserId,
      action: "INVITATION_CREATE",
      entityType: "INVITATION",
      entityId: invitationId,
      beforeSnapshot: null,
      afterSnapshot: { scopes, recipientEmail, expiresAt: expiresAt.toISOString() },
      correlationId,
      at: now.toISOString(),
    });

    const dto = { ...invitation };
    delete (dto as { tokenHash?: string }).tokenHash;
    return {
      invitation: { ...dto, invitationToken: rawToken },
      token: rawToken,
    };
  }

  async acceptInvitation(
    token: string,
    acceptingUserId: string,
    correlationId = "system",
  ): Promise<{ householdId: string; role: string; scopes: string[] }> {
    const tokenHash = this.hashToken(token);
    const invitation = await this.householdRepo.getInvitationByTokenHash(tokenHash);

    if (!invitation) {
      throw new NotFoundError("Invalid or expired invitation token");
    }

    if (invitation.status === "REVOKED") {
      throw new ForbiddenError("This invitation has been revoked");
    }

    if (invitation.status === "ACCEPTED") {
      throw new ConflictError("This invitation has already been used");
    }

    const now = this.clock.now();
    const expiresAt = new Date(invitation.expiresAt);
    if (expiresAt.getTime() <= now.getTime()) {
      await this.householdRepo.updateInvitationStatus(invitation.id, "EXPIRED");
      throw new ForbiddenError("This invitation has expired");
    }

    // Check if user is already a member
    const existingMembership = await this.householdRepo.getMembership(
      invitation.householdId,
      acceptingUserId,
    );
    if (existingMembership && existingMembership.status === "ACTIVE") {
      throw new ConflictError("You are already an active member of this household");
    }

    // Map invitation scopes to effective permissions
    const effectiveScopes: string[] = ["READ"]; // All members can READ
    for (const s of invitation.scopes as InvitationScopeType[]) {
      const perm = INVITATION_SCOPE_MAP[s];
      if (perm && !effectiveScopes.includes(perm)) {
        effectiveScopes.push(perm);
      }
    }

    await this.householdRepo.createMembership({
      userId: acceptingUserId,
      householdId: invitation.householdId,
      role: "MEMBER",
      scopes: effectiveScopes,
      status: "ACTIVE",
      invitedBy: invitation.inviterUserId,
    });

    await this.householdRepo.updateInvitationStatus(invitation.id, "ACCEPTED");

    await this.auditRepo.append({
      tenantId: invitation.householdId,
      actorId: acceptingUserId,
      action: "INVITATION_ACCEPT",
      entityType: "MEMBERSHIP",
      entityId: acceptingUserId,
      beforeSnapshot: null,
      afterSnapshot: { scopes: effectiveScopes, invitationId: invitation.id },
      correlationId,
      at: now.toISOString(),
    });

    return {
      householdId: invitation.householdId,
      role: "MEMBER",
      scopes: effectiveScopes,
    };
  }

  async revokeInvitation(
    householdId: string,
    invitationId: string,
    revokingUserId: string,
    correlationId = "system",
  ): Promise<void> {
    const revokingMembership = await this.householdRepo.getMembership(householdId, revokingUserId);
    if (
      !revokingMembership ||
      revokingMembership.status !== "ACTIVE" ||
      !revokingMembership.scopes.includes("REVOKE")
    ) {
      throw new ForbiddenError(
        "You do not have permission to revoke invitations in this household",
      );
    }

    const invitation = await this.householdRepo.getInvitationById(invitationId);
    if (!invitation || invitation.householdId !== householdId) {
      throw new NotFoundError("Invitation not found");
    }

    const now = this.clock.now();
    await this.householdRepo.updateInvitationStatus(invitationId, "REVOKED", now.toISOString());

    await this.auditRepo.append({
      tenantId: householdId,
      actorId: revokingUserId,
      action: "INVITATION_REVOKE",
      entityType: "INVITATION",
      entityId: invitationId,
      beforeSnapshot: { status: invitation.status },
      afterSnapshot: { status: "REVOKED", revokedAt: now.toISOString() },
      correlationId,
      at: now.toISOString(),
    });
  }

  async revokeMember(
    householdId: string,
    targetUserId: string,
    revokingUserId: string,
    correlationId = "system",
  ): Promise<void> {
    const revokerMembership = await this.householdRepo.getMembership(householdId, revokingUserId);
    if (
      !revokerMembership ||
      revokerMembership.status !== "ACTIVE" ||
      !revokerMembership.scopes.includes("REVOKE")
    ) {
      throw new ForbiddenError("You do not have permission to revoke members in this household");
    }

    const targetMembership = await this.householdRepo.getMembership(householdId, targetUserId);
    if (!targetMembership) {
      throw new NotFoundError("Member not found in this household");
    }

    if (targetMembership.role === "OWNER") {
      throw new ForbiddenError("Cannot revoke owner of the household");
    }

    await this.householdRepo.revokeMembership(householdId, targetUserId);

    await this.auditRepo.append({
      tenantId: householdId,
      actorId: revokingUserId,
      action: "MEMBER_REVOKE",
      entityType: "MEMBERSHIP",
      entityId: targetUserId,
      beforeSnapshot: { status: targetMembership.status },
      afterSnapshot: { status: "REVOKED" },
      correlationId,
      at: this.clock.now().toISOString(),
    });
  }

  async listInvitations(householdId: string, requestingUserId: string): Promise<InvitationDto[]> {
    const mem = await this.householdRepo.getMembership(householdId, requestingUserId);
    if (!mem || mem.status !== "ACTIVE" || !mem.scopes.includes("READ")) {
      throw new ForbiddenError("Access denied");
    }
    return this.householdRepo.listInvitations(householdId);
  }
}
