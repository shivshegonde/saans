import { describe, it, expect } from "vitest";
import { simulateIndoorAir, findBestVentilationWindow } from "../src/core/indoor.js";

describe("Indoor Mass-Balance Model (indoor.massBalance.test)", () => {
  it("computes steady-state PM2.5 in a sealed room without purifier", () => {
    // Room: 20 m², 2.8m height -> 56 m³
    // Closed windows: a = 0.4 h⁻¹, k = 0.25 h⁻¹, P = 0.8, Cout = 200 µg/m³
    // steady state = (0.8 * 0.4 * 200) / (0.4 + 0.25) = 64 / 0.65 = 98.46 µg/m³
    const res = simulateIndoorAir(
      {
        name: "Bedroom",
        areaM2: 20,
        windowsOpen: false,
        purifierCadrM3h: 0,
      },
      { cOutUgM3: 200 },
    );

    expect(res.steadyStateCinUgM3).toBeCloseTo(98.5, 0);
    expect(res.indoorOutdoorRatio).toBeLessThan(1.0);
    expect(res.isSafeForSensitiveGroups).toBe(false);
  });

  it("demonstrates rapid purification when appropriately sized HEPA purifier runs", () => {
    // Purifier CADR = 250 m³/h
    // lambda = 0.4 + 0.25 + 250/56 = 0.65 + 4.46 = 5.11 h⁻¹
    // steady state = 64 / 5.11 = 12.5 µg/m³ (Safe under 15 µg/m³ WHO limit!)
    const res = simulateIndoorAir(
      {
        name: "Bedroom",
        areaM2: 20,
        windowsOpen: false,
        purifierCadrM3h: 250,
      },
      { cOutUgM3: 200 },
    );

    expect(res.steadyStateCinUgM3).toBeLessThan(15);
    expect(res.isSafeForSensitiveGroups).toBe(true);
    expect(res.indoorOutdoorRatio).toBeLessThan(0.1);
  });

  it("calculates indoor PM spike when cooking without exhaust", () => {
    const res = simulateIndoorAir(
      {
        name: "Kitchen",
        areaM2: 12,
        windowsOpen: false,
        purifierCadrM3h: 0,
        activeSource: "cooking", // S = 12,000 µg/h
      },
      { cOutUgM3: 100 },
    );

    expect(res.steadyStateCinUgM3).toBeGreaterThan(400); // severe indoor spike
  });

  it("finds best ventilation window and advises properly", () => {
    const forecast = [
      { timeIso: "2026-11-18T06:00:00Z", pm25: 350 },
      { timeIso: "2026-11-18T07:00:00Z", pm25: 320 },
      { timeIso: "2026-11-18T12:00:00Z", pm25: 45 },
      { timeIso: "2026-11-18T13:00:00Z", pm25: 50 },
      { timeIso: "2026-11-18T18:00:00Z", pm25: 280 },
    ];

    const window = findBestVentilationWindow(forecast, 80);
    expect(window.shouldVentilate).toBe(true);
    expect(window.minOutdoorPm25).toBeLessThan(60);
    expect(window.reason).toContain("Ventilate between 12:00 and 13:00");
  });

  it("advises against ventilation when outdoor air is worse than indoor air and exceeds 60", () => {
    const forecast = [
      { timeIso: "2026-11-18T10:00:00Z", pm25: 85 },
      { timeIso: "2026-11-18T11:00:00Z", pm25: 85 },
    ];
    const window = findBestVentilationWindow(forecast, 40);
    expect(window.shouldVentilate).toBe(false);
    expect(window.reason).toContain("Keep windows closed");
  });

  it("returns fallback window when forecast is empty", () => {
    const window = findBestVentilationWindow([], 50);
    expect(window.shouldVentilate).toBe(false);
    expect(window.reason).toContain("No forecast hours available");
  });
});
