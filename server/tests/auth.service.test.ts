import { describe, it, expect, beforeEach } from "vitest";
import { FakeClock } from "../src/adapters/fakeClock.js";
import { MemoryHouseholdRepository } from "../src/repositories/memory/memoryHouseholdRepo.js";
import { MemoryAuditRepository } from "../src/repositories/memory/memoryAuditRepo.js";
import { AuthService } from "../src/services/auth.service.js";
import {
  AuthenticationError,
  AccountLockedError,
  ConflictError,
  ValidationError,
} from "../src/services/errors.js";

describe("AuthService (FR-1, FR-13, Pillar 3 Security)", () => {
  let clock: FakeClock;
  let householdRepo: MemoryHouseholdRepository;
  let auditRepo: MemoryAuditRepository;
  let authService: AuthService;

  beforeEach(() => {
    clock = new FakeClock();
    householdRepo = new MemoryHouseholdRepository(clock);
    auditRepo = new MemoryAuditRepository();
    authService = new AuthService(householdRepo, auditRepo, clock);
  });

  it("registers a new user and creates household with full OWNER scopes", async () => {
    const res = await authService.register({
      email: "riya@delhi.local",
      password: "StrongPassword123!",
      displayName: "Riya",
      householdName: "Riya's Home",
      location: { name: "Delhi-NCR", lat: 28.6139, lng: 77.209 },
    });

    expect(res.user.email).toBe("riya@delhi.local");
    expect(res.household.role).toBe("OWNER");
    expect(res.household.scopes).toContain("READ");
    expect(res.household.scopes).toContain("DELETE");
    expect(res.token).toBeDefined();

    // Verify session validation
    const session = await authService.validateSession(res.token);
    expect(session.user.id).toBe(res.user.id);
  });

  it("rejects weak or common passwords", async () => {
    await expect(
      authService.register({
        email: "weak@test.com",
        password: "short",
        displayName: "Short",
        householdName: "Short Home",
        location: { name: "Delhi", lat: 28, lng: 77 },
      }),
    ).rejects.toThrow(ValidationError);

    await expect(
      authService.register({
        email: "common@test.com",
        password: "password123",
        displayName: "Common",
        householdName: "Common Home",
        location: { name: "Delhi", lat: 28, lng: 77 },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("rejects duplicate registration with ConflictError", async () => {
    await authService.register({
      email: "dup@delhi.local",
      password: "StrongPassword123!",
      displayName: "Dup",
      householdName: "Dup Home",
      location: { name: "Delhi", lat: 28, lng: 77 },
    });

    await expect(
      authService.register({
        email: "dup@delhi.local",
        password: "AnotherPassword123!",
        displayName: "Dup2",
        householdName: "Dup Home 2",
        location: { name: "Delhi", lat: 28, lng: 77 },
      }),
    ).rejects.toThrow(ConflictError);
  });

  it("locks account after 5 consecutive failed login attempts (HTTP 429)", async () => {
    await authService.register({
      email: "lockout@delhi.local",
      password: "CorrectPassword123!",
      displayName: "Lockout User",
      householdName: "Lockout Home",
      location: { name: "Delhi", lat: 28, lng: 77 },
    });

    // 4 failed attempts
    for (let i = 0; i < 4; i++) {
      await expect(
        authService.login({ email: "lockout@delhi.local", password: "WrongPassword" }),
      ).rejects.toThrow(AuthenticationError);
    }

    // 5th failed attempt triggers lockout
    await expect(
      authService.login({ email: "lockout@delhi.local", password: "WrongPassword" }),
    ).rejects.toThrow(AccountLockedError);

    // Subsequent attempt even with correct password is still locked
    await expect(
      authService.login({ email: "lockout@delhi.local", password: "CorrectPassword123!" }),
    ).rejects.toThrow(AccountLockedError);

    // Fast-forward clock by 16 minutes
    clock.advanceMinutes(16);

    // Now login with correct password succeeds
    const successRes = await authService.login({
      email: "lockout@delhi.local",
      password: "CorrectPassword123!",
    });
    expect(successRes.token).toBeDefined();
  });

  it("invalidates session on logout", async () => {
    const reg = await authService.register({
      email: "logout@delhi.local",
      password: "CorrectPassword123!",
      displayName: "Logout User",
      householdName: "Logout Home",
      location: { name: "Delhi", lat: 28, lng: 77 },
    });

    await authService.logout(reg.token);
    await expect(authService.validateSession(reg.token)).rejects.toThrow(AuthenticationError);
  });
});
