import { Router, Request, Response, NextFunction } from "express";
import { Container } from "../container.js";
import { createAuthMiddleware } from "../middleware/auth.js";
import { requirePermission } from "../middleware/requirePermission.js";
import { AlertPreferenceDtoSchema } from "shared";

export function createAlertsRouter(c: Container): Router {
  const router = Router();
  const auth = createAuthMiddleware(c.authService);

  router.get(
    "/preference",
    auth,
    requirePermission("READ"),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const pref = await c.householdRepo.getAlertPreference(req.household!.id);
        res.status(200).json(
          pref || {
            householdId: req.household!.id,
            enabled: true,
            aqiThreshold: 200,
            deliveryChannel: "email",
            coGuardianConsent: false,
          },
        );
      } catch (err) {
        next(err);
      }
    },
  );

  router.put(
    "/preference",
    auth,
    requirePermission("UPDATE"),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const parsed = AlertPreferenceDtoSchema.parse(req.body);
        await c.householdRepo.setAlertPreference({
          ...parsed,
          householdId: req.household!.id,
        });
        res.status(200).json({ success: true, preference: parsed });
      } catch (err) {
        next(err);
      }
    },
  );

  router.post(
    "/evaluate",
    auth,
    requirePermission("READ"),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const generated = await c.alertService.evaluateAlertsForHousehold(req.household!.id);
        res.status(200).json({ alertsTriggered: generated.length, items: generated });
      } catch (err) {
        next(err);
      }
    },
  );

  router.post(
    "/:alertId/acknowledge",
    auth,
    requirePermission("UPDATE"),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const alertId = String(req.params["alertId"]);
        await c.alertService.acknowledgeAlert(
          req.household!.id,
          alertId,
          req.user!.id,
          req.correlationId,
        );
        res.status(200).json({ success: true, alertId, acknowledged: true });
      } catch (err) {
        next(err);
      }
    },
  );

  router.get(
    "/outbox",
    auth,
    requirePermission("READ"),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const items = await c.outboxService.listTenantOutbox(req.household!.id);
        res.status(200).json(items);
      } catch (err) {
        next(err);
      }
    },
  );

  return router;
}
