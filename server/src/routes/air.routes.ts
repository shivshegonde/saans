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

      const rawPoints = (forecast.hours || (forecast as unknown as { series?: unknown[] }).series || []) as Array<{
        timeIso?: string;
        time?: string;
        aqi: number;
        pm25: number;
        pm10?: number;
        category: "Good" | "Satisfactory" | "Moderate" | "Poor" | "Very Poor" | "Severe";
        dominantPollutant?: string;
        temperatureC?: number;
        humidityPct?: number;
        humidityPercent?: number;
        windSpeedKmh?: number;
        isBestWindow?: boolean;
      }>;

      const points = rawPoints.map((h) => {
        const time = h.time || h.timeIso || new Date().toISOString();
        const d = new Date(time);
        const hour = d.getHours();
        const isBestWindow = h.isBestWindow ?? (hour >= 12 && hour <= 15);
        return {
          time,
          timeIso: time,
          pm25: h.pm25,
          pm10: h.pm10,
          aqi: h.aqi,
          category: h.category,
          dominantPollutant: h.dominantPollutant || "PM2.5",
          temperatureC: h.temperatureC,
          humidityPercent: h.humidityPct ?? h.humidityPercent,
          windSpeedKmh: h.windSpeedKmh,
          isBestWindow,
        };
      });

      res.json({
        location: forecast.location,
        hours: points,
        series: points,
        provenance: forecast.provenance,
      });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
