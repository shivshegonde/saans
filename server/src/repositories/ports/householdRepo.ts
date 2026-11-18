import { HouseholdProfile, InvitationDto, AlertPreferenceDto } from "shared";

export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  displayName: string;
  failedLoginAttempts: number;
  lockoutUntil: Date | null;
  createdAt: Date;
}

export interface SessionRecord {
  tokenHash: string;
  userId: string;
  householdId: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface MembershipRecord {
  userId: string;
  householdId: string;
  role: "OWNER" | "MEMBER";
  scopes: string[];
  status: "ACTIVE" | "REVOKED";
  invitedBy?: string;
  createdAt: Date;
  revokedAt?: Date;
}

export interface ActionLogRecord {
  id: string;
  householdId: string;
  memberId: string;
  cardId: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
  timestamp: Date;
}

export interface HouseholdRepository {
  // Households
  createHousehold(profile: HouseholdProfile, ownerUserId: string): Promise<HouseholdProfile>;
  getHousehold(householdId: string): Promise<HouseholdProfile | null>;
  updateHousehold(
    householdId: string,
    updates: Partial<HouseholdProfile>,
  ): Promise<HouseholdProfile>;
  deleteHousehold(householdId: string): Promise<void>;

  // Users
  createUser(
    user: Omit<UserRecord, "failedLoginAttempts" | "lockoutUntil" | "createdAt">,
  ): Promise<UserRecord>;
  getUserByEmail(email: string): Promise<UserRecord | null>;
  getUserById(id: string): Promise<UserRecord | null>;
  updateUserPassword(userId: string, newPasswordHash: string): Promise<void>;
  recordLoginAttempt(
    userId: string,
    success: boolean,
    lockoutDurationMinutes?: number,
  ): Promise<UserRecord>;

  // Sessions
  createSession(session: Omit<SessionRecord, "createdAt">): Promise<SessionRecord>;
  getSession(tokenHash: string): Promise<SessionRecord | null>;
  deleteSession(tokenHash: string): Promise<void>;
  deleteUserSessions(userId: string): Promise<void>;
  deleteHouseholdSessions(householdId: string): Promise<void>;

  // Memberships
  getMembership(householdId: string, userId: string): Promise<MembershipRecord | null>;
  createMembership(record: Omit<MembershipRecord, "createdAt">): Promise<MembershipRecord>;
  revokeMembership(householdId: string, userId: string): Promise<void>;
  listMemberships(householdId: string): Promise<MembershipRecord[]>;
  getUserMemberships(userId: string): Promise<MembershipRecord[]>;

  // Invitations
  createInvitation(invite: InvitationDto & { tokenHash: string }): Promise<void>;
  getInvitationByTokenHash(
    tokenHash: string,
  ): Promise<(InvitationDto & { tokenHash: string }) | null>;
  getInvitationById(id: string): Promise<(InvitationDto & { tokenHash: string }) | null>;
  updateInvitationStatus(
    id: string,
    status: "ACCEPTED" | "REVOKED" | "EXPIRED",
    revokedAt?: string,
  ): Promise<void>;
  listInvitations(householdId: string): Promise<InvitationDto[]>;

  // Action logs
  logAction(log: ActionLogRecord): Promise<void>;
  getActionLogs(householdId: string, date: string): Promise<ActionLogRecord[]>;

  // Alerts
  getAlertPreference(householdId: string): Promise<AlertPreferenceDto | null>;
  setAlertPreference(pref: AlertPreferenceDto): Promise<void>;
}
