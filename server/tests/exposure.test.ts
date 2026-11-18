import { describe, it, expect } from "vitest";
import { calculateInhaledDose, ExposureSlot } from "../src/core/exposure.js";

describe("Human Inhaled Dose Exposure Engine (exposure.test)", () => {
  it("calculates realistic daily inhaled dose for a child in Delhi winter", () => {
    const slots: ExposureSlot[] = [
      {
        microenvironment: "home_indoor",
        durationHours: 14,
        pm25ConcentrationUgM3: 45, // purifiers running
        activityLevel: "sleep",
        maskType: "none",
      },
      {
        microenvironment: "commute",
        durationHours: 1.5,
        pm25ConcentrationUgM3: 280, // high outdoor exposure
        activityLevel: "sedentary",
        maskType: "n95_ffp2", // 88% reduction
      },
      {
        microenvironment: "school_work",
        durationHours: 7,
        pm25ConcentrationUgM3: 120,
        activityLevel: "sedentary",
        maskType: "none",
      },
      {
        microenvironment: "outdoor",
        durationHours: 1.5,
        pm25ConcentrationUgM3: 300,
        activityLevel: "moderate",
        maskType: "n95_ffp2",
      },
    ];

    const result = calculateInhaledDose("child", slots);
    expect(result.pointEstimateUg).toBeGreaterThan(0);
    expect(result.rangeMinUg).toBeLessThan(result.pointEstimateUg);
    expect(result.rangeMaxUg).toBeGreaterThan(result.pointEstimateUg);
    expect(result.doseReductionPct).toBeGreaterThan(0); // N95 mask provided measurable protection
    expect(result.microenvironmentDoses.length).toBe(4);
  });

  it("warns about limited efficacy when cloth or surgical masks are selected", () => {
    const slots: ExposureSlot[] = [
      {
        microenvironment: "outdoor",
        durationHours: 2,
        pm25ConcentrationUgM3: 250,
        activityLevel: "light",
        maskType: "cloth",
      },
    ];

    const result = calculateInhaledDose("adult", slots);
    expect(result.maskNotice).toBeDefined();
    expect(result.maskNotice).toContain("Cloth and surgical masks provide limited fine-particle");
  });

  it("handles zero exposure scenarios gracefully", () => {
    const result = calculateInhaledDose("adult", []);
    expect(result.pointEstimateUg).toBe(0);
    expect(result.doseReductionPct).toBe(0);
  });
});
