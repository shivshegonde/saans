import { describe, it, expect } from "vitest";
import { classifySmogDrivers } from "../src/core/smogDrivers.js";

describe("Smog Drivers Engine (smogDrivers.test)", () => {
  it("identifies high severity stagnant wind and inversion in severe Delhi winter", () => {
    const drivers = classifySmogDrivers({
      windSpeedKmh: 2.5,
      humidityPct: 88,
      temperatureC: 8.5,
      mixingLayerHeightM: 220,
    });

    expect(drivers.length).toBeGreaterThanOrEqual(4);
    const wind = drivers.find((d) => d.id === "stagnant-wind");
    expect(wind?.severity).toBe("high");
    expect(wind?.explanation).toContain("preventing horizontal ventilation");

    const inversion = drivers.find((d) => d.id === "thermal-inversion");
    expect(inversion?.severity).toBe("high");

    const boundary = drivers.find((d) => d.id === "shallow-boundary-layer");
    expect(boundary?.severity).toBe("high");
  });

  it("identifies dispersive conditions when winds are brisk and air is dry", () => {
    const drivers = classifySmogDrivers({
      windSpeedKmh: 18.0,
      humidityPct: 40,
      temperatureC: 24,
      mixingLayerHeightM: 1200,
    });

    expect(drivers.length).toBe(1);
    expect(drivers[0].id).toBe("dispersive-atmosphere");
    expect(drivers[0].severity).toBe("low");
  });

  it("identifies light breeze and moderate humidity when conditions are intermediate", () => {
    const drivers = classifySmogDrivers({
      windSpeedKmh: 8.0,
      humidityPct: 75,
      temperatureC: 13,
    });

    const wind = drivers.find((d) => d.id === "light-breeze");
    expect(wind?.severity).toBe("moderate");

    const humidity = drivers.find((d) => d.id === "high-humidity");
    expect(humidity?.severity).toBe("moderate");
  });
});
