import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../src/server.js";

describe("Security Headers (securityHeaders.test)", () => {
  const app = createApp();

  it("sets all hardened security headers on every response", async () => {
    const res = await request(app).get("/health");
    expect(res.headers["content-security-policy"]).toContain("default-src 'self'");
    expect(res.headers["x-frame-options"]).toBe("DENY");
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    expect(res.headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(res.headers["cross-origin-opener-policy"]).toBe("same-origin");
    expect(res.headers["cross-origin-resource-policy"]).toBe("same-origin");
    expect(res.headers["strict-transport-security"]).toContain("max-age=31536000");
    expect(res.headers["permissions-policy"]).toContain("geolocation=(self)");
    expect(res.headers["permissions-policy"]).toContain("camera=()");
  });
});
