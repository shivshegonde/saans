import { describe, it, expect, beforeEach } from "vitest";
import { FakeClock } from "../src/adapters/fakeClock.js";
import { MemoryCommunityRepository } from "../src/repositories/memory/memoryCommunityRepo.js";
import { MemoryAuditRepository } from "../src/repositories/memory/memoryAuditRepo.js";
import { MemoryOutboxRepository } from "../src/repositories/memory/memoryOutboxRepo.js";
import { CommunityService } from "../src/services/community.service.js";

describe("CommunityService (FR-14, k-Anonymity, Advisories)", () => {
  let clock: FakeClock;
  let communityRepo: MemoryCommunityRepository;
  let auditRepo: MemoryAuditRepository;
  let outboxRepo: MemoryOutboxRepository;
  let communityService: CommunityService;

  beforeEach(() => {
    clock = new FakeClock();
    communityRepo = new MemoryCommunityRepository();
    auditRepo = new MemoryAuditRepository();
    outboxRepo = new MemoryOutboxRepository(clock);
    communityService = new CommunityService(communityRepo, auditRepo, outboxRepo, clock, 5); // k=5
  });

  it("enforces k-anonymity (k=5): hides metrics when contributors < 5", async () => {
    const comm = await communityService.createCommunity(
      "Mayur Vihar RWA",
      "RWA group",
      "user-admin",
      "hh-admin",
    );

    // Only 1 household contributing
    let stats = await communityService.getAggregates(comm.id);
    expect(stats.kAnonymityMet).toBe(false);
    expect(stats.totalCo2eSavedKg).toBeUndefined();
    expect(stats.totalPm25SavedG).toBeUndefined();

    // Add 3 more households -> total 4 (still < 5)
    for (let i = 1; i <= 3; i++) {
      await communityService.joinCommunity(comm.joinCode, `hh-${i}`, `user-${i}`);
    }
    stats = await communityService.getAggregates(comm.id);
    expect(stats.kAnonymityMet).toBe(false);

    // Add 5th household -> total 5 (k=5 met!)
    await communityService.joinCommunity(comm.joinCode, "hh-5", "user-5");
    stats = await communityService.getAggregates(comm.id);
    expect(stats.kAnonymityMet).toBe(true);
    expect(stats.totalCo2eSavedKg).toBeGreaterThan(0);
    expect(stats.totalPm25SavedG).toBeGreaterThan(0);
    expect(stats.averageBreatheScore).toBeDefined();
  });

  it("immediately updates aggregates when a household leaves", async () => {
    const comm = await communityService.createCommunity("RWA", "Desc", "admin", "hh-admin");
    for (let i = 1; i <= 4; i++) {
      await communityService.joinCommunity(comm.joinCode, `hh-${i}`, `user-${i}`);
    }

    // Now 5 members: k-anonymity is met
    expect((await communityService.getAggregates(comm.id)).kAnonymityMet).toBe(true);

    // Household leaves -> drops to 4
    await communityService.leaveCommunity(comm.id, "hh-4", "user-4");
    const statsAfter = await communityService.getAggregates(comm.id);
    expect(statsAfter.kAnonymityMet).toBe(false);
  });

  it("allows drafting advisory and queues outbox items upon admin approval", async () => {
    const comm = await communityService.createCommunity("RWA", "Desc", "admin", "hh-admin");
    await communityService.joinCommunity(comm.joinCode, "hh-2", "user-2");

    const draft = await communityService.draftAdvisory(
      comm.id,
      {
        title: "Smog Advisory: Avoid Leaf Burning",
        content: "Please do not burn leaves or garden waste this week due to severe inversion.",
      },
      "admin",
    );

    expect(draft.status).toBe("DRAFT");

    const approved = await communityService.approveAdvisory(comm.id, draft.id, "admin");
    expect(approved.status).toBe("APPROVED");

    // Outbox should contain delivery items for community households
    const outboxItems = await outboxRepo.findDueItems(clock.now(), 10);
    expect(outboxItems.length).toBe(2);
    expect(outboxItems[0]?.subject).toContain("Smog Advisory");
  });
});
