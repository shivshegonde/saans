/**
 * Breathe Score Calculation Engine (FR-9).
 *
 * Deterministic habit-and-exposure composite health index (0–100):
 * 1. Exposure Score (40 pts): Scaled inversely to personal inhaled PM2.5 dose.
 * 2. Action Adherence Score (30 pts): Ratio of recommended daily plan actions completed.
 * 3. Sustainable Habits Score (30 pts): Clean transit, clean cooking, and composting practices.
 */

export interface BreatheScoreInputs {
  dailyAvgIndoorPm25UgM3: number;
  totalActionsRecommended: number;
  totalActionsCompleted: number;
  cleanTransitCommute: boolean;
  cleanCookingFuel: boolean;
  noWasteBurningComposting: boolean;
}

export interface BreatheScoreBreakdown {
  totalScore: number; // 0-100
  exposurePoints: number; // 0-40
  actionPoints: number; // 0-30
  habitPoints: number; // 0-30
  rating: "Excellent" | "Good" | "Needs Attention" | "High Exposure Risk";
}

export function calculateBreatheScore(inputs: BreatheScoreInputs): BreatheScoreBreakdown {
  // 1. Exposure points (40 pts)
  // Target: <= 15 µg/m³ gets full 40 pts. > 150 µg/m³ gets 0 pts.
  const pm = Math.max(0, inputs.dailyAvgIndoorPm25UgM3);
  let exposurePts = 0;
  if (pm <= 15) {
    exposurePts = 40;
  } else if (pm >= 150) {
    exposurePts = 0;
  } else {
    exposurePts = Math.round(40 * (1 - (pm - 15) / 135));
  }

  // 2. Action points (30 pts)
  let actionPts = 0;
  if (inputs.totalActionsRecommended > 0) {
    const ratio = Math.min(1.0, inputs.totalActionsCompleted / inputs.totalActionsRecommended);
    actionPts = Math.round(ratio * 30);
  } else {
    actionPts = 20; // baseline if no actions were required
  }

  // 3. Habit points (30 pts: 10 pts per habit)
  let habitPts = 0;
  if (inputs.cleanTransitCommute) habitPts += 10;
  if (inputs.cleanCookingFuel) habitPts += 10;
  if (inputs.noWasteBurningComposting) habitPts += 10;

  const total = Math.min(100, Math.max(0, exposurePts + actionPts + habitPts));

  let rating: BreatheScoreBreakdown["rating"] = "Good";
  if (total >= 85) rating = "Excellent";
  else if (total >= 70) rating = "Good";
  else if (total >= 45) rating = "Needs Attention";
  else rating = "High Exposure Risk";

  return {
    totalScore: total,
    exposurePoints: exposurePts,
    actionPoints: actionPts,
    habitPoints: habitPts,
    rating,
  };
}
