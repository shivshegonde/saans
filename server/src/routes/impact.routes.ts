import { Router, Request, Response, NextFunction } from "express";
import { Container } from "../container.js";
import { ImpactCalculationRequestSchema } from "shared";

export function createImpactRouter(c: Container): Router {
  const router = Router();

  router.post("/calculate", (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = ImpactCalculationRequestSchema.parse(req.body);
      const result = c.impactService.calculate(parsed);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  });

  router.get("/formula", (_req: Request, res: Response) => {
    res.status(200).json({
      title: "Saans Impact Calculation Methodology & Mathematical Formulas",
      version: "1.0",
      models: {
        exposure: {
          name: "Mass-Dose Inhalation Model",
          formula: "Dose (µg) = Σ [C_i (µg/m³) × IR_j (m³/h) × t_i (h) × (1 − η_mask)]",
          variables: {
            C_i: "PM2.5 concentration in microenvironment i",
            IR_j: "Inhalation rate for age/activity group j",
            t_i: "Time spent in microenvironment i",
            eta_mask: "Filtration efficiency (N95: 0.85; Surgical: 0.20; None: 0.0)",
          },
          citations: [
            "US EPA Exposure Factors Handbook (2011)",
            "CPCB National Air Quality Index Guidelines (2014)",
          ],
        },
        emissions: {
          name: "Avoided Emissions Activity-Based Accounting",
          formula: "Avoided = Distance (km) × (EF_baseline − EF_alternative)",
          citations: [
            "ARAI Emission Factors for Indian Transport (2020)",
            "IPCC Emission Factor Database (2019)",
          ],
        },
      },
    });
  });

  return router;
}
