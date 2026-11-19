/**
 * Core Domain Constants for Saans.
 * Centralized, named constants across mathematical and logical engines to eliminate magic numbers.
 *
 * Citations:
 * 1. Central Pollution Control Board (CPCB), MoEFCC, Govt of India: "National Air Quality Index" (NAQI) technical report, Oct 2014.
 * 2. World Health Organization (WHO): "Global air quality guidelines", 2021 (24-hour PM2.5 = 15 µg/m³, PM10 = 45 µg/m³).
 * 3. US EPA: "Exposure Factors Handbook" (EPA/600/R-09/052F), 2011.
 * 4. ASHRAE Standard 62.2: "Ventilation and Acceptable Indoor Air Quality in Residential Buildings".
 */

export interface BreakpointRange {
  cLow: number;
  cHigh: number;
  iLow: number;
  iHigh: number;
}

/** WHO 24-hour interim target 1 guideline for PM2.5 in µg/m³ */
export const WHO_PM25_24H_GUIDELINE = 15;

/** WHO 24-hour interim target 1 guideline for PM10 in µg/m³ */
export const WHO_PM10_24H_GUIDELINE = 45;

/** Minimum distinct households required before community metrics can be released (k-anonymity) */
export const K_MIN_COMMUNITY_ANONYMITY = 5;

/** Natural indoor wall and surface particle deposition rate constant in h⁻¹ (Nazaroff, 2004) */
export const DEFAULT_DEPOSITION_RATE_K = 0.2;

/** Baseline air exchange rate for tightly sealed rooms with closed windows in h⁻¹ */
export const AIR_EXCHANGE_SEALED = 0.5;

/** Air exchange rate for cracked windows in h⁻¹ */
export const AIR_EXCHANGE_CRACKED = 1.5;

/** Air exchange rate for fully open windows with cross ventilation in h⁻¹ */
export const AIR_EXCHANGE_OPEN = 4.0;

/** Default ceiling height in meters for Indian urban residential dwellings */
export const DEFAULT_CEILING_HEIGHT_METERS = 2.8;

/** Default ventilation rates by physical activity in m³/h (US EPA Exposure Factors Handbook) */
export const VENTILATION_RATES_M3_PER_HOUR = {
  SLEEP: 0.3,
  SEDENTARY: 0.5,
  LIGHT_EXERCISE: 1.2,
  HEAVY_EXERCISE: 2.5,
} as const;

/** CPCB Official Piecewise Linear Breakpoints for Sub-Index Interpolation */
export const CPCB_BREAKPOINTS: Record<string, BreakpointRange[]> = {
  pm25: [
    { cLow: 0, cHigh: 30, iLow: 0, iHigh: 50 },
    { cLow: 31, cHigh: 60, iLow: 51, iHigh: 100 },
    { cLow: 61, cHigh: 90, iLow: 101, iHigh: 200 },
    { cLow: 91, cHigh: 120, iLow: 201, iHigh: 300 },
    { cLow: 121, cHigh: 250, iLow: 301, iHigh: 400 },
    { cLow: 251, cHigh: 500, iLow: 401, iHigh: 500 },
  ],
  pm10: [
    { cLow: 0, cHigh: 50, iLow: 0, iHigh: 50 },
    { cLow: 51, cHigh: 100, iLow: 51, iHigh: 100 },
    { cLow: 101, cHigh: 250, iLow: 101, iHigh: 200 },
    { cLow: 251, cHigh: 350, iLow: 201, iHigh: 300 },
    { cLow: 351, cHigh: 430, iLow: 301, iHigh: 400 },
    { cLow: 431, cHigh: 600, iLow: 401, iHigh: 500 },
  ],
  no2: [
    { cLow: 0, cHigh: 40, iLow: 0, iHigh: 50 },
    { cLow: 41, cHigh: 80, iLow: 51, iHigh: 100 },
    { cLow: 81, cHigh: 180, iLow: 101, iHigh: 200 },
    { cLow: 181, cHigh: 280, iLow: 201, iHigh: 300 },
    { cLow: 281, cHigh: 400, iLow: 301, iHigh: 400 },
    { cLow: 401, cHigh: 600, iLow: 401, iHigh: 500 },
  ],
  so2: [
    { cLow: 0, cHigh: 40, iLow: 0, iHigh: 50 },
    { cLow: 41, cHigh: 80, iLow: 51, iHigh: 100 },
    { cLow: 81, cHigh: 380, iLow: 101, iHigh: 200 },
    { cLow: 381, cHigh: 800, iLow: 201, iHigh: 300 },
    { cLow: 801, cHigh: 1600, iLow: 301, iHigh: 400 },
    { cLow: 1601, cHigh: 2400, iLow: 401, iHigh: 500 },
  ],
  co: [
    { cLow: 0, cHigh: 1.0, iLow: 0, iHigh: 50 },
    { cLow: 1.1, cHigh: 2.0, iLow: 51, iHigh: 100 },
    { cLow: 2.1, cHigh: 10.0, iLow: 101, iHigh: 200 },
    { cLow: 10.1, cHigh: 17.0, iLow: 201, iHigh: 300 },
    { cLow: 17.1, cHigh: 34.0, iLow: 301, iHigh: 400 },
    { cLow: 34.1, cHigh: 50.0, iLow: 401, iHigh: 500 },
  ],
  o3: [
    { cLow: 0, cHigh: 50, iLow: 0, iHigh: 50 },
    { cLow: 51, cHigh: 100, iLow: 51, iHigh: 100 },
    { cLow: 101, cHigh: 168, iLow: 101, iHigh: 200 },
    { cLow: 169, cHigh: 208, iLow: 201, iHigh: 300 },
    { cLow: 209, cHigh: 748, iLow: 301, iHigh: 400 },
    { cLow: 749, cHigh: 1000, iLow: 401, iHigh: 500 },
  ],
};

/** CPCB NAQI Category Thresholds */
export const NAQI_THRESHOLDS = {
  GOOD_MAX: 50,
  SATISFACTORY_MAX: 100,
  MODERATE_MAX: 200,
  POOR_MAX: 300,
  VERY_POOR_MAX: 400,
  SEVERE_MAX: 500,
} as const;
