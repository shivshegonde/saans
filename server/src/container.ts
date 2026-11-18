import { Clock } from "./core/ports/clock.js";
import { SystemClock } from "./adapters/systemClock.js";
import { FakeClock } from "./adapters/fakeClock.js";
import { AirQualityProvider } from "./core/ports/airProvider.js";
import { ScenarioProvider } from "./adapters/scenarioProvider.js";
import { OpenMeteoProvider } from "./adapters/openMeteoProvider.js";
import { ProviderChain } from "./adapters/providerChain.js";
import { config, Config } from "./config.js";

export interface Container {
  clock: Clock;
  airProvider: AirQualityProvider;
  scenarioProvider: ScenarioProvider;
  config: Config;
}

export function createContainer(overrides?: {
  clock?: Clock;
  airProvider?: AirQualityProvider;
  config?: Config;
}): Container {
  const cfg = overrides?.config || config;
  const clock = overrides?.clock || (cfg.NODE_ENV === "test" ? new FakeClock() : new SystemClock());

  const scenario = new ScenarioProvider(clock, "Severe");
  const openMeteo = new OpenMeteoProvider(clock);

  // Parse provider order from config
  const providerList: AirQualityProvider[] = [];
  const order = cfg.AQ_PROVIDER_ORDER.split(",").map((s) => s.trim().toLowerCase());

  for (const p of order) {
    if (p === "openmeteo") providerList.push(openMeteo);
    if (p === "scenario") providerList.push(scenario);
  }
  // Ensure at least scenario is in the chain
  if (providerList.length === 0) {
    providerList.push(scenario);
  }

  const chain = overrides?.airProvider || new ProviderChain(providerList, clock);

  return {
    clock,
    airProvider: chain,
    scenarioProvider: scenario,
    config: cfg,
  };
}

export const container = createContainer();
