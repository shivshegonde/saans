import { describe, it, expect, vi } from "vitest";
import { Request, Response } from "express";
import { requirePermission } from "../src/middleware/requirePermission.js";
import { AuthenticationError, ForbiddenError, ValidationError } from "../src/services/errors.js";

describe("requirePermission Middleware (Pillar 3 Security, Rejection Branches)", () => {
  it("rejects unauthenticated request with AuthenticationError (401)", () => {
    const middleware = requirePermission("READ");
    const req = {} as Request;
    const res = {} as Response;
    const next = vi.fn();

    middleware(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(AuthenticationError));
  });

  it("rejects missing required tenant parameter with ValidationError (400)", () => {
    const middleware = requirePermission("READ");
    const req = {
      user: { id: "u-1", email: "u@test.local", displayName: "User" },
      household: { id: "hh-1", name: "Home", role: "OWNER", scopes: ["READ"] },
      params: {},
      headers: { "x-require-tenant": "true" },
      query: {},
    } as unknown as Request;
    const res = {} as Response;
    const next = vi.fn();

    middleware(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
  });

  it("rejects tenant mismatch (cross-tenant access) with ForbiddenError (403)", () => {
    const middleware = requirePermission("READ");
    const req = {
      user: { id: "u-1", email: "u@test.local", displayName: "User" },
      household: { id: "hh-1", name: "Home", role: "OWNER", scopes: ["READ"] },
      params: { householdId: "hh-target-other" },
      headers: {},
      query: {},
    } as unknown as Request;
    const res = {} as Response;
    const next = vi.fn();

    middleware(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
  });

  it("rejects insufficient scope with ForbiddenError (403)", () => {
    const middleware = requirePermission("DELETE");
    const req = {
      user: { id: "u-2", email: "member@test.local", displayName: "Member" },
      household: { id: "hh-1", name: "Home", role: "MEMBER", scopes: ["READ", "CREATE"] },
      params: {},
      headers: {},
      query: {},
    } as unknown as Request;
    const res = {} as Response;
    const next = vi.fn();

    middleware(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
  });

  it("fails closed on corrupted stored permission JSON (403)", () => {
    const middleware = requirePermission("READ");
    const req = {
      user: { id: "u-3", email: "corrupted@test.local", displayName: "Corrupted" },
      household: {
        id: "hh-1",
        name: "Home",
        role: "MEMBER",
        scopes: "corrupted-non-array" as unknown as string[],
      },
      params: {},
      headers: {},
      query: {},
    } as unknown as Request;
    const res = {} as Response;
    const next = vi.fn();

    middleware(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
  });

  it("passes when valid bearer, matching tenant, and required scope are present", () => {
    const middleware = requirePermission("READ");
    const req = {
      user: { id: "u-1", email: "u@test.local", displayName: "User" },
      household: { id: "hh-1", name: "Home", role: "OWNER", scopes: ["READ", "UPDATE"] },
      params: { householdId: "hh-1" },
      headers: {},
      query: {},
    } as unknown as Request;
    const res = {} as Response;
    const next = vi.fn();

    middleware(req, res, next);
    expect(next).toHaveBeenCalledWith(); // no error
  });
});
