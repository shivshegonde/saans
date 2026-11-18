import { Firestore } from "@google-cloud/firestore";
import { Clock } from "../../core/ports/clock.js";
import {
  HouseholdRepository,
  UserRecord,
  SessionRecord,
  MembershipRecord,
  ActionLogRecord,
} from "../ports/householdRepo.js";
import { HouseholdProfile, InvitationDto, AlertPreferenceDto } from "shared";

export class FirestoreHouseholdRepository implements HouseholdRepository {
  constructor(
    private db: Firestore,
    private clock: Clock,
  ) {}

  async createHousehold(profile: HouseholdProfile, ownerUserId: string): Promise<HouseholdProfile> {
    const householdRef = this.db.collection("households").doc(profile.id);
    const membershipRef = this.db.collection("memberships").doc(`${profile.id}_${ownerUserId}`);
    const now = this.clock.now();

    const membership: MembershipRecord = {
      userId: ownerUserId,
      householdId: profile.id,
      role: "OWNER",
      scopes: ["READ", "CREATE", "UPDATE", "DELETE", "INVITE", "REVOKE", "AUDIT"],
      status: "ACTIVE",
      createdAt: now,
    };

    const batch = this.db.batch();
    batch.set(householdRef, profile);
    batch.set(membershipRef, membership);
    await batch.commit();

    return profile;
  }

  async getHousehold(householdId: string): Promise<HouseholdProfile | null> {
    const doc = await this.db.collection("households").doc(householdId).get();
    if (!doc.exists) return null;
    return doc.data() as HouseholdProfile;
  }

  async updateHousehold(
    householdId: string,
    updates: Partial<HouseholdProfile>,
  ): Promise<HouseholdProfile> {
    const ref = this.db.collection("households").doc(householdId);
    await ref.set(updates, { merge: true });
    const updated = await ref.get();
    return updated.data() as HouseholdProfile;
  }

  async deleteHousehold(householdId: string): Promise<void> {
    await this.db.collection("households").doc(householdId).delete();
  }

  async createUser(
    user: Omit<UserRecord, "failedLoginAttempts" | "lockoutUntil" | "createdAt">,
  ): Promise<UserRecord> {
    const record: UserRecord = {
      ...user,
      email: user.email.toLowerCase(),
      failedLoginAttempts: 0,
      lockoutUntil: null,
      createdAt: this.clock.now(),
    };
    await this.db.collection("users").doc(user.id).set(record);
    return record;
  }

  async getUserByEmail(email: string): Promise<UserRecord | null> {
    const snap = await this.db
      .collection("users")
      .where("email", "==", email.toLowerCase())
      .limit(1)
      .get();
    if (snap.empty) return null;
    const doc = snap.docs[0];
    if (!doc) return null;
    return doc.data() as UserRecord;
  }

  async getUserById(id: string): Promise<UserRecord | null> {
    const doc = await this.db.collection("users").doc(id).get();
    if (!doc.exists) return null;
    return doc.data() as UserRecord;
  }

  async updateUserPassword(userId: string, newPasswordHash: string): Promise<void> {
    await this.db.collection("users").doc(userId).update({ passwordHash: newPasswordHash });
    await this.deleteUserSessions(userId);
  }

  async recordLoginAttempt(
    userId: string,
    success: boolean,
    lockoutDurationMinutes = 15,
  ): Promise<UserRecord> {
    const ref = this.db.collection("users").doc(userId);
    const doc = await ref.get();
    if (!doc.exists) throw new Error(`User ${userId} not found`);
    const user = doc.data() as UserRecord;
    const now = this.clock.now();

    if (success) {
      user.failedLoginAttempts = 0;
      user.lockoutUntil = null;
    } else {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      if (user.failedLoginAttempts >= 5) {
        user.lockoutUntil = new Date(now.getTime() + lockoutDurationMinutes * 60 * 1000);
      }
    }
    await ref.set(user, { merge: true });
    return user;
  }

  async createSession(session: Omit<SessionRecord, "createdAt">): Promise<SessionRecord> {
    const record: SessionRecord = {
      ...session,
      createdAt: this.clock.now(),
    };
    await this.db.collection("sessions").doc(session.tokenHash).set(record);
    return record;
  }

  async getSession(tokenHash: string): Promise<SessionRecord | null> {
    const doc = await this.db.collection("sessions").doc(tokenHash).get();
    if (!doc.exists) return null;
    const session = doc.data() as SessionRecord;
    // Check expiration
    const exp = session.expiresAt instanceof Date ? session.expiresAt : new Date(session.expiresAt);
    if (exp.getTime() <= this.clock.now().getTime()) {
      await doc.ref.delete();
      return null;
    }
    return session;
  }

  async deleteSession(tokenHash: string): Promise<void> {
    await this.db.collection("sessions").doc(tokenHash).delete();
  }

  async deleteUserSessions(userId: string): Promise<void> {
    const snap = await this.db.collection("sessions").where("userId", "==", userId).get();
    const batch = this.db.batch();
    snap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }

  async deleteHouseholdSessions(householdId: string): Promise<void> {
    const snap = await this.db.collection("sessions").where("householdId", "==", householdId).get();
    const batch = this.db.batch();
    snap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }

  async getMembership(householdId: string, userId: string): Promise<MembershipRecord | null> {
    const doc = await this.db.collection("memberships").doc(`${householdId}_${userId}`).get();
    if (!doc.exists) return null;
    return doc.data() as MembershipRecord;
  }

  async createMembership(record: Omit<MembershipRecord, "createdAt">): Promise<MembershipRecord> {
    const full: MembershipRecord = {
      ...record,
      createdAt: this.clock.now(),
    };
    await this.db.collection("memberships").doc(`${record.householdId}_${record.userId}`).set(full);
    return full;
  }

  async revokeMembership(householdId: string, userId: string): Promise<void> {
    const ref = this.db.collection("memberships").doc(`${householdId}_${userId}`);
    const doc = await ref.get();
    if (!doc.exists) return;
    const mem = doc.data() as MembershipRecord;
    if (mem.role === "OWNER") {
      throw new Error("Cannot revoke owner of the household");
    }
    await ref.update({
      status: "REVOKED",
      revokedAt: this.clock.now(),
    });

    // Invalidate user sessions for this household immediately
    const snap = await this.db
      .collection("sessions")
      .where("householdId", "==", householdId)
      .where("userId", "==", userId)
      .get();
    const batch = this.db.batch();
    snap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }

  async listMemberships(householdId: string): Promise<MembershipRecord[]> {
    const snap = await this.db
      .collection("memberships")
      .where("householdId", "==", householdId)
      .get();
    return snap.docs.map((d) => d.data() as MembershipRecord);
  }

  async getUserMemberships(userId: string): Promise<MembershipRecord[]> {
    const snap = await this.db
      .collection("memberships")
      .where("userId", "==", userId)
      .where("status", "==", "ACTIVE")
      .get();
    return snap.docs.map((d) => d.data() as MembershipRecord);
  }

  async createInvitation(invite: InvitationDto & { tokenHash: string }): Promise<void> {
    await this.db.collection("invitations").doc(invite.id).set(invite);
  }

  async getInvitationByTokenHash(
    tokenHash: string,
  ): Promise<(InvitationDto & { tokenHash: string }) | null> {
    const snap = await this.db
      .collection("invitations")
      .where("tokenHash", "==", tokenHash)
      .limit(1)
      .get();
    if (snap.empty) return null;
    const doc = snap.docs[0];
    if (!doc) return null;
    return doc.data() as InvitationDto & { tokenHash: string };
  }

  async getInvitationById(id: string): Promise<(InvitationDto & { tokenHash: string }) | null> {
    const doc = await this.db.collection("invitations").doc(id).get();
    if (!doc.exists) return null;
    return doc.data() as InvitationDto & { tokenHash: string };
  }

  async updateInvitationStatus(
    id: string,
    status: "ACCEPTED" | "REVOKED" | "EXPIRED",
    revokedAt?: string,
  ): Promise<void> {
    const updateData: Record<string, unknown> = { status };
    if (revokedAt) updateData.revokedAt = revokedAt;
    await this.db.collection("invitations").doc(id).update(updateData);
  }

  async listInvitations(householdId: string): Promise<InvitationDto[]> {
    const snap = await this.db
      .collection("invitations")
      .where("householdId", "==", householdId)
      .get();
    return snap.docs.map((d) => {
      const data = d.data() as InvitationDto & { tokenHash?: string };
      delete data.tokenHash;
      return data;
    });
  }

  async logAction(log: ActionLogRecord): Promise<void> {
    const docId = `${log.householdId}_${log.date}_${log.cardId}`;
    await this.db.collection("actionLogs").doc(docId).set(log);
  }

  async getActionLogs(householdId: string, date: string): Promise<ActionLogRecord[]> {
    const snap = await this.db
      .collection("actionLogs")
      .where("householdId", "==", householdId)
      .where("date", "==", date)
      .get();
    return snap.docs.map((d) => d.data() as ActionLogRecord);
  }

  async getAlertPreference(householdId: string): Promise<AlertPreferenceDto | null> {
    const doc = await this.db.collection("alertPreferences").doc(householdId).get();
    if (!doc.exists) return null;
    return doc.data() as AlertPreferenceDto;
  }

  async setAlertPreference(pref: AlertPreferenceDto): Promise<void> {
    await this.db.collection("alertPreferences").doc(pref.householdId).set(pref);
  }
}
