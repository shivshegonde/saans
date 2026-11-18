import { Router, Request, Response, NextFunction } from "express";
import { Container } from "../container.js";

export function createAirRouter(c: Container): Router {
  const router = Router();

  /**
   * GET /api/v1/air/now
   * Fetches current air quality, CPCB NAQI, WHO multiple, and smog drivers.
   */
  router.get("/now", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const lat = req.query["lat"] ? Number(req.query["lat"]) : 28.6139;
      const lng = req.query["lng"] ? Number(req.query["lng"]) : 77.209;
      const name = (req.query["name"] as string) || "Delhi-NCR";

      const airNow = await c.airProvider.getCurrent({ lat, lng, name });
      res.json(airNow);
    } catch (err) {
      next(err);
    }
  });

  /**
   * GET /api/v1/air/forecast
   * Fetches hourly forecast up to 72 hours.
   */
  router.get("/forecast", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const lat = req.query["lat"] ? Number(req.query["lat"]) : 28.6139;
      const lng = req.query["lng"] ? Number(req.query["lng"]) : 77.209;
      const name = (req.query["name"] as string) || "Delhi-NCR";
      const hours = req.query["hours"] ? Math.min(72, Number(req.query["hours"])) : 72;

      const forecast = await c.airProvider.getForecast({ lat, lng, name }, hours);
      res.json(forecast);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
