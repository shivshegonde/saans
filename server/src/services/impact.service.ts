import { calculateInhaledDose, ExposureSlot } from "../core/exposure.js";
import {
  calculateAvoidedTransportEmissions,
  calculateAvoidedCookingEmissions,
  TransportMode,
  CookingFuel,
} from "../core/emissions.js";
import { ImpactCalculationRequest, ImpactCalculationResponse } from "shared";

export class ImpactService {
  calculate(req: ImpactCalculationRequest): ImpactCalculationResponse {
    // 1. Family Exposure (Health lens)
    const outdoorPm25 = (req.baselineAqi / 500) * 250; // approximate PM2.5 in ug/m3
    const baselineIndoorPm25 = outdoorPm25 * 0.7; // 70% penetration without purifier
    const actionIndoorPm25 = req.hasPurifier ? outdoorPm25 * 0.2 : baselineIndoorPm25;

    const hoursOutdoor = Math.min(24, Math.max(0, req.hoursOutdoor));
    const hoursIndoor = 24 - hoursOutdoor;

    const baselineSlots: ExposureSlot[] = [
      {
        microenvironment: "home_indoor",
        durationHours: hoursIndoor,
        pm25ConcentrationUgM3: baselineIndoorPm25,
        activityLevel: "sedentary",
        maskType: "none",
      },
      {
        microenvironment: "outdoor",
        durationHours: hoursOutdoor,
        pm25ConcentrationUgM3: outdoorPm25,
        activityLevel: "light",
        maskType: "none",
      },
    ];

    const actionSlots: ExposureSlot[] = [
      {
        microenvironment: "home_indoor",
        durationHours: hoursIndoor,
        pm25ConcentrationUgM3: actionIndoorPm25,
        activityLevel: "sedentary",
        maskType: "none",
      },
      {
        microenvironment: "outdoor",
        durationHours: hoursOutdoor,
        pm25ConcentrationUgM3: outdoorPm25,
        activityLevel: "light",
        maskType: req.maskWornOutdoor ? "n95_ffp2" : "none",
      },
    ];

    const baselineDose = calculateInhaledDose("adult", baselineSlots);
    const actionDose = calculateInhaledDose("adult", actionSlots);

    const reductionPercent =
      baselineDose.pointEstimateUg > 0
        ? Math.round(
            ((baselineDose.pointEstimateUg - actionDose.pointEstimateUg) /
              baselineDose.pointEstimateUg) *
              1000,
          ) / 10
        : 0;

    // 2. City Emissions (City lens)
    const transportModeMap: Record<string, TransportMode> = {
      petrolCar: "petrol_car",
      petrol_car: "petrol_car",
      dieselCar: "diesel_car",
      diesel_car: "diesel_car",
      twoWheeler: "two_wheeler_petrol",
      two_wheeler_petrol: "two_wheeler_petrol",
    };
    const baselineMode = transportModeMap[req.commuteMode] || "petrol_car";

    const transportEmissions = calculateAvoidedTransportEmissions(
      baselineMode,
      "electric_metro",
      req.commuteDistanceKm,
      req.baselineAqi,
    );

    const cookingFuelMap: Record<string, CookingFuel> = {
      biomass: "biomass",
      lpg: "lpg",
      electric: "induction_electric",
      induction_electric: "induction_electric",
    };
    const baselineCooking = cookingFuelMap[req.cookingFuel] || "lpg";
    const cookingEmissions = calculateAvoidedCookingEmissions(
      baselineCooking,
      "induction_electric",
      2,
    );

    const totalCo2eAvoidedKg =
      Math.round((transportEmissions.avoidedCo2eKg + cookingEmissions.avoidedCo2eKg) * 100) / 100;
    const totalPm25AvoidedGrams =
      Math.round((transportEmissions.avoidedPm25G + cookingEmissions.avoidedPm25G) * 10) / 10;
    const totalNoxAvoidedGrams =
      Math.round((transportEmissions.avoidedNoxG + cookingEmissions.avoidedNoxG) * 10) / 10;

    return {
      familyExposure: {
        baselineDoseUg: Math.round(baselineDose.pointEstimateUg * 10) / 10,
        actionDoseUg: Math.round(actionDose.pointEstimateUg * 10) / 10,
        reductionPercent,
        pointEstimateUg: Math.round(actionDose.pointEstimateUg * 10) / 10,
        uncertaintyRangeUg: {
          min: Math.round(actionDose.rangeMinUg * 10) / 10,
          max: Math.round(actionDose.rangeMaxUg * 10) / 10,
        },
      },
      cityEmissions: {
        co2eAvoidedKg: totalCo2eAvoidedKg,
        pm25AvoidedGrams: totalPm25AvoidedGrams,
        noxAvoidedGrams: totalNoxAvoidedGrams,
      },
      formulaSheet: {
        exposureFormula:
          "Dose (µg) = Σ [Concentration (µg/m³) × Inhalation Rate (m³/h) × Duration (h) × (1 − Filter Efficiency)]",
        emissionsFormula:
          "Avoided Emissions = Usage × (Baseline Emission Factor − Alternative Emission Factor)",
        sources: [
          "US EPA Exposure Factors Handbook (2011)",
          "CPCB Comprehensive Air Quality Standards & NAQI Technical Guidelines (2014)",
          "ARAI Indian Emission Factors for Road Vehicles (2020)",
          "WHO Global Air Quality Guidelines (2021)",
        ],
        assumptions: [
          "Resting adult inhalation rate is 0.45 m³/h; light exercise is 1.1 m³/h",
          "Well-fitted N95 filtration efficiency against ambient PM2.5 assumed 88% conservative bound",
          "Indoor air penetration without filtration assumed 0.70; HEPA filtration assumed 0.20",
          "Emissions avoided assume substitution of personal fossil commute with Delhi Metro electric network",
        ],
      },
    };
  }
}
