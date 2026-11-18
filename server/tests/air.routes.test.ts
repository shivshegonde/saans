import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../src/server.js";
import { createContainer } from "../src/container.js";
import { FakeClock } from "../src/adapters/fakeClock.js";

describe("Air Routes (air.routes.test)", () => {
  const clock = new FakeClock("2026-11-18T10:00:00Z");
  const container = createContainer({ clock });
  const app = createApp(container);

  it("GET /api/v1/air/now returns live air conditions and NAQI category", async () => {
    const res = await request(app).get("/api/v1/air/now?lat=28.6139&lng=77.209&name=Delhi");
    expect(res.status).toBe(200);
    expect(res.body.location.name).toBe("Delhi");
    expect(res.body.aqi).toBeGreaterThan(0);
    expect(res.body.category).toBeDefined();
    expect(res.body.dominantPollutant).toBe("PM2.5");
    expect(res.body.pollutants.pm25).toBeGreaterThan(0);
    expect(res.body.smogDrivers.length).toBeGreaterThan(0);
    expect(res.body.provenance.source).toBeDefined();
  });

  it("GET /api/v1/air/forecast returns hourly series", async () => {
    const res = await request(app).get("/api/v1/air/forecast?lat=28.6139&lng=77.209&hours=24");
    expect(res.status).toBe(200);
    expect(res.body.hours.length).toBe(24);
    expect(res.body.hours[0].aqi).toBeGreaterThan(0);
    expect(res.body.hours[0].pm25).toBeGreaterThan(0);
  });
});
