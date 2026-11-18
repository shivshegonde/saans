import { describe, it, expect } from "vitest";
import { ImpactService } from "../src/services/impact.service.js";

describe("ImpactService (FR-8, Exposure & Emissions Calculations)", () => {
  const service = new ImpactService();

  it("calculates family exposure and city emissions savings with formula sheet", () => {
    const res = service.calculate({
      commuteMode: "petrolCar",
      commuteDistanceKm: 20,
      hasPurifier: true,
      maskWornOutdoor: true,
      cookingFuel: "biomass",
      hoursOutdoor: 3,
      baselineAqi: 350,
    });

    // Exposure assertions
    expect(res.familyExposure.baselineDoseUg).toBeGreaterThan(0);
    expect(res.familyExposure.actionDoseUg).toBeLessThan(res.familyExposure.baselineDoseUg);
    expect(res.familyExposure.reductionPercent).toBeGreaterThan(30);
    expect(res.familyExposure.uncertaintyRangeUg.min).toBeLessThanOrEqual(
      res.familyExposure.pointEstimateUg,
    );
    expect(res.familyExposure.uncertaintyRangeUg.max).toBeGreaterThanOrEqual(
      res.familyExposure.pointEstimateUg,
    );

    // City emissions assertions
    expect(res.cityEmissions.co2eAvoidedKg).toBeGreaterThan(0);
    expect(res.cityEmissions.pm25AvoidedGrams).toBeGreaterThan(0);

    // Formula sheet assertions
    expect(res.formulaSheet.exposureFormula).toContain("Dose");
    expect(res.formulaSheet.sources.length).toBeGreaterThanOrEqual(3);
    expect(res.formulaSheet.assumptions.length).toBeGreaterThanOrEqual(2);
  });
});
