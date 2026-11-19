import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../src/server.js";
import { createContainer } from "../src/container.js";
import { FakeClock } from "../src/adapters/fakeClock.js";

describe("Sensitive Operation Protection (Section 9 Security & Privacy)", () => {
  let app: ReturnType<typeof createApp>;
  let clock: FakeClock;
  let ownerToken: string;

  beforeEach(async () => {
    clock = new FakeClock();
    const container = createContainer({ clock });
    app = createApp(container);

    const reg = await request(app)
      .post("/api/v1/auth/register")
      .send({
        email: "secowner@delhi.local",
        password: "OwnerSecPassword123!",
        displayName: "Security Owner",
        householdName: "Security Test Household",
        location: { name: "Delhi", lat: 28.6, lng: 77.2 },
      });

    ownerToken = reg.body.token;
  });

  it("rejects household deletion when confirmation header or body is missing", async () => {
    const res = await request(app)
      .delete("/api/v1/household")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ stepUpPassword: "OwnerSecPassword123!" });

    expect(res.status).toBe(400);
    expect(res.body.detail).toContain("x-confirm-action");
  });

  it("rejects household deletion when step-up password is missing", async () => {
    const res = await request(app)
      .delete("/api/v1/household")
      .set("Authorization", `Bearer ${ownerToken}`)
      .set("x-confirm-action", "true")
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.detail).toContain("Step-up password confirmation required");
  });

  it("rejects household deletion when step-up password is wrong", async () => {
    const res = await request(app)
      .delete("/api/v1/household")
      .set("Authorization", `Bearer ${ownerToken}`)
      .set("x-confirm-action", "true")
      .send({ stepUpPassword: "WrongPassword999!" });

    expect(res.status).toBe(401);
    expect(res.body.detail).toContain("Invalid step-up password");
  });

  it("accepts deletion with valid header confirmation and correct step-up password", async () => {
    const res = await request(app)
      .delete("/api/v1/household")
      .set("Authorization", `Bearer ${ownerToken}`)
      .set("x-confirm-action", "true")
      .send({ stepUpPassword: "OwnerSecPassword123!" });

    expect(res.status).toBe(204);

    // Further requests with old token fail because household and sessions are purged
    const followUp = await request(app)
      .get("/api/v1/household")
      .set("Authorization", `Bearer ${ownerToken}`);

    expect([401, 403]).toContain(followUp.status);
  });

  it("rejects household data export without confirmation and step-up password", async () => {
    const noConfirm = await request(app)
      .post("/api/v1/household/export")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ stepUpPassword: "OwnerSecPassword123!" });
    expect(noConfirm.status).toBe(400);

    const noPassword = await request(app)
      .post("/api/v1/household/export")
      .set("Authorization", `Bearer ${ownerToken}`)
      .set("x-confirm-action", "true")
      .send({});
    expect(noPassword.status).toBe(400);

    const wrongPassword = await request(app)
      .post("/api/v1/household/export")
      .set("Authorization", `Bearer ${ownerToken}`)
      .set("x-confirm-action", "true")
      .send({ stepUpPassword: "WrongPassword999!" });
    expect(wrongPassword.status).toBe(401);
  });

  it("successfully exports full household data with valid step-up confirmation", async () => {
    const res = await request(app)
      .post("/api/v1/household/export")
      .set("Authorization", `Bearer ${ownerToken}`)
      .set("x-confirm-action", "true")
      .send({ stepUpPassword: "OwnerSecPassword123!" });

    expect(res.status).toBe(200);
    expect(res.body.household.name).toBe("Security Test Household");
    expect(res.body.exportedAt).toBeDefined();
    expect(Array.isArray(res.body.members)).toBe(true);
  });
});
