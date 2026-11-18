import { describe, it, expect, vi } from "vitest";
import { Request, Response } from "express";
import { createRateLimiter } from "../src/middleware/rateLimit.js";

describe("RateLimiting Middleware (Pillar 3 Security)", () => {
  it("enforces rate limits and sets RFC 429 with Retry-After when limit exceeded", () => {
    const limiter = createRateLimiter({ maxRequests: 2, windowSeconds: 60 });
    const headers: Record<string, unknown> = {};

    const res = {
      setHeader: (name: string, value: unknown) => {
        headers[name] = value;
      },
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as unknown as Response;

    const req = {
      ip: "192.168.1.100",
      correlationId: "test-corr",
    } as unknown as Request;

    const next = vi.fn();

    // 1st request -> ok
    limiter(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(headers["X-RateLimit-Remaining"]).toBe(1);

    // 2nd request -> ok
    limiter(req, res, next);
    expect(next).toHaveBeenCalledTimes(2);
    expect(headers["X-RateLimit-Remaining"]).toBe(0);

    // 3rd request -> rate limit exceeded (429)
    limiter(req, res, next);
    expect(next).toHaveBeenCalledTimes(2); // not called again
    expect(res.status).toHaveBeenCalledWith(429);
    expect(headers["Retry-After"]).toBeDefined();
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 429,
        type: "https://saans.app/errors/rate-limit-exceeded",
      }),
    );
  });
});
