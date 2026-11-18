import { describe, it, expect, beforeEach } from "vitest";
import { FakeClock } from "../src/adapters/fakeClock.js";
import { MemoryHouseholdRepository } from "../src/repositories/memory/memoryHouseholdRepo.js";
import { MemoryAuditRepository } from "../src/repositories/memory/memoryAuditRepo.js";
import { AuthService } from "../src/services/auth.service.js";
import { HouseholdService } from "../src/services/household.service.js";
import { ForbiddenError } from "../src/services/errors.js";

describe("HouseholdService (FR-1, FR-19, Domain Invariants)", () => {
  let clock: FakeClock;
  let householdRepo: MemoryHouseholdRepository;
  let auditRepo: MemoryAuditRepository;
  let authService: AuthService;
  let householdService: HouseholdService;
  let ownerUserId: string;
  let householdId: string;

  beforeEach(async () => {
    clock = new FakeClock();
    householdRepo = new MemoryHouseholdRepository(clock);
    auditRepo = new MemoryAuditRepository();
    authService = new AuthService(householdRepo, auditRepo, clock);
    householdService = new HouseholdService(householdRepo, auditRepo, clock);

    const reg = await authService.register({
      email: "riya@delhi.local",
      password: "StrongPassword123!",
      displayName: "Riya",
      householdName: "Riya Household",
      location: { name: "Delhi", lat: 28.61, lng: 77.2 },
    });
    ownerUserId = reg.user.id;
    householdId = reg.household.id;
  });

  it("retrieves household profile for owner", async () => {
    const profile = await householdService.getHousehold(householdId, ownerUserId);
    expect(profile.name).toBe("Riya Household");
    expect(profile.location.name).toBe("Delhi");
  });

  it("updates household settings and appends audit log", async () => {
    const updated = await householdService.updateHousehold(
      householdId,
      {
        cookingFuel: "electric",
        aiPersonalizationConsent: false,
      },
      ownerUserId,
    );

    expect(updated.cookingFuel).toBe("electric");
    expect(updated.aiPersonalizationConsent).toBe(false);

    const logs = await auditRepo.listByTenant(householdId);
    expect(logs.some((l) => l.action === "HOUSEHOLD_UPDATE")).toBe(true);
  });

  it("denies access when requesting non-member user", async () => {
    await expect(householdService.getHousehold(householdId, "non-member-id")).rejects.toThrow(
      ForbiddenError,
    );
  });

  it("allows owner to delete household and prevents further access", async () => {
    await householdService.deleteHousehold(householdId, ownerUserId);
    await expect(householdService.getHousehold(householdId, ownerUserId)).rejects.toThrow(
      ForbiddenError,
    );
  });
});
