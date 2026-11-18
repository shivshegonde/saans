import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { computeCommunityAggregate, HouseholdContribution } from "../src/core/kAnonymity.js";

describe("K-Anonymity Community Privacy Engine (kAnonymity.test)", () => {
  it("suppresses aggregates when contributing count is below kMin threshold", () => {
    const data: HouseholdContribution[] = [
      { householdId: "h1", exposureScore: 80, avoidedCo2eKg: 2.5, actionsDoneCount: 3 },
      { householdId: "h2", exposureScore: 75, avoidedCo2eKg: 1.8, actionsDoneCount: 2 },
      { householdId: "h3", exposureScore: 85, avoidedCo2eKg: 3.1, actionsDoneCount: 4 },
    ];

    const result = computeCommunityAggregate(data, 20, 5);
    expect(result.suppressed).toBe(true);
    expect(result.contributingCount).toBe(3);
    expect(result.stats).toBeUndefined();
    expect(result.suppressionReason).toContain("minimum required for anonymity: 5");
  });

  it("releases anonymized aggregates when contributing count meets or exceeds kMin", () => {
    const data: HouseholdContribution[] = [
      { householdId: "h1", exposureScore: 80, avoidedCo2eKg: 2.0, actionsDoneCount: 3 },
      { householdId: "h2", exposureScore: 70, avoidedCo2eKg: 1.0, actionsDoneCount: 2 },
      { householdId: "h3", exposureScore: 90, avoidedCo2eKg: 3.0, actionsDoneCount: 4 },
      { householdId: "h4", exposureScore: 80, avoidedCo2eKg: 2.0, actionsDoneCount: 3 },
      { householdId: "h5", exposureScore: 85, avoidedCo2eKg: 2.5, actionsDoneCount: 3 },
    ];

    const result = computeCommunityAggregate(data, 10, 5);
    expect(result.suppressed).toBe(false);
    expect(result.contributingCount).toBe(5);
    expect(result.stats).toBeDefined();
    expect(result.stats?.avgExposureScore).toBe(81.0);
    expect(result.stats?.totalAvoidedCo2eKg).toBe(10.5);
    expect(result.stats?.participationRatePct).toBe(50.0);

    // Test zero members in community default
    const resZero = computeCommunityAggregate(data, 0, 5);
    expect(resZero.stats?.participationRatePct).toBe(100.0);
  });

  it("deduplicates multiple entries from the same household", () => {
    const data: HouseholdContribution[] = [
      { householdId: "h1", exposureScore: 80, avoidedCo2eKg: 2.0, actionsDoneCount: 3 },
      { householdId: "h1", exposureScore: 80, avoidedCo2eKg: 2.0, actionsDoneCount: 3 }, // duplicate
      { householdId: "h2", exposureScore: 70, avoidedCo2eKg: 1.0, actionsDoneCount: 2 },
    ];

    const result = computeCommunityAggregate(data, 10, 5);
    expect(result.suppressed).toBe(true);
    expect(result.contributingCount).toBe(2); // strictly 2 unique households
  });

  // Fast-check property test: For ANY dataset, if unique households < kMin, suppressed MUST be true
  it("never releases aggregates if distinct contributing count < kMin (fast-check property)", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            householdId: fc.stringMatching(/^h[0-9]{1,2}$/),
            exposureScore: fc.integer({ min: 0, max: 100 }),
            avoidedCo2eKg: fc.float({ min: 0, max: 50 }),
            actionsDoneCount: fc.integer({ min: 0, max: 20 }),
          }),
          { minLength: 0, maxLength: 20 },
        ),
        fc.integer({ min: 3, max: 10 }),
        (contributions, kMin) => {
          const distinctIds = new Set(contributions.map((c) => c.householdId));
          const res = computeCommunityAggregate(contributions, 100, kMin);

          if (distinctIds.size < kMin) {
            expect(res.suppressed).toBe(true);
            expect(res.stats).toBeUndefined();
          } else {
            expect(res.suppressed).toBe(false);
            expect(res.stats).toBeDefined();
          }
        },
      ),
    );
  });
});
