import { Firestore } from "@google-cloud/firestore";
import { AuditRepository } from "../ports/auditRepo.js";
import { AuditLogEntry } from "shared";
import crypto from "node:crypto";

export class FirestoreAuditRepository implements AuditRepository {
  constructor(private db: Firestore) {}

  async append(entry: Omit<AuditLogEntry, "id">): Promise<AuditLogEntry> {
    const id = crypto.randomUUID();
    const full: AuditLogEntry = {
      ...entry,
      id,
    };
    await this.db.collection("auditLog").doc(id).set(full);
    return full;
  }

  async listByTenant(tenantId: string, limit = 100): Promise<AuditLogEntry[]> {
    const snap = await this.db
      .collection("auditLog")
      .where("tenantId", "==", tenantId)
      .orderBy("at", "desc")
      .limit(limit)
      .get();
    return snap.docs.map((d) => d.data() as AuditLogEntry);
  }
}
