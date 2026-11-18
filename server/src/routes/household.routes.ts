import { Router, Request, Response, NextFunction } from "express";
import { Container } from "../container.js";
import { createAuthMiddleware } from "../middleware/auth.js";
import { requirePermission } from "../middleware/requirePermission.js";
import {
  UpdateHouseholdRequestSchema,
  CreateInvitationRequestSchema,
  JoinInvitationRequestSchema,
  InvitationScopeType,
} from "shared";

export function createHouseholdRouter(c: Container): Router {
  const router = Router();
  const auth = createAuthMiddleware(c.authService);

  // Join invitation (authenticated user)
  router.post(
    "/invitations/join",
    auth,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const parsed = JoinInvitationRequestSchema.parse(req.body);
        const result = await c.invitationService.acceptInvitation(
          parsed.token,
          req.user!.id,
          req.correlationId,
        );
        res.status(200).json(result);
      } catch (err) {
        next(err);
      }
    },
  );

  // Household Profile
  router.get(
    "/",
    auth,
    requirePermission("READ"),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const profile = await c.householdService.getHousehold(req.household!.id, req.user!.id);
        res.status(200).json(profile);
      } catch (err) {
        next(err);
      }
    },
  );

  router.patch(
    "/",
    auth,
    requirePermission("UPDATE"),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const updates = UpdateHouseholdRequestSchema.parse(req.body);
        const updated = await c.householdService.updateHousehold(
          req.household!.id,
          updates,
          req.user!.id,
          req.correlationId,
        );
        res.status(200).json(updated);
      } catch (err) {
        next(err);
      }
    },
  );

  router.delete(
    "/",
    auth,
    requirePermission("DELETE"),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        await c.householdService.deleteHousehold(
          req.household!.id,
          req.user!.id,
          req.correlationId,
        );
        res.status(204).send();
      } catch (err) {
        next(err);
      }
    },
  );

  // Members
  router.get(
    "/members",
    auth,
    requirePermission("READ"),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const members = await c.householdService.listMembers(req.household!.id, req.user!.id);
        res.status(200).json(members);
      } catch (err) {
        next(err);
      }
    },
  );

  router.delete(
    "/members/:targetUserId",
    auth,
    requirePermission("REVOKE"),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        await c.invitationService.revokeMember(
          req.household!.id,
          String(req.params["targetUserId"]),
          req.user!.id,
          req.correlationId,
        );
        res.status(204).send();
      } catch (err) {
        next(err);
      }
    },
  );

  // Invitations
  router.post(
    "/invitations",
    auth,
    requirePermission("INVITE"),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const parsed = CreateInvitationRequestSchema.parse(req.body);
        const result = await c.invitationService.createInvitation(
          req.household!.id,
          req.user!.id,
          parsed.scopes as InvitationScopeType[],
          parsed.expiresInDays,
          parsed.recipientEmail,
          req.correlationId,
        );
        res.status(201).json(result);
      } catch (err) {
        next(err);
      }
    },
  );

  router.get(
    "/invitations",
    auth,
    requirePermission("READ"),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const list = await c.invitationService.listInvitations(req.household!.id, req.user!.id);
        res.status(200).json(list);
      } catch (err) {
        next(err);
      }
    },
  );

  router.delete(
    "/invitations/:id",
    auth,
    requirePermission("REVOKE"),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        await c.invitationService.revokeInvitation(
          req.household!.id,
          String(req.params["id"]),
          req.user!.id,
          req.correlationId,
        );
        res.status(204).send();
      } catch (err) {
        next(err);
      }
    },
  );

  return router;
}
