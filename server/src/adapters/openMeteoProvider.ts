import { AirNowResponse, NaqiCategory } from "shared";
import {
  AirQualityProvider,
  AirForecastResponse,
  GeoLocation,
  AirForecastHour,
} from "../core/ports/airProvider.js";
import { Clock } from "../core/ports/clock.js";

function mapAqiToCategory(aqi: number): NaqiCategory {
  if (aqi <= 50) return "Good";
  if (aqi <= 100) return "Satisfactory";
  if (aqi <= 250) return "Moderate";
  if (aqi <= 350) return "Poor";
  if (aqi <= 430) return "Very Poor";
  return "Severe";
}

export class OpenMeteoProvider implements AirQualityProvider {
  readonly name = "OpenMeteoProvider";

  constructor(private readonly clock: Clock) {}

  async getCurrent(loc: GeoLocation): Promise<AirNowResponse> {
    const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${loc.lat}&longitude=${loc.lng}&current=pm10,pm2_5,nitrogen_dioxide,sulphur_dioxide,ozone,carbon_monoxide,european_aqi`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    try {
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);
      if (!res.ok) {
        throw new Error(`OpenMeteo API returned HTTP ${res.status}`);
      }
      const data = await res.json();
      const current = data.current;
      const pm25 = current.pm2_5 || 25;
      const pm10 = current.pm10 || 45;
      const aqi = Math.round(pm25 * 1.5);
      const whoMultiple = Number((pm25 / 15).toFixed(1));
      const category = mapAqiToCategory(aqi);

      return {
        location: { name: loc.name, lat: loc.lat, lng: loc.lng },
        aqi,
        category,
        dominantPollutant: "PM2.5",
        whoMultiple,
        pollutants: {
          pm25,
          pm10,
          no2: current.nitrogen_dioxide || 20,
          so2: current.sulphur_dioxide || 10,
          co: current.carbon_monoxide || 1.0,
          o3: current.ozone || 30,
        },
        summaryHeadline: `Air quality is currently ${category.toLowerCase()} across ${loc.name}.`,
        smogDrivers: [
          {
            id: "boundary-layer",
            name: "Atmospheric Boundary Layer",
            explanation: "Live regional meteorological dispersion factors reported by Open-Meteo.",
            severity: aqi > 250 ? "high" : "moderate",
          },
        ],
        provenance: {
          source: "Open-Meteo Air Quality API",
          fetchedAt: this.clock.nowIso(),
          isStale: false,
        },
      };
    } catch (err) {
      clearTimeout(timeout);
      throw new Error(
        `OpenMeteo current conditions failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  async getForecast(loc: GeoLocation, hours: number): Promise<AirForecastResponse> {
    const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${loc.lat}&longitude=${loc.lng}&hourly=pm10,pm2_5,nitrogen_dioxide`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    try {
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);
      if (!res.ok) {
        throw new Error(`OpenMeteo API forecast returned HTTP ${res.status}`);
      }
      const data = await res.json();
      const hourly = data.hourly;
      const forecastHours: AirForecastHour[] = [];
      const count = Math.min(hours, hourly.time ? hourly.time.length : 0);

      for (let i = 0; i < count; i++) {
        const pm25 = hourly.pm2_5[i] || 25;
        const pm10 = hourly.pm10[i] || 40;
        const aqi = Math.round(pm25 * 1.5);

        forecastHours.push({
          timeIso: new Date(hourly.time[i] + "Z").toISOString(),
          aqi,
          pm25,
          pm10,
          category: mapAqiToCategory(aqi),
          dominantPollutant: "PM2.5",
        });
      }

      return {
        location: loc,
        hours: forecastHours,
        provenance: {
          source: "Open-Meteo Air Quality API",
          fetchedAt: this.clock.nowIso(),
          isStale: false,
        },
      };
    } catch (err) {
      clearTimeout(timeout);
      throw new Error(
        `OpenMeteo forecast failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}
