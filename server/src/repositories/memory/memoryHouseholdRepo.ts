import { Clock } from "../../core/ports/clock.js";
import {
  HouseholdRepository,
  UserRecord,
  SessionRecord,
  MembershipRecord,
  ActionLogRecord,
} from "../ports/householdRepo.js";
import { HouseholdProfile, InvitationDto, AlertPreferenceDto } from "shared";

export class MemoryHouseholdRepository implements HouseholdRepository {
  private households = new Map<string, HouseholdProfile>();
  private users = new Map<string, UserRecord>();
  private usersByEmail = new Map<string, string>(); // email -> userId
  private sessions = new Map<string, SessionRecord>(); // tokenHash -> SessionRecord
  private memberships = new Map<string, MembershipRecord>(); // householdId:userId -> MembershipRecord
  private invitations = new Map<string, InvitationDto & { tokenHash: string }>(); // id -> Invitation
  private invitationsByTokenHash = new Map<string, string>(); // tokenHash -> id
  private actionLogs: ActionLogRecord[] = [];
  private alertPreferences = new Map<string, AlertPreferenceDto>();

  constructor(private clock: Clock) {}

  async createHousehold(profile: HouseholdProfile, ownerUserId: string): Promise<HouseholdProfile> {
    this.households.set(profile.id, { ...profile });
    const now = this.clock.now();
    const membership: MembershipRecord = {
      userId: ownerUserId,
      householdId: profile.id,
      role: "OWNER",
      scopes: ["READ", "CREATE", "UPDATE", "DELETE", "INVITE", "REVOKE", "AUDIT"],
      status: "ACTIVE",
      createdAt: now,
    };
    this.memberships.set(`${profile.id}:${ownerUserId}`, membership);
    return { ...profile };
  }

  async getHousehold(householdId: string): Promise<HouseholdProfile | null> {
    const found = this.households.get(householdId);
    return found ? { ...found } : null;
  }

  async updateHousehold(
    householdId: string,
    updates: Partial<HouseholdProfile>,
  ): Promise<HouseholdProfile> {
    const existing = this.households.get(householdId);
    if (!existing) {
      throw new Error(`Household ${householdId} not found`);
    }
    const updated = { ...existing, ...updates };
    this.households.set(householdId, updated);
    return { ...updated };
  }

  async deleteHousehold(householdId: string): Promise<void> {
    this.households.delete(householdId);
    // clean up associated memberships and sessions
    for (const [key, mem] of this.memberships.entries()) {
      if (mem.householdId === householdId) {
        this.memberships.delete(key);
      }
    }
    for (const [tokenHash, session] of this.sessions.entries()) {
      if (session.householdId === householdId) {
        this.sessions.delete(tokenHash);
      }
    }
  }

  async createUser(
    user: Omit<UserRecord, "failedLoginAttempts" | "lockoutUntil" | "createdAt">,
  ): Promise<UserRecord> {
    if (this.usersByEmail.has(user.email.toLowerCase())) {
      throw new Error(`User with email ${user.email} already exists`);
    }
    const record: UserRecord = {
      ...user,
      email: user.email.toLowerCase(),
      failedLoginAttempts: 0,
      lockoutUntil: null,
      createdAt: this.clock.now(),
    };
    this.users.set(user.id, record);
    this.usersByEmail.set(record.email, user.id);
    return { ...record };
  }

  async getUserByEmail(email: string): Promise<UserRecord | null> {
    const id = this.usersByEmail.get(email.toLowerCase());
    if (!id) return null;
    return this.getUserById(id);
  }

  async getUserById(id: string): Promise<UserRecord | null> {
    const user = this.users.get(id);
    return user ? { ...user } : null;
  }

  async updateUserPassword(userId: string, newPasswordHash: string): Promise<void> {
    const user = this.users.get(userId);
    if (!user) throw new Error(`User ${userId} not found`);
    user.passwordHash = newPasswordHash;
    this.users.set(userId, user);
    await this.deleteUserSessions(userId);
  }

  async recordLoginAttempt(
    userId: string,
    success: boolean,
    lockoutDurationMinutes = 15,
  ): Promise<UserRecord> {
    const user = this.users.get(userId);
    if (!user) throw new Error(`User ${userId} not found`);
    const now = this.clock.now();

    if (success) {
      user.failedLoginAttempts = 0;
      user.lockoutUntil = null;
    } else {
      user.failedLoginAttempts += 1;
      if (user.failedLoginAttempts >= 5) {
        user.lockoutUntil = new Date(now.getTime() + lockoutDurationMinutes * 60 * 1000);
      }
    }
    this.users.set(userId, user);
    return { ...user };
  }

  async createSession(session: Omit<SessionRecord, "createdAt">): Promise<SessionRecord> {
    const record: SessionRecord = {
      ...session,
      createdAt: this.clock.now(),
    };
    this.sessions.set(session.tokenHash, record);
    return { ...record };
  }

  async getSession(tokenHash: string): Promise<SessionRecord | null> {
    const session = this.sessions.get(tokenHash);
    if (!session) return null;
    if (session.expiresAt.getTime() <= this.clock.now().getTime()) {
      this.sessions.delete(tokenHash);
      return null;
    }
    return { ...session };
  }

  async deleteSession(tokenHash: string): Promise<void> {
    this.sessions.delete(tokenHash);
  }

  async deleteUserSessions(userId: string): Promise<void> {
    for (const [hash, session] of this.sessions.entries()) {
      if (session.userId === userId) {
        this.sessions.delete(hash);
      }
    }
  }

  async deleteHouseholdSessions(householdId: string): Promise<void> {
    for (const [hash, session] of this.sessions.entries()) {
      if (session.householdId === householdId) {
        this.sessions.delete(hash);
      }
    }
  }

  async getMembership(householdId: string, userId: string): Promise<MembershipRecord | null> {
    const mem = this.memberships.get(`${householdId}:${userId}`);
    return mem ? { ...mem } : null;
  }

  async createMembership(record: Omit<MembershipRecord, "createdAt">): Promise<MembershipRecord> {
    const full: MembershipRecord = {
      ...record,
      createdAt: this.clock.now(),
    };
    this.memberships.set(`${record.householdId}:${record.userId}`, full);
    return { ...full };
  }

  async revokeMembership(householdId: string, userId: string): Promise<void> {
    const key = `${householdId}:${userId}`;
    const mem = this.memberships.get(key);
    if (!mem) return;
    if (mem.role === "OWNER") {
      throw new Error("Cannot revoke owner of the household");
    }
    mem.status = "REVOKED";
    mem.revokedAt = this.clock.now();
    this.memberships.set(key, mem);

    // Invalidate user's sessions for this household immediately
    for (const [hash, session] of this.sessions.entries()) {
      if (session.householdId === householdId && session.userId === userId) {
        this.sessions.delete(hash);
      }
    }
  }

  async listMemberships(householdId: string): Promise<MembershipRecord[]> {
    const result: MembershipRecord[] = [];
    for (const mem of this.memberships.values()) {
      if (mem.householdId === householdId) {
        result.push({ ...mem });
      }
    }
    return result;
  }

  async getUserMemberships(userId: string): Promise<MembershipRecord[]> {
    const result: MembershipRecord[] = [];
    for (const mem of this.memberships.values()) {
      if (mem.userId === userId && mem.status === "ACTIVE") {
        result.push({ ...mem });
      }
    }
    return result;
  }

  async createInvitation(invite: InvitationDto & { tokenHash: string }): Promise<void> {
    this.invitations.set(invite.id, { ...invite });
    this.invitationsByTokenHash.set(invite.tokenHash, invite.id);
  }

  async getInvitationByTokenHash(
    tokenHash: string,
  ): Promise<(InvitationDto & { tokenHash: string }) | null> {
    const id = this.invitationsByTokenHash.get(tokenHash);
    if (!id) return null;
    return this.getInvitationById(id);
  }

  async getInvitationById(id: string): Promise<(InvitationDto & { tokenHash: string }) | null> {
    const inv = this.invitations.get(id);
    return inv ? { ...inv } : null;
  }

  async updateInvitationStatus(
    id: string,
    status: "ACCEPTED" | "REVOKED" | "EXPIRED",
    revokedAt?: string,
  ): Promise<void> {
    const inv = this.invitations.get(id);
    if (!inv) throw new Error(`Invitation ${id} not found`);
    inv.status = status;
    if (revokedAt) inv.revokedAt = revokedAt;
    this.invitations.set(id, inv);
  }

  async listInvitations(householdId: string): Promise<InvitationDto[]> {
    const list: InvitationDto[] = [];
    for (const inv of this.invitations.values()) {
      if (inv.householdId === householdId) {
        const dto = { ...inv };
        delete (dto as { tokenHash?: string }).tokenHash;
        list.push(dto);
      }
    }
    return list;
  }

  async logAction(log: ActionLogRecord): Promise<void> {
    const idx = this.actionLogs.findIndex(
      (l) => l.householdId === log.householdId && l.cardId === log.cardId && l.date === log.date,
    );
    if (idx >= 0) {
      this.actionLogs[idx] = log;
    } else {
      this.actionLogs.push(log);
    }
  }

  async getActionLogs(householdId: string, date: string): Promise<ActionLogRecord[]> {
    return this.actionLogs.filter((l) => l.householdId === householdId && l.date === date);
  }

  async getAlertPreference(householdId: string): Promise<AlertPreferenceDto | null> {
    const pref = this.alertPreferences.get(householdId);
    return pref ? { ...pref } : null;
  }

  async setAlertPreference(pref: AlertPreferenceDto): Promise<void> {
    this.alertPreferences.set(pref.householdId, { ...pref });
  }
}
