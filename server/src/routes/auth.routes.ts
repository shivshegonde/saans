import { Router, Request, Response, NextFunction } from "express";
import { Container } from "../container.js";
import { UserRegisterRequestSchema, UserLoginRequestSchema } from "shared";
import { createAuthMiddleware } from "../middleware/auth.js";
import { createRateLimiter } from "../middleware/rateLimit.js";

export function createAuthRouter(c: Container): Router {
  const router = Router();
  const authMiddleware = createAuthMiddleware(c.authService);
  const loginLimiter = createRateLimiter({ maxRequests: 10, windowSeconds: 60 });

  router.post("/register", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = UserRegisterRequestSchema.parse(req.body);
      const session = await c.authService.register(parsed, req.correlationId);
      res.status(201).json(session);
    } catch (err) {
      next(err);
    }
  });

  router.post("/login", loginLimiter, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = UserLoginRequestSchema.parse(req.body);
      const session = await c.authService.login(parsed, req.correlationId);
      res.status(200).json(session);
    } catch (err) {
      next(err);
    }
  });

  router.post(
    "/logout",
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const token = req.headers.authorization!.substring(7).trim();
        await c.authService.logout(token);
        res.status(204).send();
      } catch (err) {
        next(err);
      }
    },
  );

  router.get("/me", authMiddleware, (req: Request, res: Response) => {
    res.status(200).json({
      user: req.user,
      household: req.household,
    });
  });

  return router;
}
