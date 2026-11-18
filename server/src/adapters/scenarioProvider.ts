import { AirNowResponse, NaqiCategory } from "shared";
import {
  AirQualityProvider,
  AirForecastResponse,
  GeoLocation,
  AirForecastHour,
} from "../core/ports/airProvider.js";
import { Clock } from "../core/ports/clock.js";

export type AirScenario = "Clean" | "Moderate" | "Poor" | "Severe" | "Hazardous";

interface ScenarioProfile {
  aqi: number;
  pm25: number;
  pm10: number;
  category: NaqiCategory;
  headline: string;
  drivers: Array<{
    id: string;
    name: string;
    explanation: string;
    severity: "low" | "moderate" | "high";
  }>;
}

const SCENARIOS: Record<AirScenario, ScenarioProfile> = {
  Clean: {
    aqi: 35,
    pm25: 12,
    pm10: 25,
    category: "Good",
    headline: "Clean and refreshing air. Great conditions for all outdoor activities.",
    drivers: [
      {
        id: "brisk-wind",
        name: "Brisk winds",
        explanation: "Fresh breeze dispersing localized emissions rapidly.",
        severity: "low",
      },
    ],
  },
  Moderate: {
    aqi: 145,
    pm25: 68,
    pm10: 110,
    category: "Moderate",
    headline:
      "Moderate haze. Sensitive individuals should consider reducing intense outdoor exertion.",
    drivers: [
      {
        id: "traffic",
        name: "Urban traffic",
        explanation: "Vehicular exhaust accumulating in calm boundary layer.",
        severity: "moderate",
      },
    ],
  },
  Poor: {
    aqi: 260,
    pm25: 115,
    pm10: 190,
    category: "Poor",
    headline:
      "Unhealthy air quality. Mask recommended outdoors; limit ventilation to cleanest hours.",
    drivers: [
      {
        id: "inversion",
        name: "Shallow inversion",
        explanation: "Cool surface layer trapping nighttime combustion emissions.",
        severity: "high",
      },
    ],
  },
  Severe: {
    aqi: 410,
    pm25: 285,
    pm10: 440,
    category: "Severe",
    headline:
      "Severe winter smog episode. Keep windows closed; run purifiers and avoid outdoor exercise.",
    drivers: [
      {
        id: "calm-winds",
        name: "Stagnant winds",
        explanation: "Wind speed below 3 km/h preventing any dispersion.",
        severity: "high",
      },
      {
        id: "inversion-trap",
        name: "Ground-level inversion",
        explanation: "Dense thermal ceiling trapping high-density particulate matter.",
        severity: "high",
      },
      {
        id: "humidity",
        name: "High morning humidity",
        explanation: "Moisture binding to particulates and forming dense smog.",
        severity: "high",
      },
    ],
  },
  Hazardous: {
    aqi: 490,
    pm25: 420,
    pm10: 610,
    category: "Severe",
    headline: "Hazardous emergency conditions. Strictly remain indoors with air filtration.",
    drivers: [
      {
        id: "emergency-inversion",
        name: "Complete atmospheric lockdown",
        explanation: "Zero wind, extreme regional biomass and urban particulate accumulation.",
        severity: "high",
      },
    ],
  },
};

export class ScenarioProvider implements AirQualityProvider {
  readonly name = "ScenarioProvider";
  private activeScenario: AirScenario = "Severe";

  constructor(
    private readonly clock: Clock,
    initialScenario: AirScenario = "Severe",
  ) {
    this.activeScenario = initialScenario;
  }

  setScenario(scenario: AirScenario): void {
    this.activeScenario = scenario;
  }

  getScenario(): AirScenario {
    return this.activeScenario;
  }

  async getCurrent(loc: GeoLocation): Promise<AirNowResponse> {
    const profile = SCENARIOS[this.activeScenario];
    const whoMultiple = Number((profile.pm25 / 15).toFixed(1));

    return {
      location: {
        name: loc.name || "Delhi-NCR (Simulated)",
        lat: loc.lat,
        lng: loc.lng,
      },
      aqi: profile.aqi,
      category: profile.category,
      dominantPollutant: "PM2.5",
      whoMultiple: whoMultiple,
      pollutants: {
        pm25: profile.pm25,
        pm10: profile.pm10,
        no2: 45,
        so2: 12,
        co: 1.2,
        o3: 28,
      },
      summaryHeadline: profile.headline,
      smogDrivers: profile.drivers,
      provenance: {
        source: `ScenarioProvider (${this.activeScenario})`,
        fetchedAt: this.clock.nowIso(),
        isStale: false,
      },
    };
  }

  async getForecast(loc: GeoLocation, hours: number): Promise<AirForecastResponse> {
    const current = await this.getCurrent(loc);
    const forecastHours: AirForecastHour[] = [];
    const basePm = current.pollutants.pm25;

    for (let i = 0; i < hours; i++) {
      const time = new Date(this.clock.nowMs() + i * 3600 * 1000);
      const hourOfDay = time.getUTCHours();
      // Diurnal curve: peaks in morning (02:00-05:00 UTC = 07:30-10:30 IST) and evening
      const diurnalFactor = 1 + 0.25 * Math.sin(((hourOfDay - 3) / 24) * 2 * Math.PI);
      const pm25 = Math.round(basePm * diurnalFactor);
      const aqi = Math.min(500, Math.round(pm25 * 1.4));

      let category: NaqiCategory = "Good";
      if (aqi > 50 && aqi <= 100) category = "Satisfactory";
      else if (aqi > 100 && aqi <= 250) category = "Moderate";
      else if (aqi > 250 && aqi <= 350) category = "Poor";
      else if (aqi > 350 && aqi <= 430) category = "Very Poor";
      else if (aqi > 430) category = "Severe";

      forecastHours.push({
        timeIso: time.toISOString(),
        aqi: aqi,
        pm25: pm25,
        pm10: Math.round(pm25 * 1.6),
        category: category,
        dominantPollutant: "PM2.5",
        temperatureC: 18 + Math.round(6 * Math.sin(((hourOfDay - 6) / 24) * 2 * Math.PI)),
        humidityPct: 65 - Math.round(20 * Math.sin(((hourOfDay - 6) / 24) * 2 * Math.PI)),
        windSpeedKmh: 4 + Math.round(3 * Math.sin(((hourOfDay - 10) / 24) * 2 * Math.PI)),
      });
    }

    return {
      location: loc,
      hours: forecastHours,
      provenance: {
        source: `ScenarioProvider (${this.activeScenario})`,
        fetchedAt: this.clock.nowIso(),
        isStale: false,
      },
    };
  }
}
