/**
 * Atmospheric Smog Drivers Engine.
 * Classifies meteorological contributors to urban winter pollution episodes.
 *
 * Citations:
 * 1. World Meteorological Organization (WMO): "Air Quality and Climate Bulletin" (2022).
 * 2. Indian Institute of Tropical Meteorology (IITM) SAFAR: "Meteorological factors
 *    influencing winter smog and particulate trapping in the Indo-Gangetic Plains" (2020).
 */

export interface WeatherConditions {
  windSpeedKmh: number;
  humidityPct: number;
  temperatureC: number;
  mixingLayerHeightM?: number; // Boundary layer height in meters
}

export interface SmogDriver {
  id: string;
  name: string;
  explanation: string;
  severity: "low" | "moderate" | "high";
}

// Threshold constants with meteorological rationale
/** Winds under 5 km/h result in stagnant air and minimal horizontal dispersion */
export const STAGNANT_WIND_THRESHOLD_KMH = 5.0;

/** Winds between 5 and 10 km/h offer weak horizontal ventilation */
export const LIGHT_WIND_THRESHOLD_KMH = 10.0;

/** Relative humidity > 70% promotes secondary inorganic aerosol formation and smog fog */
export const HIGH_HUMIDITY_THRESHOLD_PCT = 70.0;

/** Low temperatures (< 15°C) in winter promote nocturnal radiational surface cooling and inversions */
export const COLD_TEMPERATURE_THRESHOLD_C = 15.0;

/** Boundary mixing layer below 400m compresses pollutant volume vertically */
export const SHALLOW_MIXING_HEIGHT_M = 400.0;

function getWindDriver(windSpeedKmh: number): SmogDriver | null {
  if (windSpeedKmh <= STAGNANT_WIND_THRESHOLD_KMH) {
    return {
      id: "stagnant-wind",
      name: "Stagnant winds",
      explanation: `Winds are calm (${windSpeedKmh} km/h), preventing horizontal ventilation and dispersion of localized emissions.`,
      severity: "high",
    };
  }
  if (windSpeedKmh <= LIGHT_WIND_THRESHOLD_KMH) {
    return {
      id: "light-breeze",
      name: "Light breeze",
      explanation: `Wind speed is modest (${windSpeedKmh} km/h), providing only partial dispersion of urban pollutants.`,
      severity: "moderate",
    };
  }
  return null;
}

export function classifySmogDrivers(weather: WeatherConditions): SmogDriver[] {
  const drivers: SmogDriver[] = [];

  const windDriver = getWindDriver(weather.windSpeedKmh);
  if (windDriver) drivers.push(windDriver);

  if (weather.temperatureC <= COLD_TEMPERATURE_THRESHOLD_C) {
    drivers.push({
      id: "thermal-inversion",
      name: "Ground-level thermal inversion",
      explanation: `Cool surface temperatures (${weather.temperatureC}°C) form a cold air trap underneath warmer air aloft, locking emissions near ground level.`,
      severity: weather.temperatureC <= 10.0 ? "high" : "moderate",
    });
  }

  if (weather.humidityPct >= HIGH_HUMIDITY_THRESHOLD_PCT) {
    drivers.push({
      id: "high-humidity",
      name: "High moisture & haze",
      explanation: `High relative humidity (${weather.humidityPct}%) binds to particulate matter and accelerates secondary aerosol formation.`,
      severity: weather.humidityPct >= 85.0 ? "high" : "moderate",
    });
  }

  if (
    weather.mixingLayerHeightM !== undefined &&
    weather.mixingLayerHeightM <= SHALLOW_MIXING_HEIGHT_M
  ) {
    drivers.push({
      id: "shallow-boundary-layer",
      name: "Shallow mixing layer",
      explanation: `Atmospheric boundary layer is compressed to ${weather.mixingLayerHeightM} m, concentrating pollutants in a small volume.`,
      severity: "high",
    });
  }

  if (drivers.length === 0) {
    drivers.push({
      id: "dispersive-atmosphere",
      name: "Active dispersion",
      explanation: `Moderate winds (${weather.windSpeedKmh} km/h) and low humidity allow normal atmospheric mixing.`,
      severity: "low",
    });
  }

  return drivers;
}
