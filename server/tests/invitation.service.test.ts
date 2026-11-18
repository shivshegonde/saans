import { describe, it, expect, beforeEach } from "vitest";
import { FakeClock } from "../src/adapters/fakeClock.js";
import { MemoryHouseholdRepository } from "../src/repositories/memory/memoryHouseholdRepo.js";
import { MemoryAuditRepository } from "../src/repositories/memory/memoryAuditRepo.js";
import { AuthService } from "../src/services/auth.service.js";
import { InvitationService } from "../src/services/invitation.service.js";
import { ForbiddenError, ConflictError } from "../src/services/errors.js";

describe("InvitationService (FR-13, Invariants)", () => {
  let clock: FakeClock;
  let householdRepo: MemoryHouseholdRepository;
  let auditRepo: MemoryAuditRepository;
  let authService: AuthService;
  let invitationService: InvitationService;
  let ownerUserId: string;
  let householdId: string;
  let inviteeUserId: string;

  beforeEach(async () => {
    clock = new FakeClock();
    householdRepo = new MemoryHouseholdRepository(clock);
    auditRepo = new MemoryAuditRepository();
    authService = new AuthService(householdRepo, auditRepo, clock);
    invitationService = new InvitationService(householdRepo, auditRepo, clock);

    // Register owner
    const reg = await authService.register({
      email: "owner@delhi.local",
      password: "StrongPassword123!",
      displayName: "Riya",
      householdName: "Riya Household",
      location: { name: "Delhi", lat: 28, lng: 77 },
    });
    ownerUserId = reg.user.id;
    householdId = reg.household.id;

    // Register second user to accept invitation
    const reg2 = await authService.register({
      email: "dadaji@delhi.local",
      password: "StrongPassword123!",
      displayName: "Dadaji",
      householdName: "Dadaji Temp Household",
      location: { name: "Delhi", lat: 28, lng: 77 },
    });
    inviteeUserId = reg2.user.id;
  });

  it("creates an invitation with mapped scopes and accepts it successfully", async () => {
    const { invitation, token } = await invitationService.createInvitation(
      householdId,
      ownerUserId,
      ["VIEW_PLAN", "LOG_ACTIONS"],
    );

    expect(invitation.status).toBe("PENDING");
    expect(token).toBeDefined();

    const joinRes = await invitationService.acceptInvitation(token, inviteeUserId);
    expect(joinRes.householdId).toBe(householdId);
    expect(joinRes.role).toBe("MEMBER");
    expect(joinRes.scopes).toContain("READ");
    expect(joinRes.scopes).toContain("CREATE");
    expect(joinRes.scopes).not.toContain("DELETE");
  });

  it("prevents using an invitation twice", async () => {
    const { token } = await invitationService.createInvitation(householdId, ownerUserId, [
      "VIEW_PLAN",
    ]);
    await invitationService.acceptInvitation(token, inviteeUserId);

    // Attempt to accept again with another user
    await expect(invitationService.acceptInvitation(token, "some-other-user")).rejects.toThrow(
      ConflictError,
    );
  });

  it("rejects expired invitations", async () => {
    const { token } = await invitationService.createInvitation(
      householdId,
      ownerUserId,
      ["VIEW_PLAN"],
      1,
    ); // 1 day
    clock.advanceDays(2);

    await expect(invitationService.acceptInvitation(token, inviteeUserId)).rejects.toThrow(
      ForbiddenError,
    );
  });

  it("allows revoking an invitation immediately", async () => {
    const { invitation, token } = await invitationService.createInvitation(
      householdId,
      ownerUserId,
      ["VIEW_PLAN"],
    );
    await invitationService.revokeInvitation(householdId, invitation.id, ownerUserId);

    await expect(invitationService.acceptInvitation(token, inviteeUserId)).rejects.toThrow(
      ForbiddenError,
    );
  });

  it("prevents revoking the household owner", async () => {
    await expect(
      invitationService.revokeMember(householdId, ownerUserId, ownerUserId),
    ).rejects.toThrow("Cannot revoke owner of the household");
  });
});
