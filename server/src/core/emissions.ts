/**
 * Urban Avoided Emissions Engine (My City's Emissions Lens).
 *
 * Avoided Emissions = Activity × (Baseline Factor - Alternative Factor)
 * Strictly separates emissions avoided (city air) from personal exposure (family health).
 *
 * Citations:
 * 1. Automotive Research Association of India (ARAI) & CPCB (2020): Emission factors for Indian vehicles.
 * 2. Delhi Metro Rail Corporation (DMRC) Sustainability and GHG Report (2022).
 * 3. Central Electricity Authority (CEA) CO2 Baseline Database for the Indian Power Sector (2023).
 * 4. CPCB / IIT Kanpur: Air pollution source apportionment and open waste burning study (2018).
 */

export type TransportMode =
  | "petrol_car"
  | "diesel_car"
  | "two_wheeler_petrol"
  | "auto_rickshaw_cng"
  | "cng_bus"
  | "electric_metro"
  | "electric_vehicle"
  | "carpool_2person"
  | "cycling"
  | "walking"
  | "wfh_day";

export type CookingFuel = "biomass" | "lpg" | "induction_electric";

export interface AvoidedEmissionsResult {
  avoidedCo2eKg: number;
  avoidedPm25G: number;
  avoidedNoxG: number;
  uncertaintyRangeCo2eKg: [number, number];
  healthTradeoffWarning?: string;
  citations: string[];
}

interface Factor {
  co2eG: number;
  pm25G: number;
  noxG: number;
  uncertaintyPct: number;
  citation: string;
}

const TRANSPORT_FACTORS: Record<TransportMode, Factor> = {
  petrol_car: { co2eG: 170.0, pm25G: 0.025, noxG: 0.25, uncertaintyPct: 10, citation: "ARAI (2020)" },
  diesel_car: { co2eG: 160.0, pm25G: 0.085, noxG: 0.65, uncertaintyPct: 15, citation: "ARAI / CPCB (2020)" },
  two_wheeler_petrol: { co2eG: 45.0, pm25G: 0.04, noxG: 0.18, uncertaintyPct: 10, citation: "TERI (2021)" },
  auto_rickshaw_cng: { co2eG: 65.0, pm25G: 0.012, noxG: 0.2, uncertaintyPct: 15, citation: "TERI / CPCB (2020)" },
  cng_bus: { co2eG: 35.0, pm25G: 0.006, noxG: 0.12, uncertaintyPct: 20, citation: "CSE India (2020)" },
  electric_metro: { co2eG: 18.0, pm25G: 0.001, noxG: 0.01, uncertaintyPct: 10, citation: "DMRC Sustainability Report (2022)" },
  electric_vehicle: { co2eG: 45.0, pm25G: 0.002, noxG: 0.02, uncertaintyPct: 15, citation: "CEA India (2023)" },
  carpool_2person: { co2eG: 85.0, pm25G: 0.012, noxG: 0.12, uncertaintyPct: 12, citation: "ARAI / Carpool 50% allocation" },
  cycling: { co2eG: 0.0, pm25G: 0.0, noxG: 0.0, uncertaintyPct: 0, citation: "Zero tailpipe emission" },
  walking: { co2eG: 0.0, pm25G: 0.0, noxG: 0.0, uncertaintyPct: 0, citation: "Zero tailpipe emission" },
  wfh_day: { co2eG: 0.0, pm25G: 0.0, noxG: 0.0, uncertaintyPct: 0, citation: "Eliminates commuter trip entirely" },
};

const COOKING_FACTORS: Record<CookingFuel, Factor> = {
  biomass: { co2eG: 1200.0, pm25G: 25.0, noxG: 1.8, uncertaintyPct: 25, citation: "WHO Indoor Air Guidelines (2014)" },
  lpg: { co2eG: 380.0, pm25G: 0.15, noxG: 0.35, uncertaintyPct: 10, citation: "TERI (2021)" },
  induction_electric: { co2eG: 210.0, pm25G: 0.02, noxG: 0.05, uncertaintyPct: 15, citation: "CEA (2023)" },
};

/**
 * Calculates avoided emissions when switching transport modes.
 */
export function calculateAvoidedTransportEmissions(
  baseline: TransportMode,
  alternative: TransportMode,
  distanceKm: number,
  currentAqi = 150,
): AvoidedEmissionsResult {
  const base = TRANSPORT_FACTORS[baseline];
  const alt = TRANSPORT_FACTORS[alternative];
  const km = Math.max(0, distanceKm);

  // Delta in grams
  const deltaCo2eG = Math.max(0, (base.co2eG - alt.co2eG) * km);
  const deltaPm25G = Math.max(0, (base.pm25G - alt.pm25G) * km);
  const deltaNoxG = Math.max(0, (base.noxG - alt.noxG) * km);

  const avoidedCo2eKg = Number((deltaCo2eG / 1000).toFixed(2));
  const avgUncertainty = (base.uncertaintyPct + alt.uncertaintyPct) / 200;
  const minCo2e = Number((avoidedCo2eKg * (1 - avgUncertainty)).toFixed(2));
  const maxCo2e = Number((avoidedCo2eKg * (1 + avgUncertainty)).toFixed(2));

  // Health trade-off check: Cycling/walking in severe smog
  let warning: string | undefined;
  if ((alternative === "cycling" || alternative === "walking") && currentAqi > 250) {
    warning =
      "Health Trade-Off Warning: While cycling and walking cut city emissions to zero, doing intense cardio in Very Poor or Severe air significantly increases your inhaled PM2.5 dose. Consider Electric Metro, Bus, Carpool, or WFH instead.";
  }

  const citations = Array.from(new Set([base.citation, alt.citation]));

  return {
    avoidedCo2eKg,
    avoidedPm25G: Number(deltaPm25G.toFixed(2)),
    avoidedNoxG: Number(deltaNoxG.toFixed(2)),
    uncertaintyRangeCo2eKg: [minCo2e, maxCo2e],
    healthTradeoffWarning: warning,
    citations,
  };
}

/**
 * Calculates avoided emissions from clean cooking transition.
 */
export function calculateAvoidedCookingEmissions(
  baseline: CookingFuel,
  alternative: CookingFuel,
  mealsPerDay = 3,
): AvoidedEmissionsResult {
  const base = COOKING_FACTORS[baseline];
  const alt = COOKING_FACTORS[alternative];

  const deltaCo2eG = Math.max(0, (base.co2eG - alt.co2eG) * mealsPerDay);
  const deltaPm25G = Math.max(0, (base.pm25G - alt.pm25G) * mealsPerDay);
  const deltaNoxG = Math.max(0, (base.noxG - alt.noxG) * mealsPerDay);

  const avoidedCo2eKg = Number((deltaCo2eG / 1000).toFixed(2));
  const avgUncertainty = (base.uncertaintyPct + alt.uncertaintyPct) / 200;

  return {
    avoidedCo2eKg,
    avoidedPm25G: Number(deltaPm25G.toFixed(2)),
    avoidedNoxG: Number(deltaNoxG.toFixed(2)),
    uncertaintyRangeCo2eKg: [
      Number((avoidedCo2eKg * (1 - avgUncertainty)).toFixed(2)),
      Number((avoidedCo2eKg * (1 + avgUncertainty)).toFixed(2)),
    ],
    citations: Array.from(new Set([base.citation, alt.citation])),
  };
}

/**
 * Calculates avoided emissions when composting instead of burning organic waste.
 */
export function calculateAvoidedWasteBurning(compostedKg: number): AvoidedEmissionsResult {
  const kg = Math.max(0, compostedKg);
  // CPCB 2018 factor: 18.5g PM2.5 and 1450g CO2e per kg dry leaves burned
  const deltaCo2eG = kg * 1450.0;
  const deltaPm25G = kg * 18.5;
  const deltaNoxG = kg * 3.2;

  const avoidedCo2eKg = Number((deltaCo2eG / 1000).toFixed(2));

  return {
    avoidedCo2eKg,
    avoidedPm25G: Number(deltaPm25G.toFixed(1)),
    avoidedNoxG: Number(deltaNoxG.toFixed(1)),
    uncertaintyRangeCo2eKg: [
      Number((avoidedCo2eKg * 0.8).toFixed(2)),
      Number((avoidedCo2eKg * 1.2).toFixed(2)),
    ],
    citations: ["CPCB / IIT Kanpur: Municipal Solid Waste & Leaf Burning Emission Factors (2018)"],
  };
}
