import { Router, Request, Response, NextFunction } from "express";
import { Container } from "../container.js";
import { createAuthMiddleware } from "../middleware/auth.js";
import { requirePermission } from "../middleware/requirePermission.js";
import { calculateBreatheScore } from "../core/breatheScore.js";

export function createAnalyticsRouter(c: Container): Router {
  const router = Router();
  const auth = createAuthMiddleware(c.authService);

  router.get(
    "/audit",
    auth,
    requirePermission("AUDIT"),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const logs = await c.auditService.listHouseholdAudit(req.household!.id, 100);
        res.status(200).json(logs);
      } catch (err) {
        next(err);
      }
    },
  );

  router.get(
    "/breathe-score",
    auth,
    requirePermission("READ"),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const today = c.clock.now().toISOString().split("T")[0] || "2026-11-18";
        const logs = await c.householdRepo.getActionLogs(req.household!.id, today);
        const completedCount = logs.filter((l) => l.completed).length;

        const scoreResult = calculateBreatheScore({
          dailyAvgIndoorPm25UgM3: 35,
          totalActionsRecommended: 3,
          totalActionsCompleted: completedCount,
          cleanTransitCommute: true,
          cleanCookingFuel: true,
          noWasteBurningComposting: true,
        });

        res.status(200).json(scoreResult);
      } catch (err) {
        next(err);
      }
    },
  );

  router.get(
    "/ledger",
    auth,
    requirePermission("READ"),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const today = c.clock.now().toISOString().split("T")[0] || "2026-11-18";
        const logs = await c.householdRepo.getActionLogs(req.household!.id, today);
        const completed = logs.filter((l) => l.completed);

        res.status(200).json({
          period: "This Week",
          actionsCompleted: completed.length,
          exposureReducedPercent: Math.min(65, completed.length * 15),
          co2eAvoidedKg: Math.round(completed.length * 2.8 * 10) / 10,
          moneySavedInr: completed.length * 120,
        });
      } catch (err) {
        next(err);
      }
    },
  );

  return router;
}
