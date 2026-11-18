import { describe, it, expect } from "vitest";
import request from "supertest";
import express from "express";
import { errorHandlerMiddleware, DomainError } from "../src/middleware/errorHandler.js";

describe("Error Handler Middleware (errorHandler.test)", () => {
  const app = express();

  app.get("/test-domain-error", () => {
    throw new DomainError("Invalid Operation", 400, "Detailed domain failure");
  });

  app.get("/test-generic-error", () => {
    throw new Error("Something broke internally");
  });

  app.use(errorHandlerMiddleware);

  it("formats DomainError as RFC 7807 problem json", async () => {
    const res = await request(app).get("/test-domain-error");
    expect(res.status).toBe(400);
    expect(res.headers["content-type"]).toContain("application/problem+json");
    expect(res.body.title).toBe("Invalid Operation");
    expect(res.body.detail).toBe("Detailed domain failure");
    expect(res.body.correlationId).toBeDefined();
  });

  it("handles unexpected error safely without leaking stack traces", async () => {
    const res = await request(app).get("/test-generic-error");
    expect(res.status).toBe(500);
    expect(res.headers["content-type"]).toContain("application/problem+json");
    expect(res.body.title).toBe("Request Error");
    expect(res.body.detail).toBe("Something broke internally");
    expect(res.body.stack).toBeUndefined();
  });
});
