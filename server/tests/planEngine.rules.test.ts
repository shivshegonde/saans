import { describe, it, expect } from "vitest";
import { buildDailyPlan, HouseholdContext } from "../src/core/planEngine.js";

describe("Plan Engine Rules P1–P10 (planEngine.rules.test)", () => {
  it("enforces rules P1 to P10 across a comprehensive household in severe smog", () => {
    const fullCtx: HouseholdContext = {
      hasChild: true,
      hasElder: true,
      hasRespiratoryCondition: true,
      hasPregnancy: false,
      hasPurifier: true,
      purifierCadrM3h: 300,
      commuteMode: "petrol_car",
      commuteDistanceKm: 20,
      cookingFuel: "lpg",
      currentAqi: 425, // Severe
      forecastHours: [
        { timeIso: "2026-11-18T06:00:00Z", aqi: 450, pm25: 320 },
        { timeIso: "2026-11-18T13:00:00Z", aqi: 280, pm25: 110 },
      ],
      bestVentilationWindow: {
        startIso: "2026-11-18T13:00:00Z",
        endIso: "2026-11-18T15:00:00Z",
      },
    };

    const plan = buildDailyPlan(fullCtx);
    const ruleIds = plan.map((c) => c.ruleId);

    // Verify all 10 rules are present
    expect(ruleIds).toContain("P1"); // Sensitive group indoor play
    expect(ruleIds).toContain("P2"); // Ventilation window
    expect(ruleIds).toContain("P3"); // Purifier pre-running
    expect(ruleIds).toContain("P4"); // Mask guidance (AQI >= 201)
    expect(ruleIds).toContain("P5"); // Metro commute
    expect(ruleIds).toContain("P6"); // Cooking exhaust
    expect(ruleIds).toContain("P7"); // Wet mopping
    expect(ruleIds).toContain("P8"); // Anti-burning
    expect(ruleIds).toContain("P9"); // Elder walk timing (hasElder: true)
    expect(ruleIds).toContain("P10"); // Severe smog lockdown (AQI >= 401)
  });

  it("omits P1, P9, and P10 when conditions are clean and no sensitive members exist", () => {
    const cleanCtx: HouseholdContext = {
      hasChild: false,
      hasElder: false,
      hasRespiratoryCondition: false,
      hasPregnancy: false,
      hasPurifier: false,
      commuteMode: "metro",
      commuteDistanceKm: 10,
      cookingFuel: "induction_electric",
      currentAqi: 45, // Good
      forecastHours: [],
    };

    const plan = buildDailyPlan(cleanCtx);
    const ruleIds = plan.map((c) => c.ruleId);

    expect(ruleIds).not.toContain("P1");
    expect(ruleIds).not.toContain("P4");
    expect(ruleIds).not.toContain("P9");
    expect(ruleIds).not.toContain("P10");
  });
});
