import { Clock } from "../core/ports/clock.js";
import { HouseholdRepository } from "../repositories/ports/householdRepo.js";
import { AuditRepository } from "../repositories/ports/auditRepo.js";
import { ForbiddenError, NotFoundError } from "./errors.js";
import { HouseholdProfile, UpdateHouseholdRequest } from "shared";

export class HouseholdService {
  constructor(
    private householdRepo: HouseholdRepository,
    private auditRepo: AuditRepository,
    private clock: Clock,
  ) {}

  async getHousehold(householdId: string, requestingUserId: string): Promise<HouseholdProfile> {
    const mem = await this.householdRepo.getMembership(householdId, requestingUserId);
    if (!mem || mem.status !== "ACTIVE" || !mem.scopes.includes("READ")) {
      throw new ForbiddenError("You do not have permission to view this household");
    }

    const household = await this.householdRepo.getHousehold(householdId);
    if (!household) throw new NotFoundError("Household not found");

    return household;
  }

  async updateHousehold(
    householdId: string,
    updates: UpdateHouseholdRequest,
    requestingUserId: string,
    correlationId = "system",
  ): Promise<HouseholdProfile> {
    const mem = await this.householdRepo.getMembership(householdId, requestingUserId);
    if (!mem || mem.status !== "ACTIVE" || !mem.scopes.includes("UPDATE")) {
      throw new ForbiddenError("You do not have permission to update this household");
    }

    const current = await this.householdRepo.getHousehold(householdId);
    if (!current) throw new NotFoundError("Household not found");

    const updated = await this.householdRepo.updateHousehold(householdId, updates);

    await this.auditRepo.append({
      tenantId: householdId,
      actorId: requestingUserId,
      action: "HOUSEHOLD_UPDATE",
      entityType: "HOUSEHOLD",
      entityId: householdId,
      beforeSnapshot: current as unknown as Record<string, unknown>,
      afterSnapshot: updated as unknown as Record<string, unknown>,
      correlationId,
      at: this.clock.now().toISOString(),
    });

    return updated;
  }

  async deleteHousehold(
    householdId: string,
    requestingUserId: string,
    correlationId = "system",
  ): Promise<void> {
    const mem = await this.householdRepo.getMembership(householdId, requestingUserId);
    if (!mem || mem.status !== "ACTIVE" || mem.role !== "OWNER" || !mem.scopes.includes("DELETE")) {
      throw new ForbiddenError("Only the household owner can delete the household");
    }

    const current = await this.householdRepo.getHousehold(householdId);
    if (!current) throw new NotFoundError("Household not found");

    await this.householdRepo.deleteHousehold(householdId);

    await this.auditRepo.append({
      tenantId: householdId,
      actorId: requestingUserId,
      action: "HOUSEHOLD_DELETE",
      entityType: "HOUSEHOLD",
      entityId: householdId,
      beforeSnapshot: current as unknown as Record<string, unknown>,
      afterSnapshot: null,
      correlationId,
      at: this.clock.now().toISOString(),
    });
  }

  async listMembers(
    householdId: string,
    requestingUserId: string,
  ): Promise<Array<{ userId: string; role: string; scopes: string[]; status: string }>> {
    const mem = await this.householdRepo.getMembership(householdId, requestingUserId);
    if (!mem || mem.status !== "ACTIVE" || !mem.scopes.includes("READ")) {
      throw new ForbiddenError("Access denied");
    }

    const memberships = await this.householdRepo.listMemberships(householdId);
    return memberships.map((m) => ({
      userId: m.userId,
      role: m.role,
      scopes: m.scopes,
      status: m.status,
    }));
  }
}
