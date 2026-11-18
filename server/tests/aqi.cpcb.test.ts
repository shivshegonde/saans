import { describe, it, expect } from "vitest";
import {
  calculateNaqi,
  computeSubIndex,
  getCategoryFromNaqi,
  computeUsEpaAqi,
} from "../src/core/aqi.js";

describe("CPCB NAQI Calculations (aqi.cpcb.test)", () => {
  it("verifies CPCB PM2.5 breakpoint sub-indices across all bands", () => {
    // Band 1: Good (0-30 -> 0-50)
    expect(computeSubIndex("pm25", 0)).toBe(0);
    expect(computeSubIndex("pm25", 15)).toBe(25);
    expect(computeSubIndex("pm25", 30)).toBe(50);

    // Band 2: Satisfactory (31-60 -> 51-100)
    expect(computeSubIndex("pm25", 31)).toBe(51);
    expect(computeSubIndex("pm25", 60)).toBe(100);

    // Band 3: Moderate (61-90 -> 101-200)
    expect(computeSubIndex("pm25", 61)).toBe(101);
    expect(computeSubIndex("pm25", 90)).toBe(200);

    // Band 4: Poor (91-120 -> 201-300)
    expect(computeSubIndex("pm25", 91)).toBe(201);
    expect(computeSubIndex("pm25", 120)).toBe(300);

    // Band 5: Very Poor (121-250 -> 301-400)
    expect(computeSubIndex("pm25", 121)).toBe(301);
    expect(computeSubIndex("pm25", 250)).toBe(400);

    // Band 6: Severe (251-500 -> 401-500)
    expect(computeSubIndex("pm25", 251)).toBe(401);
    expect(computeSubIndex("pm25", 350)).toBe(440);
    expect(computeSubIndex("pm25", 500)).toBe(500);
    expect(computeSubIndex("pm25", 600)).toBe(500); // capped at 500
    expect(computeSubIndex("pm25", 1000)).toBe(500); // beyond upper limit band
  });

  it("verifies CPCB PM10 breakpoints", () => {
    expect(computeSubIndex("pm10", 25)).toBe(25);
    expect(computeSubIndex("pm10", 75)).toBe(75);
    expect(computeSubIndex("pm10", 175)).toBe(150);
    expect(computeSubIndex("pm10", 300)).toBe(250);
    expect(computeSubIndex("pm10", 390)).toBe(350);
    expect(computeSubIndex("pm10", 500)).toBe(441);
  });

  it("computes overall NAQI and determines dominant pollutant", () => {
    const res = calculateNaqi({
      pm25: 110, // subindex: ~266 (Poor)
      pm10: 80, // subindex: 80 (Satisfactory)
      no2: 30, // subindex: 38 (Good)
    });

    expect(res.aqi).toBe(266);
    expect(res.category).toBe("Poor");
    expect(res.dominantPollutant).toBe("PM2.5");
  });

  it("maps categories correctly", () => {
    expect(getCategoryFromNaqi(45)).toBe("Good");
    expect(getCategoryFromNaqi(80)).toBe("Satisfactory");
    expect(getCategoryFromNaqi(150)).toBe("Moderate");
    expect(getCategoryFromNaqi(250)).toBe("Poor");
    expect(getCategoryFromNaqi(350)).toBe("Very Poor");
    expect(getCategoryFromNaqi(450)).toBe("Severe");
  });

  it("handles negative or unknown pollutant inputs gracefully", () => {
    expect(computeSubIndex("unknown", 50)).toBe(0);
    expect(computeSubIndex("pm25", -10)).toBe(0);
  });

  it("computes US EPA AQI mapping accurately", () => {
    expect(computeUsEpaAqi(4.5)).toBe(25);
    expect(computeUsEpaAqi(15.0)).toBe(62);
    expect(computeUsEpaAqi(45.0)).toBe(124);
    expect(computeUsEpaAqi(80.0)).toBe(168);
    expect(computeUsEpaAqi(150.0)).toBe(225);
    expect(computeUsEpaAqi(300.0)).toBe(355);
    expect(computeUsEpaAqi(550.0)).toBe(500); // extreme cap
    expect(computeUsEpaAqi(-5)).toBe(0);
  });
});
