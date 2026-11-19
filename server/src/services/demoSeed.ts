import crypto from "node:crypto";
import { Container } from "../container.js";

export async function seedDemoData(c: Container): Promise<void> {
  try {
    const existing = await c.householdRepo.getHousehold("demo-household");
    if (existing) return;

    const now = c.clock.now();
    const expiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year

    // 1. Create Household Profile
    await c.householdRepo.createHousehold(
      {
        id: "demo-household",
        name: "Riya's Household (Delhi-NCR)",
        location: {
          name: "Delhi-NCR",
          lat: 28.6139,
          lng: 77.209,
        },
        members: [
          {
            id: "m-riya",
            name: "Riya",
            ageGroup: "adult",
            sensitiveFlags: {
              child: false,
              olderAdult: false,
              respiratoryCondition: false,
              pregnancy: false,
            },
            commuteMode: "metro",
            commuteDistanceKm: 12,
          },
          {
            id: "m-aarav",
            name: "Aarav",
            ageGroup: "child",
            sensitiveFlags: {
              child: true,
              olderAdult: false,
              respiratoryCondition: true,
              pregnancy: false,
            },
            commuteMode: "school_bus",
            commuteDistanceKm: 5,
          },
          {
            id: "m-dadaji",
            name: "Dadaji",
            ageGroup: "olderAdult",
            sensitiveFlags: {
              child: false,
              olderAdult: true,
              respiratoryCondition: false,
              pregnancy: false,
            },
            commuteMode: "walk",
            commuteDistanceKm: 2,
          },
        ],
        rooms: [
          {
            id: "r-living",
            name: "Living Room",
            volumeM3: 65,
            hasPurifier: true,
            purifierCadrM3h: 300,
            windowsHabit: "closed",
          },
          {
            id: "r-bedroom",
            name: "Master Bedroom",
            volumeM3: 45,
            hasPurifier: true,
            purifierCadrM3h: 220,
            windowsHabit: "closed",
          },
          {
            id: "r-kids",
            name: "Kids Room",
            volumeM3: 40,
            hasPurifier: false,
            purifierCadrM3h: 0,
            windowsHabit: "closed",
          },
        ],
        cookingFuel: "lpg",
        aiPersonalizationConsent: true,
        shareWithCommunityConsent: true,
        preferredLanguage: "en",
      },
      "demo-user-riya",
    );

    // 2. Create User Accounts
    await c.householdRepo.createUser({
      id: "demo-user-riya",
      email: "riya@saans.local",
      passwordHash: "demo",
      displayName: "Riya",
    });

    await c.householdRepo.createUser({
      id: "demo-user-dadaji",
      email: "dadaji@saans.local",
      passwordHash: "demo",
      displayName: "Dadaji",
    });

    await c.householdRepo.createUser({
      id: "demo-user-kulkarni",
      email: "kulkarni@saans.local",
      passwordHash: "demo",
      displayName: "Mr. Kulkarni",
    });

    // 3. Create Memberships
    await c.householdRepo.createMembership({
      userId: "demo-user-dadaji",
      householdId: "demo-household",
      role: "MEMBER",
      scopes: ["READ"],
      status: "ACTIVE",
    });

    await c.householdRepo.createMembership({
      userId: "demo-user-kulkarni",
      householdId: "demo-household",
      role: "OWNER",
      scopes: ["READ", "CREATE", "UPDATE", "DELETE", "INVITE", "REVOKE", "AUDIT"],
      status: "ACTIVE",
    });

    // 4. Create Active Sessions with Fixed Demo Tokens
    const personas = [
      { token: "demo-token-riya", userId: "demo-user-riya" },
      { token: "demo-token-dadaji", userId: "demo-user-dadaji" },
      { token: "demo-token-kulkarni", userId: "demo-user-kulkarni" },
    ];

    for (const p of personas) {
      const tokenHash = crypto.createHash("sha256").update(p.token).digest("hex");
      await c.householdRepo.createSession({
        tokenHash,
        userId: p.userId,
        householdId: "demo-household",
        expiresAt,
      });
    }
  } catch (err) {
    console.warn("Demo data seeding notice:", err);
  }
}
