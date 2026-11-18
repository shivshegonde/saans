import { Router, Request, Response, NextFunction } from "express";
import { Container } from "../container.js";
import { createAuthMiddleware } from "../middleware/auth.js";
import { requirePermission } from "../middleware/requirePermission.js";
import { ActionToggleRequestSchema } from "shared";

export function createPlanRouter(c: Container): Router {
  const router = Router();
  const auth = createAuthMiddleware(c.authService);

  router.get(
    "/today",
    auth,
    requirePermission("READ"),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const plan = await c.planService.getTodayPlan(req.household!.id, req.user!.id);
        res.status(200).json(plan);
      } catch (err) {
        next(err);
      }
    },
  );

  router.post(
    "/action/:cardId/toggle",
    auth,
    requirePermission("CREATE"),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const parsed = ActionToggleRequestSchema.parse(req.body);
        const cardId = String(req.params["cardId"]);
        await c.planService.toggleAction(
          req.household!.id,
          req.user!.id,
          cardId,
          parsed.completed,
          req.correlationId,
        );
        res.status(200).json({ success: true, cardId, completed: parsed.completed });
      } catch (err) {
        next(err);
      }
    },
  );

  router.get(
    "/export.ics",
    auth,
    requirePermission("READ"),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const ics = await c.planService.exportCalendarIcs(req.household!.id, req.user!.id);
        res.setHeader("Content-Type", "text/calendar; charset=utf-8");
        res.setHeader("Content-Disposition", 'attachment; filename="saans-plan.ics"');
        res.status(200).send(ics);
      } catch (err) {
        next(err);
      }
    },
  );

  return router;
}
