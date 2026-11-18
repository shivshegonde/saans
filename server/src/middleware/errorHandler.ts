import { Request, Response, NextFunction } from "express";
import crypto from "node:crypto";
import { ZodError } from "zod";
import { ProblemDetails } from "shared";
import { DomainError, AccountLockedError } from "../services/errors.js";

export { DomainError };

interface ParsedError {
  status: number;
  title: string;
  detail: string;
  invalidParams?: Array<{ name: string; reason: string }>;
}

function parseDomainOrAccountError(err: unknown, res: Response): ParsedError | null {
  if (err instanceof AccountLockedError) {
    res.setHeader("Retry-After", err.retryAfterSeconds);
    return { status: err.statusCode, title: err.title, detail: err.detail };
  }
  if (err instanceof DomainError) {
    const invalidParams = err.details?.["invalidParams"] as
      Array<{ name: string; reason: string }> | undefined;
    return { status: err.statusCode, title: err.title, detail: err.detail, invalidParams };
  }
  return null;
}

function parseError(err: unknown, res: Response): ParsedError {
  const domainErr = parseDomainOrAccountError(err, res);
  if (domainErr) return domainErr;

  if (err instanceof ZodError) {
    return {
      status: 400,
      title: "Validation Error",
      detail: "Request validation failed",
      invalidParams: err.errors.map((e) => ({ name: e.path.join("."), reason: e.message })),
    };
  }

  if (err instanceof Error) {
    const statusCode =
      (err as { statusCode?: number }).statusCode || (err as { status?: number }).status || 500;
    return { status: statusCode, title: "Request Error", detail: err.message };
  }

  return {
    status: 500,
    title: "Internal Server Error",
    detail: "An unexpected server error occurred.",
  };
}

export function errorHandlerMiddleware(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const correlationId =
    (req.correlationId as string) ||
    (req.headers["x-correlation-id"] as string) ||
    crypto.randomUUID();

  const { status, title, detail, invalidParams } = parseError(err, res);

  const problem: ProblemDetails = {
    type: `https://saans.app/errors/${status}`,
    title,
    status,
    detail,
    instance: req.originalUrl,
    correlationId,
    ...(invalidParams ? { invalidParams } : {}),
  };

  res.status(status).contentType("application/problem+json").json(problem);
}
