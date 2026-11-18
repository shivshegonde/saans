import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../src/server.js";
import { createContainer } from "../src/container.js";
import { FakeClock } from "../src/adapters/fakeClock.js";

describe("CrossTenant Isolation Matrix (Pillar 3 Security)", () => {
  let app: ReturnType<typeof createApp>;
  let clock: FakeClock;
  let tokenA: string;
  let householdAId: string;
  let tokenB: string;
  let householdBId: string;

  beforeEach(async () => {
    clock = new FakeClock();
    const container = createContainer({ clock });
    app = createApp(container);

    // Register User A
    const resA = await request(app)
      .post("/api/v1/auth/register")
      .send({
        email: "userA@delhi.local",
        password: "Password123!",
        displayName: "User A",
        householdName: "Household A",
        location: { name: "Delhi", lat: 28.6, lng: 77.2 },
      });
    tokenA = resA.body.token;
    householdAId = resA.body.household.id;

    // Register User B
    const resB = await request(app)
      .post("/api/v1/auth/register")
      .send({
        email: "userB@delhi.local",
        password: "Password123!",
        displayName: "User B",
        householdName: "Household B",
        location: { name: "Delhi", lat: 28.6, lng: 77.2 },
      });
    tokenB = resB.body.token;
    householdBId = resB.body.household.id;
  });

  it("User B only reads Household B profile, never Household A", async () => {
    const res = await request(app)
      .get("/api/v1/household")
      .set("Authorization", `Bearer ${tokenB}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(householdBId);
    expect(res.body.name).toBe("Household B");
    expect(res.body.id).not.toBe(householdAId);
  });

  it("User B cannot revoke an invitation or member belonging to Household A", async () => {
    // User A creates an invitation in Household A
    const invRes = await request(app)
      .post("/api/v1/household/invitations")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({
        scopes: ["VIEW_PLAN"],
        expiresInDays: 7,
      });
    const invitationAId = invRes.body.invitation.id;

    // User B attempts to revoke User A's invitation
    const revokeRes = await request(app)
      .delete(`/api/v1/household/invitations/${invitationAId}`)
      .set("Authorization", `Bearer ${tokenB}`);

    // Fails with 404 (invitation not in household B) or 403
    expect([403, 404]).toContain(revokeRes.status);
  });

  it("User B cannot read Household A audit trail", async () => {
    const res = await request(app)
      .get("/api/v1/analytics/audit")
      .set("Authorization", `Bearer ${tokenB}`);

    expect(res.status).toBe(200);
    // Every log returned must belong strictly to Household B
    for (const log of res.body) {
      expect(log.tenantId).toBe(householdBId);
      expect(log.tenantId).not.toBe(householdAId);
    }
  });

  it("User B cannot read Household A outbox items", async () => {
    const res = await request(app)
      .get("/api/v1/alerts/outbox")
      .set("Authorization", `Bearer ${tokenB}`);

    expect(res.status).toBe(200);
    for (const item of res.body) {
      expect(item.tenantId).toBe(householdBId);
      expect(item.tenantId).not.toBe(householdAId);
    }
  });
});
