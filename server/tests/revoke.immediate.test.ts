import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../src/server.js";
import { createContainer } from "../src/container.js";
import { FakeClock } from "../src/adapters/fakeClock.js";

describe("Instant Member Revocation (FR-13, Invariants)", () => {
  let app: ReturnType<typeof createApp>;
  let clock: FakeClock;
  let ownerToken: string;
  let householdId: string;
  let memberToken: string;
  let memberUserId: string;

  beforeEach(async () => {
    clock = new FakeClock();
    const container = createContainer({ clock });
    app = createApp(container);

    // 1. Register Owner
    const ownerRes = await request(app)
      .post("/api/v1/auth/register")
      .send({
        email: "owner@delhi.local",
        password: "OwnerPassword123!",
        displayName: "Owner",
        householdName: "Shared Household",
        location: { name: "Delhi", lat: 28.6, lng: 77.2 },
      });
    ownerToken = ownerRes.body.token;
    householdId = ownerRes.body.household.id;

    // 2. Register prospective member
    const memberReg = await request(app)
      .post("/api/v1/auth/register")
      .send({
        email: "member@delhi.local",
        password: "MemberPassword123!",
        displayName: "Dadaji",
        householdName: "Temp",
        location: { name: "Delhi", lat: 28.6, lng: 77.2 },
      });
    memberUserId = memberReg.body.user.id;

    // 3. Owner creates invitation
    const invRes = await request(app)
      .post("/api/v1/household/invitations")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({
        scopes: ["VIEW_PLAN", "LOG_ACTIONS"],
        expiresInDays: 7,
      });
    const invitationToken = invRes.body.token;

    // 4. Member joins household using invitation token
    await request(app)
      .post("/api/v1/household/invitations/join")
      .set("Authorization", `Bearer ${memberReg.body.token}`)
      .send({ token: invitationToken });

    // 5. Member logs in to establish session with the shared household
    const loginRes = await request(app).post("/api/v1/auth/login").send({
      email: "member@delhi.local",
      password: "MemberPassword123!",
      householdId,
    });
    memberToken = loginRes.body.token;
  });

  it("member has access initially, but loses access immediately on revocation", async () => {
    // Member makes successful request
    const beforeRevoke = await request(app)
      .get("/api/v1/plan/today")
      .set("Authorization", `Bearer ${memberToken}`);
    expect(beforeRevoke.status).toBe(200);

    // Owner revokes member
    const revokeRes = await request(app)
      .delete(`/api/v1/household/members/${memberUserId}`)
      .set("Authorization", `Bearer ${ownerToken}`);
    expect(revokeRes.status).toBe(204);

    // Member's very next request is rejected immediately with 401
    const afterRevoke = await request(app)
      .get("/api/v1/plan/today")
      .set("Authorization", `Bearer ${memberToken}`);
    expect(afterRevoke.status).toBe(401);
  });
});
