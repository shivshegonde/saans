import { AirNowResponse } from "shared";
import { AirQualityProvider, AirForecastResponse, GeoLocation } from "../core/ports/airProvider.js";
import { Clock } from "../core/ports/clock.js";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttlMs: number;
}

export class ProviderChain implements AirQualityProvider {
  readonly name = "ProviderChain";
  private cacheCurrent = new Map<string, CacheEntry<AirNowResponse>>();
  private cacheForecast = new Map<string, CacheEntry<AirForecastResponse>>();
  private inflightCurrent = new Map<string, Promise<AirNowResponse>>();
  private inflightForecast = new Map<string, Promise<AirForecastResponse>>();
  private failureCounts = new Map<string, number>();

  constructor(
    private readonly providers: AirQualityProvider[],
    private readonly clock: Clock,
  ) {}

  private getGridKey(loc: GeoLocation): string {
    // 0.05 degree grid cell keying (~5 km)
    const latGrid = (Math.round(loc.lat * 20) / 20).toFixed(2);
    const lngGrid = (Math.round(loc.lng * 20) / 20).toFixed(2);
    return `${latGrid}:${lngGrid}`;
  }

  async getCurrent(loc: GeoLocation): Promise<AirNowResponse> {
    const key = this.getGridKey(loc);
    const now = this.clock.nowMs();
    const cached = this.cacheCurrent.get(key);

    if (cached && now - cached.timestamp < cached.ttlMs) {
      return cached.data;
    }

    if (this.inflightCurrent.has(key)) {
      return this.inflightCurrent.get(key)!;
    }

    const fetchPromise = (async () => {
      let lastError: Error | null = null;

      for (const provider of this.providers) {
        const failures = this.failureCounts.get(provider.name) || 0;
        // Simple circuit breaker: skip if 3 consecutive failures recently
        if (failures >= 3) {
          continue;
        }

        try {
          const res = await provider.getCurrent(loc);
          this.failureCounts.set(provider.name, 0); // reset on success
          this.cacheCurrent.set(key, {
            data: res,
            timestamp: now,
            ttlMs: 30 * 60 * 1000, // 30 min TTL
          });
          return res;
        } catch (err) {
          this.failureCounts.set(provider.name, failures + 1);
          lastError = err instanceof Error ? err : new Error(String(err));
        }
      }

      // If all failed, return stale cache if available
      if (cached) {
        return {
          ...cached.data,
          provenance: {
            ...cached.data.provenance,
            isStale: true,
          },
        };
      }

      throw lastError || new Error("All air quality providers in chain failed");
    })();

    this.inflightCurrent.set(key, fetchPromise);
    try {
      return await fetchPromise;
    } finally {
      this.inflightCurrent.delete(key);
    }
  }

  async getForecast(loc: GeoLocation, hours: number): Promise<AirForecastResponse> {
    const key = `${this.getGridKey(loc)}:${hours}`;
    const now = this.clock.nowMs();
    const cached = this.cacheForecast.get(key);

    if (cached && now - cached.timestamp < cached.ttlMs) {
      return cached.data;
    }

    if (this.inflightForecast.has(key)) {
      return this.inflightForecast.get(key)!;
    }

    const fetchPromise = (async () => {
      let lastError: Error | null = null;

      for (const provider of this.providers) {
        const failures = this.failureCounts.get(provider.name) || 0;
        if (failures >= 3) continue;

        try {
          const res = await provider.getForecast(loc, hours);
          this.failureCounts.set(provider.name, 0);
          this.cacheForecast.set(key, {
            data: res,
            timestamp: now,
            ttlMs: 3 * 3600 * 1000, // 3h TTL
          });
          return res;
        } catch (err) {
          this.failureCounts.set(provider.name, failures + 1);
          lastError = err instanceof Error ? err : new Error(String(err));
        }
      }

      if (cached) {
        return {
          ...cached.data,
          provenance: {
            ...cached.data.provenance,
            isStale: true,
          },
        };
      }

      throw lastError || new Error("All air forecast providers in chain failed");
    })();

    this.inflightForecast.set(key, fetchPromise);
    try {
      return await fetchPromise;
    } finally {
      this.inflightForecast.delete(key);
    }
  }
}
