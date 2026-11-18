import { Request, Response, NextFunction } from "express";
import { PermissionScopeType } from "shared";
import { AuthenticationError, ForbiddenError, ValidationError } from "../services/errors.js";

function validateTenant(req: Request): void {
  const requestedTenantId =
    req.params["householdId"] ||
    (req.query["householdId"] as string) ||
    (req.headers["x-tenant-id"] as string);

  if (req.params["householdId"] === undefined && req.headers["x-require-tenant"] === "true") {
    if (!requestedTenantId) {
      throw new ValidationError("Missing required tenant identification parameter");
    }
  }

  if (requestedTenantId && requestedTenantId !== req.household?.id) {
    throw new ForbiddenError("Cross-tenant access denied: you are not a member of this household");
  }
}

export function requirePermission(scope: PermissionScopeType) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (!req.user || !req.household) {
        throw new AuthenticationError("Authentication required before permission check");
      }

      validateTenant(req);

      // Fail closed on corrupted permission data
      if (!Array.isArray(req.household.scopes)) {
        throw new ForbiddenError("Corrupted permissions record: access denied (fail closed)");
      }

      if (!req.household.scopes.includes(scope)) {
        throw new ForbiddenError(
          `Insufficient permissions: required scope '${scope}' not granted to role '${req.household.role}'`,
        );
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}
