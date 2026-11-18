import { describe, it, expect, beforeEach } from "vitest";
import { FakeClock } from "../src/adapters/fakeClock.js";
import { ScenarioProvider } from "../src/adapters/scenarioProvider.js";
import { MemoryHouseholdRepository } from "../src/repositories/memory/memoryHouseholdRepo.js";
import { MemoryOutboxRepository } from "../src/repositories/memory/memoryOutboxRepo.js";
import { MemoryAuditRepository } from "../src/repositories/memory/memoryAuditRepo.js";
import { AlertService } from "../src/services/alert.service.js";
import { AuthService } from "../src/services/auth.service.js";
import { DemoService } from "../src/services/demo.service.js";

describe("DemoService (FR-20, Judge Demo Controls)", () => {
  let clock: FakeClock;
  let scenario: ScenarioProvider;
  let demoService: DemoService;
  let householdRepo: MemoryHouseholdRepository;
  let outboxRepo: MemoryOutboxRepository;
  let auditRepo: MemoryAuditRepository;
  let alertService: AlertService;
  let authService: AuthService;

  beforeEach(async () => {
    clock = new FakeClock();
    scenario = new ScenarioProvider(clock, "Moderate");
    householdRepo = new MemoryHouseholdRepository(clock);
    outboxRepo = new MemoryOutboxRepository(clock);
    auditRepo = new MemoryAuditRepository();
    alertService = new AlertService(householdRepo, outboxRepo, auditRepo, scenario, clock);
    authService = new AuthService(householdRepo, auditRepo, clock);
    demoService = new DemoService(clock, scenario, alertService, auditRepo, authService);

    await householdRepo.createHousehold(
      {
        id: "demo-hh",
        name: "Demo House",
        location: { name: "Delhi", lat: 28.6, lng: 77.2 },
        members: [],
        rooms: [],
        cookingFuel: "lpg",
        aiPersonalizationConsent: true,
        shareWithCommunityConsent: false,
        preferredLanguage: "en",
      },
      "demo-user",
    );
  });

  it("switches scenario cleanly", async () => {
    demoService.switchScenario("Clean");
    const current = await scenario.getCurrent({ name: "Delhi", lat: 28.6, lng: 77.2 });
    expect(current.category).toBe("Good");

    demoService.switchScenario("Severe");
    const severeCurrent = await scenario.getCurrent({ name: "Delhi", lat: 28.6, lng: 77.2 });
    expect(severeCurrent.category).toBe("Severe");
  });

  it("advances and resets simulated clock", () => {
    const t1 = demoService.timeTravel(60); // +1 hour
    expect(t1.getTime()).toBeGreaterThan(new Date("2026-11-18T08:00:00.000Z").getTime());

    const tReset = demoService.timeTravel(0);
    expect(tReset.toISOString()).toBe("2026-11-18T08:00:00.000Z");
  });

  it("triggers severe smog and evaluates alerts", async () => {
    const res = await demoService.triggerSevereSmog("demo-hh");
    expect(res.scenario).toBe("Severe");
  });

  it("triggers grace timeout escalation", async () => {
    const res = await demoService.triggerGraceTimeout();
    expect(res).toBeDefined();
    expect(res.escalatedCount).toBeGreaterThanOrEqual(0);
  });
});
