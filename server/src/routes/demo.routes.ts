import { Router, Request, Response, NextFunction } from "express";
import { Container } from "../container.js";
import { createDemoGuard } from "../middleware/demoGuard.js";
import { DemoScenarioRequestSchema, DemoTimeTravelRequestSchema } from "shared";

export function createDemoRouter(c: Container): Router {
  const router = Router();
  const demoGuard = createDemoGuard(c.config.DEMO_MODE);

  router.use(demoGuard);

  router.post("/scenario", (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = DemoScenarioRequestSchema.parse(req.body);
      c.demoService.switchScenario(parsed.scenario);
      res.status(200).json({ success: true, scenario: parsed.scenario });
    } catch (err) {
      next(err);
    }
  });

  router.post("/time-travel", (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = DemoTimeTravelRequestSchema.parse(req.body);
      const newTime = c.demoService.timeTravel(parsed.minutes);
      res.status(200).json({
        success: true,
        simulatedTime: newTime.toISOString(),
        deltaMinutes: parsed.minutes,
      });
    } catch (err) {
      next(err);
    }
  });

  router.post("/trigger-severe", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const householdId = (req.body && req.body.householdId) || "demo-household";
      const result = await c.demoService.triggerSevereSmog(householdId);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  });

  router.post(
    "/trigger-grace-timeout",
    async (_req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await c.demoService.triggerGraceTimeout();
        res.status(200).json(result);
      } catch (err) {
        next(err);
      }
    },
  );

  router.get("/personas", async (_req: Request, res: Response, next: NextFunction) => {
    try {
      res.status(200).json({
        personas: [
          {
            id: "riya",
            name: "Riya",
            role: "HOUSEHOLD_OWNER",
            description:
              "Household Owner protecting a child with asthma and elderly parents in Delhi.",
            email: "riya@saans.local",
          },
          {
            id: "dadaji",
            name: "Dadaji",
            role: "HOUSEHOLD_MEMBER",
            description:
              "Elderly member (68) focused on safe morning walk hours with Hindi language.",
            email: "dadaji@saans.local",
          },
          {
            id: "kulkarni",
            name: "Mr. Kulkarni",
            role: "COMMUNITY_ADMIN",
            description:
              "RWA Secretary managing community advisories, pledges, and k-anonymized impact.",
            email: "kulkarni@saans.local",
          },
        ],
      });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
