import { Router } from "express";
import { Container } from "../container.js";
import { createHealthRouter } from "./health.routes.js";
import { createAirRouter } from "./air.routes.js";

export function createRootRouter(c: Container): Router {
  const router = Router();

  // Root probes
  router.use(createHealthRouter(c));

  // Domain API v1 routes
  const apiV1 = Router();
  apiV1.use("/air", createAirRouter(c));

  router.use("/api/v1", apiV1);

  return router;
}
