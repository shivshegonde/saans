import { describe, it, expect } from "vitest";
import { sizePurifier } from "../src/core/indoor.js";

describe("Purifier Sizing Calculator (indoor.purifierSizing.test)", () => {
  it("flags under-sized purifier for a master bedroom", () => {
    // 25 m² * 2.8m = 70 m³ room
    // Required CADR for 4.5 ACH = 70 * 4.5 = 315 m³/h
    // Current CADR = 100 m³/h (1.4 ACH)
    const result = sizePurifier(25, 2.8, 100);
    expect(result.rating).toBe("Under-sized");
    expect(result.requiredCadrM3h).toBe(315);
    expect(result.effectiveAch).toBe(1.4);
    expect(result.recommendation).toContain("Severe smog requires ≥ 4.5 ACH");
  });

  it("rates purifier as Optimal when CADR meets 4.5 ACH target", () => {
    // 15 m² * 2.8m = 42 m³
    // CADR = 220 m³/h -> 5.2 ACH
    const result = sizePurifier(15, 2.8, 220);
    expect(result.rating).toBe("Optimal");
    expect(result.effectiveAch).toBe(5.2);
    expect(result.recommendation).toContain("Excellent filtration capacity");
  });

  it("rates purifier as Adequate for intermediate sizing", () => {
    // 20 m² * 2.8m = 56 m³
    // CADR = 180 m³/h -> 3.2 ACH
    const result = sizePurifier(20, 2.8, 180);
    expect(result.rating).toBe("Adequate");
  });
});
