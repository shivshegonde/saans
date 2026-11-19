import { Router, Request, Response } from "express";
import {
  AskSaansRequestSchema,
  MythCheckRequestSchema,
  DraftAdvisoryRequestSchema,
  DraftComplaintRequestSchema,
} from "shared";
import { buildCoarsenedFacts } from "../ai/factsBuilder.js";
import { Container } from "../container.js";

export function createAiRouter(container: Container): Router {
  const router = Router();
  const aiService = container.aiClient;

  router.post("/ask", async (req: Request, res: Response, next) => {
    try {
      const parsed = AskSaansRequestSchema.parse(req.body);
      const lat = parsed.location?.lat ?? 28.6139;
      const lng = parsed.location?.lng ?? 77.209;
      const airNow = await container.airProvider.getCurrent({
        name: "Delhi",
        lat,
        lng,
      });

      // Fetch active user household if authenticated
      let profile = null;
      if (req.household?.id) {
        profile = await container.householdRepo.getHousehold(req.household.id);
      }

      const facts = buildCoarsenedFacts(airNow, profile);
      const response = await aiService.askSaans(parsed, facts);
      res.json(response);
    } catch (err) {
      next(err);
    }
  });

  router.post("/myth-check", async (req: Request, res: Response, next) => {
    try {
      const parsed = MythCheckRequestSchema.parse(req.body);
      const response = await aiService.mythCheck(parsed);
      res.json(response);
    } catch (err) {
      next(err);
    }
  });

  router.post("/draft-advisory", async (req: Request, res: Response, next) => {
    try {
      const parsed = DraftAdvisoryRequestSchema.parse(req.body);
      const response = await aiService.draftAdvisory(parsed);
      res.json(response);
    } catch (err) {
      next(err);
    }
  });

  router.post("/draft-complaint", async (req: Request, res: Response, next) => {
    try {
      const parsed = DraftComplaintRequestSchema.parse(req.body);
      const response = await aiService.draftComplaint(parsed);
      res.json(response);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
