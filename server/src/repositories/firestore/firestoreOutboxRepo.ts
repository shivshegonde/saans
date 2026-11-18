import { Firestore } from "@google-cloud/firestore";
import { Clock } from "../../core/ports/clock.js";
import { OutboxRepository } from "../ports/outboxRepo.js";
import { OutboxItemDto } from "shared";
import crypto from "node:crypto";

export class FirestoreOutboxRepository implements OutboxRepository {
  constructor(
    private db: Firestore,
    private clock: Clock,
  ) {}

  async create(
    item: Omit<OutboxItemDto, "id" | "status" | "attempts" | "createdAt">,
  ): Promise<OutboxItemDto> {
    // Check idempotency
    const existingSnap = await this.db
      .collection("outbox")
      .where("idempotencyKey", "==", item.idempotencyKey)
      .limit(1)
      .get();
    if (!existingSnap.empty) {
      const doc = existingSnap.docs[0];
      if (doc) return doc.data() as OutboxItemDto;
    }

    const id = crypto.randomUUID();
    const full: OutboxItemDto = {
      ...item,
      id,
      status: "PENDING",
      attempts: 0,
      createdAt: this.clock.now().toISOString(),
    };
    await this.db.collection("outbox").doc(id).set(full);
    return full;
  }

  async findDueItems(now: Date, limit: number): Promise<OutboxItemDto[]> {
    const snap = await this.db
      .collection("outbox")
      .where("status", "in", ["PENDING", "FAILED"])
      .where("scheduledFor", "<=", now.toISOString())
      .limit(limit)
      .get();
    return snap.docs
      .map((d) => d.data() as OutboxItemDto)
      .filter((item) => (item.attempts || 0) < 5);
  }

  async updateStatus(
    id: string,
    status: OutboxItemDto["status"],
    lastAttemptAt: Date,
    attemptsIncrement = 1,
  ): Promise<void> {
    const ref = this.db.collection("outbox").doc(id);
    const doc = await ref.get();
    if (!doc.exists) throw new Error(`Outbox item ${id} not found`);
    const current = doc.data() as OutboxItemDto;

    await ref.update({
      status,
      lastAttemptAt: lastAttemptAt.toISOString(),
      attempts: (current.attempts || 0) + attemptsIncrement,
    });
  }

  async acknowledge(id: string, acknowledgedAt: Date): Promise<void> {
    await this.db.collection("outbox").doc(id).update({
      acknowledgedAt: acknowledgedAt.toISOString(),
    });
  }

  async listByTenant(tenantId: string): Promise<OutboxItemDto[]> {
    const snap = await this.db
      .collection("outbox")
      .where("tenantId", "==", tenantId)
      .orderBy("createdAt", "desc")
      .get();
    return snap.docs.map((d) => d.data() as OutboxItemDto);
  }

  async acquireDispatchLock(leaseDurationMs: number): Promise<boolean> {
    const leaseRef = this.db.collection("leases").doc("outbox_dispatch");
    const now = this.clock.now().getTime();

    return this.db.runTransaction(async (tx) => {
      const doc = await tx.get(leaseRef);
      if (doc.exists) {
        const data = doc.data();
        if (data && data.expiresAt && data.expiresAt > now) {
          return false; // Still active
        }
      }
      tx.set(leaseRef, { expiresAt: now + leaseDurationMs, acquiredAt: now });
      return true;
    });
  }

  async releaseDispatchLock(): Promise<void> {
    const leaseRef = this.db.collection("leases").doc("outbox_dispatch");
    await leaseRef.delete();
  }
}
