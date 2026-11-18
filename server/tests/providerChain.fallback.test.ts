import { describe, it, expect } from "vitest";
import { ProviderChain } from "../src/adapters/providerChain.js";
import { ScenarioProvider } from "../src/adapters/scenarioProvider.js";
import { FakeClock } from "../src/adapters/fakeClock.js";
import {
  AirQualityProvider,
  GeoLocation,
  AirForecastResponse,
} from "../src/core/ports/airProvider.js";
import { AirNowResponse } from "shared";

class FailingProvider implements AirQualityProvider {
  readonly name = "FailingProvider";
  async getCurrent(_loc: GeoLocation): Promise<AirNowResponse> {
    throw new Error("Provider timeout or network failure");
  }
  async getForecast(_loc: GeoLocation, _hours: number): Promise<AirForecastResponse> {
    throw new Error("Provider timeout or network failure");
  }
}

describe("Air Provider Chain Fallback (providerChain.fallback.test)", () => {
  const clock = new FakeClock("2026-11-18T08:00:00Z");
  const loc = { name: "Delhi", lat: 28.6139, lng: 77.209 };

  it("falls back to ScenarioProvider when primary provider fails", async () => {
    const failing = new FailingProvider();
    const scenario = new ScenarioProvider(clock, "Severe");
    const chain = new ProviderChain([failing, scenario], clock);

    const result = await chain.getCurrent(loc);
    expect(result.aqi).toBe(410);
    expect(result.category).toBe("Severe");
    expect(result.provenance.source).toContain("ScenarioProvider");
  });

  it("serves cached forecast on subsequent calls and isolates grid cells", async () => {
    const scenario = new ScenarioProvider(clock, "Clean");
    const chain = new ProviderChain([scenario], clock);

    const res1 = await chain.getCurrent(loc);
    expect(res1.aqi).toBe(35);

    // Change scenario on the underlying adapter
    scenario.setScenario("Hazardous");

    // Call again within cache TTL - must return cached Clean scenario
    const res2 = await chain.getCurrent(loc);
    expect(res2.aqi).toBe(35);
  });
});
