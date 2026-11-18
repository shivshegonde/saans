import crypto from "node:crypto";
import { Clock } from "../core/ports/clock.js";
import { HouseholdRepository } from "../repositories/ports/householdRepo.js";
import { AuditRepository } from "../repositories/ports/auditRepo.js";
import {
  AuthenticationError,
  AccountLockedError,
  ConflictError,
  ValidationError,
} from "./errors.js";
import { AuthSessionResponse, UserRegisterRequest, UserLoginRequest } from "shared";

const COMMON_PASSWORDS = new Set([
  "password",
  "password123",
  "12345678",
  "123456789",
  "qwerty123",
  "welcome1",
  "admin123",
  "letmein1",
]);

export class AuthService {
  constructor(
    private householdRepo: HouseholdRepository,
    private auditRepo: AuditRepository,
    private clock: Clock,
  ) {}

  hashPassword(password: string): string {
    const salt = crypto.randomBytes(16).toString("hex");
    const derivedKey = crypto.scryptSync(password, salt, 64);
    return `${salt}:${derivedKey.toString("hex")}`;
  }

  verifyPassword(password: string, storedHash: string): boolean {
    const [salt, key] = storedHash.split(":");
    if (!salt || !key) return false;
    const keyBuffer = Buffer.from(key, "hex");
    const derivedKey = crypto.scryptSync(password, salt, 64);
    if (keyBuffer.length !== derivedKey.length) return false;
    return crypto.timingSafeEqual(keyBuffer, derivedKey);
  }

  hashToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  async register(req: UserRegisterRequest, correlationId = "system"): Promise<AuthSessionResponse> {
    if (req.password.length < 8) {
      throw new ValidationError("Password must be at least 8 characters");
    }
    if (COMMON_PASSWORDS.has(req.password.toLowerCase())) {
      throw new ValidationError("Password is too common or easily guessed");
    }

    const existingUser = await this.householdRepo.getUserByEmail(req.email);
    if (existingUser) {
      throw new ConflictError("An account with this email already exists");
    }

    const userId = crypto.randomUUID();
    const householdId = crypto.randomUUID();
    const passwordHash = this.hashPassword(req.password);

    await this.householdRepo.createUser({
      id: userId,
      email: req.email,
      passwordHash,
      displayName: req.displayName,
    });

    const household = await this.householdRepo.createHousehold(
      {
        id: householdId,
        name: req.householdName,
        location: req.location,
        members: [
          {
            id: crypto.randomUUID(),
            name: req.displayName,
            ageGroup: "adult",
            sensitiveFlags: {
              child: false,
              olderAdult: false,
              respiratoryCondition: false,
              pregnancy: false,
            },
            commuteMode: "metro",
            commuteDistanceKm: 10,
          },
        ],
        rooms: [
          {
            id: crypto.randomUUID(),
            name: "Living Room",
            volumeM3: 45,
            hasPurifier: true,
            purifierCadrM3h: 300,
            windowsHabit: "closed",
          },
        ],
        cookingFuel: "lpg",
        aiPersonalizationConsent: true,
        shareWithCommunityConsent: false,
        preferredLanguage: "en",
      },
      userId,
    );

    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = this.hashToken(token);
    const expiresAt = new Date(this.clock.now().getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await this.householdRepo.createSession({
      tokenHash,
      userId,
      householdId,
      expiresAt,
    });

    await this.auditRepo.append({
      tenantId: householdId,
      actorId: userId,
      action: "AUTH_REGISTER",
      entityType: "USER",
      entityId: userId,
      beforeSnapshot: null,
      afterSnapshot: { email: req.email, displayName: req.displayName },
      correlationId,
      at: this.clock.now().toISOString(),
    });

    return {
      token,
      user: {
        id: userId,
        email: req.email,
        displayName: req.displayName,
      },
      household: {
        id: household.id,
        name: household.name,
        role: "OWNER",
        scopes: ["READ", "CREATE", "UPDATE", "DELETE", "INVITE", "REVOKE", "AUDIT"],
      },
    };
  }

  async login(req: UserLoginRequest, correlationId = "system"): Promise<AuthSessionResponse> {
    const user = await this.householdRepo.getUserByEmail(req.email);
    if (!user) {
      throw new AuthenticationError("Invalid email or password");
    }

    const now = this.clock.now();
    if (user.lockoutUntil && user.lockoutUntil.getTime() > now.getTime()) {
      const remainingSeconds = Math.ceil((user.lockoutUntil.getTime() - now.getTime()) / 1000);
      throw new AccountLockedError(
        `Account temporarily locked due to multiple failed attempts. Try again in ${remainingSeconds} seconds.`,
        remainingSeconds,
      );
    }

    const isMatch = this.verifyPassword(req.password, user.passwordHash);
    if (!isMatch) {
      const updatedUser = await this.householdRepo.recordLoginAttempt(user.id, false);
      if (updatedUser.lockoutUntil && updatedUser.lockoutUntil.getTime() > now.getTime()) {
        const remainingSeconds = Math.ceil(
          (updatedUser.lockoutUntil.getTime() - now.getTime()) / 1000,
        );
        throw new AccountLockedError(
          `Account locked after 5 failed login attempts. Try again in ${remainingSeconds} seconds.`,
          remainingSeconds,
        );
      }
      throw new AuthenticationError("Invalid email or password");
    }

    // Login successful: reset failed attempts
    await this.householdRepo.recordLoginAttempt(user.id, true);

    // Fetch user active household membership
    const memberships = await this.householdRepo.getUserMemberships(user.id);
    const targetHouseholdId = (req as { householdId?: string }).householdId;
    const activeMembership = targetHouseholdId
      ? memberships.find((m) => m.householdId === targetHouseholdId)
      : memberships[memberships.length - 1];
    if (!activeMembership) {
      throw new AuthenticationError("User is not associated with any active household");
    }

    const household = await this.householdRepo.getHousehold(activeMembership.householdId);
    if (!household) {
      throw new AuthenticationError("Household not found");
    }

    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = this.hashToken(token);
    const expiresAt = new Date(this.clock.now().getTime() + 30 * 24 * 60 * 60 * 1000);

    await this.householdRepo.createSession({
      tokenHash,
      userId: user.id,
      householdId: household.id,
      expiresAt,
    });

    await this.auditRepo.append({
      tenantId: household.id,
      actorId: user.id,
      action: "AUTH_LOGIN",
      entityType: "SESSION",
      entityId: user.id,
      beforeSnapshot: null,
      afterSnapshot: { email: user.email },
      correlationId,
      at: this.clock.now().toISOString(),
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
      },
      household: {
        id: household.id,
        name: household.name,
        role: activeMembership.role,
        scopes: activeMembership.scopes,
      },
    };
  }

  async validateSession(token: string): Promise<{
    user: { id: string; email: string; displayName: string };
    household: { id: string; name: string; role: "OWNER" | "MEMBER"; scopes: string[] };
  }> {
    const tokenHash = this.hashToken(token);
    const session = await this.householdRepo.getSession(tokenHash);
    if (!session) {
      throw new AuthenticationError("Session expired or invalid");
    }

    const user = await this.householdRepo.getUserById(session.userId);
    if (!user) {
      throw new AuthenticationError("User not found");
    }

    const membership = await this.householdRepo.getMembership(session.householdId, session.userId);
    if (!membership || membership.status !== "ACTIVE") {
      await this.householdRepo.deleteSession(tokenHash);
      throw new AuthenticationError("Membership has been revoked or is inactive");
    }

    const household = await this.householdRepo.getHousehold(session.householdId);
    if (!household) {
      throw new AuthenticationError("Household not found");
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
      },
      household: {
        id: household.id,
        name: household.name,
        role: membership.role,
        scopes: membership.scopes,
      },
    };
  }

  async logout(token: string): Promise<void> {
    const tokenHash = this.hashToken(token);
    await this.householdRepo.deleteSession(tokenHash);
  }
}
