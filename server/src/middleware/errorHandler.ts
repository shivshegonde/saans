import { Request, Response, NextFunction } from "express";
import crypto from "node:crypto";
import { ProblemDetails } from "shared";

export class DomainError extends Error {
  constructor(
    public readonly title: string,
    public readonly status: number = 400,
    public readonly detail: string = "",
  ) {
    super(detail || title);
    this.name = "DomainError";
  }
}

export function errorHandlerMiddleware(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const correlationId = (req.headers["x-correlation-id"] as string) || crypto.randomUUID();

  let status = 500;
  let title = "Internal Server Error";
  let detail = "An unexpected server error occurred.";

  if (err instanceof DomainError) {
    status = err.status;
    title = err.title;
    detail = err.detail;
  } else if (err instanceof Error) {
    title = "Request Error";
    detail = err.message;
    if ("status" in err && typeof (err as { status: unknown }).status === "number") {
      status = (err as { status: number }).status;
    }
  }

  const problem: ProblemDetails = {
    type: `https://saans.app/errors/${status}`,
    title,
    status,
    detail,
    instance: req.originalUrl,
    correlationId,
  };

  res.status(status).contentType("application/problem+json").json(problem);
}
