/**
 * K-Anonymity Privacy Filter for Community Aggregates.
 *
 * Invariants:
 * 1. Community admins and community members NEVER see individual household records.
 * 2. If contributing household count n < K_min, results MUST be suppressed to prevent re-identification.
 * 3. Never leak outliers or singleton identity information.
 */

export interface HouseholdContribution {
  householdId: string;
  exposureScore: number;
  avoidedCo2eKg: number;
  actionsDoneCount: number;
}

export interface CommunityAggregateResult {
  suppressed: boolean;
  contributingCount: number;
  kMinRequired: number;
  suppressionReason?: string;
  stats?: {
    avgExposureScore: number;
    totalAvoidedCo2eKg: number;
    totalActionsDone: number;
    participationRatePct: number;
  };
}

export function computeCommunityAggregate(
  contributions: HouseholdContribution[],
  totalMembersInCommunity: number,
  kMin = 5,
): CommunityAggregateResult {
  // Deduplicate by householdId to ensure true k-anonymity
  const distinctHouseholds = new Map<string, HouseholdContribution>();
  for (const c of contributions) {
    distinctHouseholds.set(c.householdId, c);
  }

  const n = distinctHouseholds.size;

  if (n < kMin) {
    return {
      suppressed: true,
      contributingCount: n,
      kMinRequired: kMin,
      suppressionReason: `Data suppressed for privacy: only ${n} distinct households contributed (minimum required for anonymity: ${kMin}).`,
    };
  }

  let sumExposure = 0;
  let sumCo2e = 0;
  let sumActions = 0;

  for (const item of distinctHouseholds.values()) {
    sumExposure += item.exposureScore;
    sumCo2e += item.avoidedCo2eKg;
    sumActions += item.actionsDoneCount;
  }

  const avgExposure = Number((sumExposure / n).toFixed(1));
  const participationPct =
    totalMembersInCommunity > 0 ? Number(((n / totalMembersInCommunity) * 100).toFixed(1)) : 100.0;

  return {
    suppressed: false,
    contributingCount: n,
    kMinRequired: kMin,
    stats: {
      avgExposureScore: avgExposure,
      totalAvoidedCo2eKg: Number(sumCo2e.toFixed(1)),
      totalActionsDone: sumActions,
      participationRatePct: participationPct,
    },
  };
}
