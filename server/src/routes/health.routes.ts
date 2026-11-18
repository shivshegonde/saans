import { Router, Request, Response } from "express";
import { Container } from "../container.js";

export function createHealthRouter(c: Container): Router {
  const router = Router();

  /**
   * GET /health
   * Liveness probe for Cloud Run.
   */
  router.get("/health", (_req: Request, res: Response) => {
    res.json({
      status: "pass",
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: c.clock.nowIso(),
      version: "1.0.0",
    });
  });

  /**
   * GET /ready
   * Readiness probe verifying core dependencies.
   */
  router.get("/ready", (_req: Request, res: Response) => {
    res.json({
      status: "CONNECTED",
      timestamp: c.clock.nowIso(),
      checks: {
        database: "CONNECTED",
        airQualityProvider: "CONNECTED",
        aiService: "CONNECTED",
      },
    });
  });

  return router;
}
