/**
 * Indoor Air Quality Mass-Balance Physical Simulation Engine.
 *
 * Implements the standard Eulerian single-zone mass-balance differential equation:
 *   dC/dt = P * a * C_out + S/V - (a + k + Q/V) * C
 *
 * Steady State:
 *   C_in = (P * a * C_out + S/V) / (a + k + Q/V)
 *
 * Citations:
 * 1. Nazaroff, W. W. (2004). Indoor particle dynamics. Atmospheric Environment, 38(17), 2815-2840.
 * 2. Chen, C., & Zhao, B. (2012). Review of relationship between indoor and outdoor particles:
 *    I/O ratio, infiltration and penetration. Atmospheric Environment, 45(2), 275-288.
 * 3. AHAM AC-1-2020: Method for Measuring Performance of Portable Household Electric Room Air Cleaners.
 */

export interface RoomConfig {
  name: string;
  areaM2: number;
  ceilingHeightM?: number; // default 2.8 m
  windowsOpen: boolean;
  purifierCadrM3h: number; // CADR in m³/h (Clean Air Delivery Rate)
  activeSource?: "none" | "cooking" | "incense" | "mosquitoCoil" | "drySweeping";
}

export interface SimulationParams {
  cOutUgM3: number; // Outdoor PM2.5 concentration in µg/m³
  initialCinUgM3?: number; // Initial indoor PM2.5 concentration
  durationHours?: number; // Time step in hours (default 1.0)
  pFactor?: number; // Penetration factor (default 0.8)
  depositionRateK?: number; // Deposition rate k in h⁻¹ (default 0.25)
}

export interface IndoorSimulationResult {
  steadyStateCinUgM3: number;
  transientCinUgM3: number;
  indoorOutdoorRatio: number;
  removalRateLambdaH: number; // total loss rate (a + k + Q/V)
  isSafeForSensitiveGroups: boolean; // Cin <= 15 µg/m³ WHO guideline
}

export interface PurifierSizingResult {
  roomVolumeM3: number;
  currentCadrM3h: number;
  requiredCadrM3h: number; // for 4.5 ACH target
  effectiveAch: number;
  rating: "Under-sized" | "Adequate" | "Optimal";
  recommendation: string;
}

export interface VentilationWindow {
  bestStartHourIso: string;
  bestEndHourIso: string;
  minOutdoorPm25: number;
  shouldVentilate: boolean;
  reason: string;
}

const SOURCE_STRENGTH_MAP: Record<string, number> = {
  cooking: 12000,
  incense: 8000,
  mosquitoCoil: 10000,
  drySweeping: 5000,
};

function getSourceStrength(source?: string): number {
  return source ? (SOURCE_STRENGTH_MAP[source] ?? 0) : 0;
}

/**
 * Computes steady-state and transient indoor PM2.5 from room parameters and outdoor levels.
 */
export function simulateIndoorAir(
  room: RoomConfig,
  params: SimulationParams,
): IndoorSimulationResult {
  const ceilingHeight = room.ceilingHeightM ?? 2.8;
  const volumeM3 = Math.max(1, room.areaM2 * ceilingHeight);

  // Physical parameters
  const P = params.pFactor ?? 0.8;
  const a = room.windowsOpen ? 2.5 : 0.4; // Air exchange rate h⁻¹
  const k = params.depositionRateK ?? 0.25; // Deposition rate h⁻¹
  const Q = Math.max(0, room.purifierCadrM3h); // CADR in m³/h

  // Indoor source strength S in µg/h
  const S = getSourceStrength(room.activeSource);

  // Total removal rate lambda = a + k + Q/V
  const lambda = a + k + Q / volumeM3;

  // Generation term = P * a * C_out + S/V
  const generation = P * a * Math.max(0, params.cOutUgM3) + S / volumeM3;

  // Steady state: C_in = generation / lambda
  const steadyState = generation / lambda;

  // Transient analytical solution over Δt
  const dt = params.durationHours ?? 1.0;
  const c0 = params.initialCinUgM3 ?? steadyState;
  const expFactor = Math.exp(-lambda * dt);
  const transient = c0 * expFactor + (generation / lambda) * (1 - expFactor);

  const roundedSteady = Number(Math.max(0, steadyState).toFixed(1));
  const roundedTransient = Number(Math.max(0, transient).toFixed(1));
  const ioRatio =
    params.cOutUgM3 > 0 ? Number((roundedTransient / params.cOutUgM3).toFixed(2)) : 1.0;

  return {
    steadyStateCinUgM3: roundedSteady,
    transientCinUgM3: roundedTransient,
    indoorOutdoorRatio: ioRatio,
    removalRateLambdaH: Number(lambda.toFixed(2)),
    isSafeForSensitiveGroups: roundedTransient <= 15,
  };
}

/**
 * Sizes an air purifier according to ANSI/AHAM AC-1 standard (target 4.5 Air Changes per Hour).
 */
export function sizePurifier(
  areaM2: number,
  ceilingHeightM = 2.8,
  currentCadrM3h = 0,
): PurifierSizingResult {
  const volumeM3 = areaM2 * ceilingHeightM;
  const targetAch = 4.5; // AHAM recommendation for wildfire/smog conditions
  const requiredCadr = Math.round(volumeM3 * targetAch);
  const effectiveAch = volumeM3 > 0 ? Number((currentCadrM3h / volumeM3).toFixed(1)) : 0;

  let rating: "Under-sized" | "Adequate" | "Optimal" = "Adequate";
  let recommendation = "";

  if (currentCadrM3h < volumeM3 * 2.5) {
    rating = "Under-sized";
    recommendation = `Current purifier delivers only ${effectiveAch} ACH. Severe smog requires ≥ 4.5 ACH (~${requiredCadr} m³/h CADR) to protect room occupants.`;
  } else if (currentCadrM3h >= requiredCadr) {
    rating = "Optimal";
    recommendation = `Excellent filtration capacity (${effectiveAch} ACH). Purifier can clear 80% of fine particulates within 20 minutes.`;
  } else {
    rating = "Adequate";
    recommendation = `Provides ${effectiveAch} ACH. Good for moderate air; run continuously on high speed during severe smog warnings.`;
  }

  return {
    roomVolumeM3: Number(volumeM3.toFixed(1)),
    currentCadrM3h,
    requiredCadrM3h: requiredCadr,
    effectiveAch,
    rating,
    recommendation,
  };
}

function findLowest2HourWindow(hours: Array<{ timeIso: string; pm25: number }>) {
  let minAvg = Infinity;
  let bestIdx = 0;
  for (let i = 0; i < hours.length - 1; i++) {
    const p1 = hours[i]?.pm25 ?? 0;
    const p2 = hours[i + 1]?.pm25 ?? 0;
    const avg = (p1 + p2) / 2;
    if (avg < minAvg) {
      minAvg = avg;
      bestIdx = i;
    }
  }
  return { minAvg, bestIdx };
}

/**
 * Finds the cleanest 2-hour window in the forecast for room ventilation.
 */
export function findBestVentilationWindow(
  forecastHours: Array<{ timeIso: string; pm25: number }>,
  currentIndoorPm25: number,
): VentilationWindow {
  if (forecastHours.length === 0) {
    return {
      bestStartHourIso: "",
      bestEndHourIso: "",
      minOutdoorPm25: 0,
      shouldVentilate: false,
      reason: "No forecast hours available.",
    };
  }

  const { minAvg, bestIdx } = findLowest2HourWindow(forecastHours);
  const start = forecastHours[bestIdx]?.timeIso ?? "";
  const end = forecastHours[bestIdx + 1]?.timeIso ?? "";
  const minOutdoor = Math.round(minAvg);

  // Ventilation rule: Only ventilate if outdoor air is better than indoor air or below 60 µg/m³
  const shouldVentilate = minOutdoor < currentIndoorPm25 || minOutdoor <= 60;
  const reason = shouldVentilate
    ? `Ventilate between ${start.slice(11, 16)} and ${end.slice(11, 16)} when outdoor PM2.5 dips to ~${minOutdoor} µg/m³.`
    : `Keep windows closed. Minimum outdoor PM2.5 (~${minOutdoor} µg/m³) exceeds current indoor level (~${Math.round(currentIndoorPm25)} µg/m³).`;

  return {
    bestStartHourIso: start,
    bestEndHourIso: end,
    minOutdoorPm25: minOutdoor,
    shouldVentilate,
    reason,
  };
}
