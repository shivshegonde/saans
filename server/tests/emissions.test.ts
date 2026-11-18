import { describe, it, expect } from "vitest";
import {
  calculateAvoidedTransportEmissions,
  calculateAvoidedCookingEmissions,
  calculateAvoidedWasteBurning,
} from "../src/core/emissions.js";

describe("Avoided Emissions Engine (emissions.test)", () => {
  it("calculates emissions avoided switching from petrol car to electric metro", () => {
    // 25 km commute
    const res = calculateAvoidedTransportEmissions("petrol_car", "electric_metro", 25, 120);

    // Delta CO2e: (170 - 18) * 25 = 152 * 25 = 3800 g = 3.80 kg CO2e
    expect(res.avoidedCo2eKg).toBe(3.8);
    expect(res.avoidedPm25G).toBeGreaterThan(0.5);
    expect(res.avoidedNoxG).toBeGreaterThan(5.0);
    expect(res.uncertaintyRangeCo2eKg[0]).toBeLessThan(res.avoidedCo2eKg);
    expect(res.uncertaintyRangeCo2eKg[1]).toBeGreaterThan(res.avoidedCo2eKg);
    expect(res.healthTradeoffWarning).toBeUndefined(); // AQI 120 doesn't trigger cycling warning
    expect(res.citations.length).toBeGreaterThanOrEqual(2);
  });

  it("warns about health trade-offs when user selects cycling during severe smog", () => {
    const res = calculateAvoidedTransportEmissions("petrol_car", "cycling", 15, 380); // Very Poor / Severe AQI
    expect(res.healthTradeoffWarning).toBeDefined();
    expect(res.healthTradeoffWarning).toContain("doing intense cardio in Very Poor or Severe air");
  });

  it("calculates emissions avoided transitioning from biomass chulha to LPG or induction", () => {
    const res = calculateAvoidedCookingEmissions("biomass", "induction_electric", 3);
    // (1200 - 210) * 3 = 2970 g CO2e ~ 2.97 kg
    expect(res.avoidedCo2eKg).toBe(2.97);
    // PM2.5 delta: (25.0 - 0.02) * 3 ~ 74.9 g PM2.5
    expect(res.avoidedPm25G).toBeCloseTo(74.94, 1);
  });

  it("calculates emissions avoided composting dry leaves instead of burning", () => {
    const res = calculateAvoidedWasteBurning(10); // 10 kg dry leaves
    expect(res.avoidedCo2eKg).toBe(14.5);
    expect(res.avoidedPm25G).toBe(185.0);
  });
});
