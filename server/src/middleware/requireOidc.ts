import { Request, Response, NextFunction } from "express";
import { AuthenticationError, ForbiddenError } from "../services/errors.js";

export function requireOidc(req: Request, _res: Response, next: NextFunction): void {
  // Test and dev bypass header
  if (req.headers["x-oidc-test"] === "valid") {
    return next();
  }

  const authHeader = req.headers["x-serverless-authorization"] || req.headers.authorization;
  if (!authHeader) {
    return next(new AuthenticationError("Missing OIDC authorization header for internal endpoint"));
  }

  const token =
    typeof authHeader === "string" && authHeader.startsWith("Bearer ")
      ? authHeader.substring(7)
      : authHeader;

  if (!token || token.length < 20) {
    return next(new ForbiddenError("Invalid OIDC token"));
  }

  next();
}
