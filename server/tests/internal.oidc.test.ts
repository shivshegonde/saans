import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../src/server.js";
import { createContainer } from "../src/container.js";
import { FakeClock } from "../src/adapters/fakeClock.js";

describe("Internal Routes OIDC Protection (internal.oidc.test)", () => {
  const clock = new FakeClock("2026-11-18T10:00:00Z");
  const container = createContainer({ clock });
  const app = createApp(container);

  it("rejects unauthenticated requests to /internal/alerts/evaluate with 401", async () => {
    const res = await request(app).post("/internal/alerts/evaluate").send({});
    expect(res.status).toBe(401);
    expect(res.body.title).toContain("Authentication Required");
  });

  it("rejects unauthenticated requests to /internal/outbox/process with 401", async () => {
    const res = await request(app).post("/internal/outbox/process").send({});
    expect(res.status).toBe(401);
  });

  it("accepts requests with valid OIDC authorization header", async () => {
    const res = await request(app)
      .post("/internal/outbox/process")
      .set("Authorization", "Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.valid-mock-oidc-token")
      .send({});
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("processed");
  });

  it("allows test bypass header in local/dev test harness", async () => {
    const res = await request(app)
      .post("/internal/demo/reset")
      .set("x-oidc-test", "valid")
      .send({});
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
