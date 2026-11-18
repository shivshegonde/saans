import { Request, Response, NextFunction } from "express";
import { ForbiddenError } from "../services/errors.js";

export function createDemoGuard(isDemoMode: boolean) {
  return (_req: Request, _res: Response, next: NextFunction): void => {
    if (!isDemoMode) {
      next(new ForbiddenError("Demo endpoints are disabled in production mode"));
      return;
    }
    next();
  };
}
