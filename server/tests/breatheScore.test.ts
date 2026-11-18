import { describe, it, expect } from "vitest";
import { calculateBreatheScore } from "../src/core/breatheScore.js";

describe("Breathe Score Composite Engine (breatheScore.test)", () => {
  it("awards maximum 100 score for pristine indoor air, full actions, and all green habits", () => {
    const res = calculateBreatheScore({
      dailyAvgIndoorPm25UgM3: 10, // <= 15 -> 40 pts
      totalActionsRecommended: 5,
      totalActionsCompleted: 5, // 100% -> 30 pts
      cleanTransitCommute: true, // 10 pts
      cleanCookingFuel: true, // 10 pts
      noWasteBurningComposting: true, // 10 pts
    });

    expect(res.totalScore).toBe(100);
    expect(res.exposurePoints).toBe(40);
    expect(res.actionPoints).toBe(30);
    expect(res.habitPoints).toBe(30);
    expect(res.rating).toBe("Excellent");
  });

  it("rates High Exposure Risk when air is severely contaminated and no actions taken", () => {
    const res = calculateBreatheScore({
      dailyAvgIndoorPm25UgM3: 160, // > 150 -> 0 pts
      totalActionsRecommended: 6,
      totalActionsCompleted: 1, // 1/6 -> 5 pts
      cleanTransitCommute: false,
      cleanCookingFuel: false,
      noWasteBurningComposting: false,
    });

    expect(res.totalScore).toBe(5);
    expect(res.exposurePoints).toBe(0);
    expect(res.rating).toBe("High Exposure Risk");
  });

  it("handles empty recommended actions gracefully with baseline points", () => {
    const res = calculateBreatheScore({
      dailyAvgIndoorPm25UgM3: 35,
      totalActionsRecommended: 0,
      totalActionsCompleted: 0,
      cleanTransitCommute: true,
      cleanCookingFuel: true,
      noWasteBurningComposting: false,
    });

    expect(res.totalScore).toBeGreaterThan(0);
    expect(res.actionPoints).toBe(20);
  });
});
