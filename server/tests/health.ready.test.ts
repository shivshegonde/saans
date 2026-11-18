import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../src/server.js";
import { createContainer } from "../src/container.js";
import { FakeClock } from "../src/adapters/fakeClock.js";

describe("Health and Readiness Probes (health.ready.test)", () => {
  const fakeClock = new FakeClock("2026-11-18T10:00:00Z");
  const testContainer = createContainer({ clock: fakeClock });
  const app = createApp(testContainer);

  it("GET /health returns 200 with pass status and timestamp", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("pass");
    expect(res.body.timestamp).toBe("2026-11-18T10:00:00.000Z");
    expect(typeof res.body.uptimeSeconds).toBe("number");
  });

  it("GET /ready returns 200 with CONNECTED dependencies", async () => {
    const res = await request(app).get("/ready");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("CONNECTED");
    expect(res.body.checks.database).toBe("CONNECTED");
    expect(res.body.checks.airQualityProvider).toBe("CONNECTED");
  });
});
