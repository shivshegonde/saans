import { Request, Response, NextFunction } from "express";

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

export function createRateLimiter(options: { maxRequests: number; windowSeconds: number }) {
  const store = new Map<string, RateLimitRecord>();

  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = req.ip || req.socket.remoteAddress || "127.0.0.1";
    const now = Date.now();
    const windowMs = options.windowSeconds * 1000;

    let record = store.get(ip);
    if (!record || now > record.resetAt) {
      record = { count: 0, resetAt: now + windowMs };
    }

    record.count += 1;
    store.set(ip, record);

    const remaining = Math.max(0, options.maxRequests - record.count);
    const retryAfterSeconds = Math.ceil((record.resetAt - now) / 1000);

    res.setHeader("X-RateLimit-Limit", options.maxRequests);
    res.setHeader("X-RateLimit-Remaining", remaining);
    res.setHeader("X-RateLimit-Reset", Math.ceil(record.resetAt / 1000));

    if (record.count > options.maxRequests) {
      res.setHeader("Retry-After", retryAfterSeconds);
      res.status(429).json({
        type: "https://saans.app/errors/rate-limit-exceeded",
        title: "Too Many Requests",
        status: 429,
        detail: `Rate limit exceeded. Try again in ${retryAfterSeconds} seconds.`,
        correlationId: req.correlationId || "unknown",
      });
      return;
    }

    next();
  };
}
