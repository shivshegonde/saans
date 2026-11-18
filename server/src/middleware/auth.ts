import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/auth.service.js";
import { AuthenticationError } from "../services/errors.js";

export function createAuthMiddleware(authService: AuthService) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new AuthenticationError("Missing or malformed Authorization header");
      }

      const token = authHeader.substring(7).trim();
      if (!token) {
        throw new AuthenticationError("Bearer token cannot be empty");
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
