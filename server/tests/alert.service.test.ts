import { describe, it, expect, beforeEach } from "vitest";
import { FakeClock } from "../src/adapters/fakeClock.js";
import { ScenarioProvider } from "../src/adapters/scenarioProvider.js";
import { MemoryHouseholdRepository } from "../src/repositories/memory/memoryHouseholdRepo.js";
import { MemoryOutboxRepository } from "../src/repositories/memory/memoryOutboxRepo.js";
import { MemoryAuditRepository } from "../src/repositories/memory/memoryAuditRepo.js";
import { AlertService } from "../src/services/alert.service.js";

describe("AlertService (FR-15, Thresholds, Ack, Escalation)", () => {
  let clock: FakeClock;
  let householdRepo: MemoryHouseholdRepository;
  let outboxRepo: MemoryOutboxRepository;
  let auditRepo: MemoryAuditRepository;
  let scenarioProvider: ScenarioProvider;
  let alertService: AlertService;
  const householdId = "hh-test-alerts";

  beforeEach(async () => {
    clock = new FakeClock();
    householdRepo = new MemoryHouseholdRepository(clock);
    outboxRepo = new MemoryOutboxRepository(clock);
    auditRepo = new MemoryAuditRepository();
    scenarioProvider = new ScenarioProvider(clock, "Severe");

    alertService = new AlertService(householdRepo, outboxRepo, auditRepo, scenarioProvider, clock);

    // Setup household
    await householdRepo.createHousehold(
      {
        id: householdId,
        name: "Test Household",
        location: { name: "Delhi", lat: 28.6, lng: 77.2 },
        members: [],
        rooms: [],
        cookingFuel: "lpg",
        aiPersonalizationConsent: true,
        shareWithCommunityConsent: false,
        preferredLanguage: "en",
      },
      "user-1",
    );

    // Configure alert preferences with co-guardian escalation
    await householdRepo.setAlertPreference({
      householdId,
      enabled: true,
      aqiThreshold: 200,
      deliveryChannel: "email",
      coGuardianEmail: "co-guardian@saans.local",
      coGuardianConsent: true,
    });
  });

  it("evaluates forecast and triggers outbox alert when AQI crosses threshold", async () => {
    const alerts = await alertService.evaluateAlertsForHousehold(householdId);
    expect(alerts.length).toBe(1);
    expect(alerts[0]?.eventType).toBe("SMOG_ALERT");
    expect(alerts[0]?.subject).toContain("Smog Alert");

    // Idempotency: running again does not duplicate the alert
    const secondRun = await alertService.evaluateAlertsForHousehold(householdId);
    expect(secondRun.length).toBe(1);
  });

  it("acknowledges alert successfully", async () => {
    const alerts = await alertService.evaluateAlertsForHousehold(householdId);
    const alertId = alerts[0]!.id;

    await alertService.acknowledgeAlert(householdId, alertId, "user-1");

    const tenantItems = await outboxRepo.listByTenant(householdId);
    const found = tenantItems.find((i) => i.id === alertId);
    expect(found?.acknowledgedAt).toBeDefined();
  });

  it("escalates unacknowledged alert to consenting co-guardian after 30-min grace timeout", async () => {
    await alertService.evaluateAlertsForHousehold(householdId);

    // Advance 10 minutes (within grace period: no escalation)
    clock.advanceMinutes(10);
    const noEsc = await alertService.checkEscalations(30);
    expect(noEsc.length).toBe(0);

    // Advance another 25 minutes (total 35 min > 30 min grace period)
    clock.advanceMinutes(25);
    const escalations = await alertService.checkEscalations(30);
    expect(escalations.length).toBe(1);
    expect(escalations[0]?.eventType).toBe("SMOG_ALERT_ESCALATION");
    expect(escalations[0]?.recipient).toBe("co-guardian@saans.local");
  });
});
