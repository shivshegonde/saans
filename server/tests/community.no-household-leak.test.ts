import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../src/server.js";
import { createContainer } from "../src/container.js";
import { FakeClock } from "../src/adapters/fakeClock.js";

describe("Community Privacy Invariant: Zero Household Data Leakage (FR-14, Pillar 3 Security)", () => {
  let app: ReturnType<typeof createApp>;
  let clock: FakeClock;
  let adminToken: string;
  let communityId: string;

  beforeEach(async () => {
    clock = new FakeClock();
    const container = createContainer({ clock });
    app = createApp(container);

    // Register Community Admin
    const adminRes = await request(app)
      .post("/api/v1/auth/register")
      .send({
        email: "kulkarni@rwa.local",
        password: "AdminPassword123!",
        displayName: "Mr. Kulkarni",
        householdName: "Kulkarni House",
        location: { name: "Delhi", lat: 28.6, lng: 77.2 },
      });
    adminToken = adminRes.body.token;

    // Create Community
    const commRes = await request(app)
      .post("/api/v1/community")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Shanti Niketan RWA",
        description: "Community air action group",
      });
    communityId = commRes.body.id;
    const joinCode = commRes.body.joinCode;

    // Register 5 distinct households and join the community to meet k-anonymity (k=5)
    for (let i = 1; i <= 5; i++) {
      const reg = await request(app)
        .post("/api/v1/auth/register")
        .send({
          email: `family${i}@delhi.local`,
          password: "Password123!",
          displayName: `Family ${i}`,
          householdName: `Private Household ${i}`,
          location: { name: "Delhi", lat: 28.6, lng: 77.2 },
        });

      await request(app)
        .post("/api/v1/community/join")
        .set("Authorization", `Bearer ${reg.body.token}`)
        .send({ joinCode });
    }
  });

  it("community stats endpoint exposes ONLY aggregates and zero household-identifiable data", async () => {
    const res = await request(app)
      .get(`/api/v1/community/${communityId}/stats`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.kAnonymityMet).toBe(true);
    expect(res.body.contributingHouseholds).toBe(6); // 1 admin + 5 joined

    // Invariant check: Response must NEVER contain arrays of households, names, emails, or IDs
    expect(res.body.households).toBeUndefined();
    expect(res.body.members).toBeUndefined();
    expect(res.body.emails).toBeUndefined();
    expect(res.body.locations).toBeUndefined();

    const responseText = JSON.stringify(res.body);
    expect(responseText).not.toContain("family1@delhi.local");
    expect(responseText).not.toContain("Private Household 1");
  });
});
