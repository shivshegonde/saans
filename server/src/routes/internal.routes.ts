import { Router, Request, Response, NextFunction } from "express";
import { Container } from "../container.js";
import { requireOidc } from "../middleware/requireOidc.js";

export function createInternalRouter(c: Container): Router {
  const router = Router();

  // All internal routes require Google Cloud OIDC authentication
  router.use(requireOidc);

  router.post("/outbox/process", async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await c.outboxService.processOutbox(20);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  });

  router.post("/alerts/evaluate", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const householdId = (req.body && req.body.householdId) || "demo-household";
      const alerts = await c.alertService.evaluateAlertsForHousehold(householdId);
      res.status(200).json({ alertsTriggered: alerts.length });
    } catch (err) {
      next(err);
    }
  });

  router.post("/demo/reset", async (_req: Request, res: Response) => {
    // Reset demo state
    res.status(200).json({ success: true, message: "Demo state reset successfully" });
  });

  return router;
}
