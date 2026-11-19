/**
 * CPCB NAQI and US EPA Air Quality Index Calculation Engine.
 * Pure mathematical implementation with zero I/O.
 *
 * Citations:
 * 1. Central Pollution Control Board (CPCB), Ministry of Environment, Forest and Climate Change,
 *    Government of India: "National Air Quality Index" (NAQI) technical report, Oct 2014.
 * 2. World Health Organization (WHO): "Global air quality guidelines: particulate matter
 *    (PM2.5 and PM10), ozone, nitrogen dioxide, sulfur dioxide and carbon monoxide" (2021).
 *    24-hour PM2.5 interim target/guideline = 15 µg/m³.
 * 3. US EPA: "Air Quality Index (AQI) Basics" (Revised PM2.5 standards, May 2024).
 */

import { NaqiCategory } from "shared";
import { CPCB_BREAKPOINTS, WHO_PM25_24H_GUIDELINE, BreakpointRange } from "./constants.js";

export interface PollutantReadings {
  pm25?: number; // µg/m³ (24h avg)
  pm10?: number; // µg/m³ (24h avg)
  no2?: number; // µg/m³ (24h avg)
  so2?: number; // µg/m³ (24h avg)
  co?: number; // mg/m³ (8h avg)
  o3?: number; // µg/m³ (8h avg)
}

export interface NaqiBreakdown {
  aqi: number;
  category: NaqiCategory;
  dominantPollutant: string;
  whoMultiple: number;
  subIndices: Record<string, number>;
  usEpaAqi?: number;
}

type Breakpoint = BreakpointRange;

// CPCB Official Breakpoints are imported from constants.ts to eliminate magic numbers

// US EPA PM2.5 24-hr Breakpoints (revised standard)
const EPA_PM25_BREAKPOINTS: Breakpoint[] = [
  { cLow: 0.0, cHigh: 9.0, iLow: 0, iHigh: 50 },
  { cLow: 9.1, cHigh: 35.4, iLow: 51, iHigh: 100 },
  { cLow: 35.5, cHigh: 55.4, iLow: 101, iHigh: 150 },
  { cLow: 55.5, cHigh: 125.4, iLow: 151, iHigh: 200 },
  { cLow: 125.5, cHigh: 225.4, iLow: 201, iHigh: 300 },
  { cLow: 225.5, cHigh: 500.4, iLow: 301, iHigh: 500 },
];

/**
 * Computes single pollutant sub-index via linear interpolation.
 */
export function computeSubIndex(pollutant: string, concentration: number): number {
  const bands = CPCB_BREAKPOINTS[pollutant];
  if (!bands || concentration < 0) return 0;

  for (const b of bands) {
    if (concentration >= b.cLow && concentration <= b.cHigh) {
      const idx = ((b.iHigh - b.iLow) / (b.cHigh - b.cLow)) * (concentration - b.cLow) + b.iLow;
      return Math.round(idx);
    }
  }

  // Beyond upper limit
  const last = bands[bands.length - 1];
  if (last && concentration > last.cHigh) {
    return 500;
  }
  return 0;
}

/**
 * Maps CPCB NAQI integer score to descriptive category.
 */
export function getCategoryFromNaqi(aqi: number): NaqiCategory {
  if (aqi <= 50) return "Good";
  if (aqi <= 100) return "Satisfactory";
  if (aqi <= 200) return "Moderate";
  if (aqi <= 300) return "Poor";
  if (aqi <= 400) return "Very Poor";
  return "Severe";
}

/**
 * Computes US EPA AQI from PM2.5 concentration.
 */
export function computeUsEpaAqi(pm25: number): number {
  if (pm25 < 0) return 0;
  for (const b of EPA_PM25_BREAKPOINTS) {
    if (pm25 >= b.cLow && pm25 <= b.cHigh) {
      const idx = ((b.iHigh - b.iLow) / (b.cHigh - b.cLow)) * (pm25 - b.cLow) + b.iLow;
      return Math.round(idx);
    }
  }
  return 500;
}

/**
 * Computes overall CPCB NAQI and dominant pollutant according to CPCB guidelines.
 */
export function calculateNaqi(readings: PollutantReadings): NaqiBreakdown {
  const subIndices: Record<string, number> = {};
  let maxIndex = 0;
  let dominant = "PM2.5";

  for (const [pollutant, val] of Object.entries(readings)) {
    if (typeof val === "number" && !isNaN(val)) {
      const idx = computeSubIndex(pollutant, val);
      subIndices[pollutant] = idx;
      if (idx > maxIndex) {
        maxIndex = idx;
        dominant = pollutant.toUpperCase();
      }
    }
  }

  const pm25Val = readings.pm25 ?? 0;
  const whoMultiple = Number((pm25Val / WHO_PM25_24H_GUIDELINE).toFixed(1));
  const epaAqi = readings.pm25 !== undefined ? computeUsEpaAqi(readings.pm25) : undefined;

  return {
    aqi: maxIndex,
    category: getCategoryFromNaqi(maxIndex),
    dominantPollutant: dominant === "PM25" ? "PM2.5" : dominant,
    whoMultiple: Math.max(0, whoMultiple),
    subIndices,
    usEpaAqi: epaAqi,
  };
}
