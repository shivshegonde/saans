import { Router } from "express";
import { Container } from "../container.js";
import { createHealthRouter } from "./health.routes.js";
import { createAirRouter } from "./air.routes.js";
import { createAuthRouter } from "./auth.routes.js";
import { createHouseholdRouter } from "./household.routes.js";
import { createPlanRouter } from "./plan.routes.js";
import { createImpactRouter } from "./impact.routes.js";
import { createCommunityRouter } from "./community.routes.js";
import { createAlertsRouter } from "./alerts.routes.js";
import { createAnalyticsRouter } from "./analytics.routes.js";
import { createDemoRouter } from "./demo.routes.js";
import { createInternalRouter } from "./internal.routes.js";
import { createAiRouter } from "./ai.routes.js";

export function createRootRouter(c: Container): Router {
  const router = Router();

  // Root probes: /health, /ready
  router.use(createHealthRouter(c));

  // Domain API v1 routes
  const apiV1 = Router();
  apiV1.use("/auth", createAuthRouter(c));
  apiV1.use("/household", createHouseholdRouter(c));
  apiV1.use("/air", createAirRouter(c));
  apiV1.use("/plan", createPlanRouter(c));
  apiV1.use("/impact", createImpactRouter(c));
  apiV1.use("/community", createCommunityRouter(c));
  apiV1.use("/alerts", createAlertsRouter(c));
  apiV1.use("/analytics", createAnalyticsRouter(c));
  apiV1.use("/demo", createDemoRouter(c));
  apiV1.use("/ai", createAiRouter(c));

  router.use("/api/v1", apiV1);

  // Internal Cloud Scheduler endpoints
  router.use("/internal", createInternalRouter(c));

  return router;
}
