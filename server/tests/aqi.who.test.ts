import { describe, it, expect } from "vitest";
import { calculateNaqi } from "../src/core/aqi.js";

describe("WHO Guideline Multiple Calculations (aqi.who.test)", () => {
  it("calculates accurate multiples against the 15 µg/m³ 24h WHO guideline", () => {
    // Exact guideline
    const res1 = calculateNaqi({ pm25: 15 });
    expect(res1.whoMultiple).toBe(1.0);

    // Below guideline
    const res2 = calculateNaqi({ pm25: 7.5 });
    expect(res2.whoMultiple).toBe(0.5);

    // Delhi severe winter smog condition (e.g. 300 µg/m³)
    const res3 = calculateNaqi({ pm25: 300 });
    expect(res3.whoMultiple).toBe(20.0);

    // 0 PM2.5
    const res4 = calculateNaqi({ pm25: 0 });
    expect(res4.whoMultiple).toBe(0.0);
  });
});
