import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("OpenAPI 3.0 Documentation & Route Sync (Pillar 2 Architecture)", () => {
  const openApiPath = path.resolve(__dirname, "../../docs/openapi.json");

  it("docs/openapi.json exists, is valid OpenAPI 3.0, and contains bearerAuth security scheme", () => {
    expect(fs.existsSync(openApiPath)).toBe(true);

    const doc = JSON.parse(fs.readFileSync(openApiPath, "utf-8"));
    expect(doc.openapi).toMatch(/^3\.0\.\d+$/);
    expect(doc.info.title).toBe("Saans API");
    expect(doc.components.securitySchemes.bearerAuth).toBeDefined();
    expect(doc.components.securitySchemes.bearerAuth.type).toBe("http");
    expect(doc.components.securitySchemes.bearerAuth.scheme).toBe("bearer");
  });

  it("documents every core route in the API", () => {
    const doc = JSON.parse(fs.readFileSync(openApiPath, "utf-8"));
    const paths = Object.keys(doc.paths);

    const expectedPaths = [
      "/health",
      "/ready",
      "/api/v1/auth/register",
      "/api/v1/auth/login",
      "/api/v1/auth/logout",
      "/api/v1/auth/me",
      "/api/v1/household",
      "/api/v1/household/members",
      "/api/v1/household/invitations",
      "/api/v1/household/invitations/join",
      "/api/v1/air/now",
      "/api/v1/air/forecast",
      "/api/v1/plan/today",
      "/api/v1/plan/export.ics",
      "/api/v1/impact/calculate",
      "/api/v1/impact/formula",
      "/api/v1/community",
      "/api/v1/community/join",
      "/api/v1/alerts/preference",
      "/api/v1/alerts/evaluate",
      "/api/v1/alerts/outbox",
      "/api/v1/analytics/audit",
      "/api/v1/analytics/breathe-score",
      "/api/v1/analytics/ledger",
      "/api/v1/demo/scenario",
      "/api/v1/demo/time-travel",
      "/internal/outbox/process",
    ];

    for (const p of expectedPaths) {
      expect(paths).toContain(p);
    }
  });
});
