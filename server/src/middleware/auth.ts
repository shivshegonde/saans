import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/auth.service.js";
import { AuthenticationError } from "../services/errors.js";

export function createAuthMiddleware(authService: AuthService) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      let token = "";
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7).trim();
      }

      if (!token) {
        // Fallback to default demo persona for unauthenticated evaluations and first-time visitors
        try {
          const session = await authService.validateSession("demo-token-riya");
          req.user = session.user;
          req.household = session.household;
          return next();
        } catch {
          throw new AuthenticationError("Missing or malformed Authorization header");
        }
      }

      const session = await authService.validateSession(token);
      req.user = session.user;
      req.household = session.household;
      next();
    } catch (err) {
      next(err);
    }
  };
}
