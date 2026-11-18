import { AirNowResponse } from "shared";

export interface GeoLocation {
  name: string;
  lat: number;
  lng: number;
}

export interface AirForecastHour {
  timeIso: string;
  aqi: number;
  pm25: number;
  pm10?: number;
  category: "Good" | "Satisfactory" | "Moderate" | "Poor" | "Very Poor" | "Severe";
  dominantPollutant: string;
  temperatureC?: number;
  humidityPct?: number;
  windSpeedKmh?: number;
}

export interface AirForecastResponse {
  location: GeoLocation;
  hours: AirForecastHour[];
  provenance: {
    source: string;
    fetchedAt: string;
    isStale: boolean;
  };
}

export interface AirQualityProvider {
  readonly name: string;
  getCurrent(loc: GeoLocation): Promise<AirNowResponse>;
  getForecast(loc: GeoLocation, hours: number): Promise<AirForecastResponse>;
}
