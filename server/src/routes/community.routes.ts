import { Router, Request, Response, NextFunction } from "express";
import { Container } from "../container.js";
import { createAuthMiddleware } from "../middleware/auth.js";
import {
  JoinCommunityRequestSchema,
  CreatePledgeRequestSchema,
  CreateAdvisoryDraftRequestSchema,
} from "shared";
import { z } from "zod";

const CreateCommunitySchema = z.object({
  name: z.string().min(3),
  description: z.string().optional(),
});

export function createCommunityRouter(c: Container): Router {
  const router = Router();
  const auth = createAuthMiddleware(c.authService);

  router.post("/", auth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = CreateCommunitySchema.parse(req.body);
      const community = await c.communityService.createCommunity(
        parsed.name,
        parsed.description,
        req.user!.id,
        req.household!.id,
        req.correlationId,
      );
      res.status(201).json(community);
    } catch (err) {
      next(err);
    }
  });

  router.post("/join", auth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = JoinCommunityRequestSchema.parse(req.body);
      const community = await c.communityService.joinCommunity(
        parsed.joinCode,
        req.household!.id,
        req.user!.id,
        req.correlationId,
      );
      res.status(200).json(community);
    } catch (err) {
      next(err);
    }
  });

  router.post("/:id/leave", auth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      await c.communityService.leaveCommunity(
        String(req.params["id"]),
        req.household!.id,
        req.user!.id,
        req.correlationId,
      );
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  });

  router.get("/:id/stats", auth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await c.communityService.getAggregates(String(req.params["id"]));
      res.status(200).json(stats);
    } catch (err) {
      next(err);
    }
  });

  router.get("/:id/pledges", auth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const pledges = await c.communityService.listPledges(String(req.params["id"]), req.user!.id);
      res.status(200).json(pledges);
    } catch (err) {
      next(err);
    }
  });

  router.post("/:id/pledges", auth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = CreatePledgeRequestSchema.parse(req.body);
      const pledge = await c.communityService.createPledge(
        String(req.params["id"]),
        parsed,
        req.user!.id,
        req.correlationId,
      );
      res.status(201).json(pledge);
    } catch (err) {
      next(err);
    }
  });

  router.post(
    "/pledges/:pledgeId/participate",
    auth,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const pledgeId = String(req.params["pledgeId"]);
        await c.communityService.participatePledge(pledgeId, req.user!.id);
        res.status(200).json({ success: true, pledgeId });
      } catch (err) {
        next(err);
      }
    },
  );

  router.post("/:id/advisories", auth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = CreateAdvisoryDraftRequestSchema.parse(req.body);
      const draft = await c.communityService.draftAdvisory(
        String(req.params["id"]),
        parsed,
        req.user!.id,
        req.correlationId,
      );
      res.status(201).json(draft);
    } catch (err) {
      next(err);
    }
  });

  router.post(
    "/:id/advisories/:advId/approve",
    auth,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const approved = await c.communityService.approveAdvisory(
          String(req.params["id"]),
          String(req.params["advId"]),
          req.user!.id,
          req.correlationId,
        );
        res.status(200).json(approved);
      } catch (err) {
        next(err);
      }
    },
  );

  router.get("/:id/advisories", auth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const list = await c.communityService.listAdvisories(String(req.params["id"]));
      res.status(200).json(list);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
