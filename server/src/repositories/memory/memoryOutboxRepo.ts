import { Clock } from "../../core/ports/clock.js";
import { OutboxRepository } from "../ports/outboxRepo.js";
import { OutboxItemDto } from "shared";
import crypto from "node:crypto";

export class MemoryOutboxRepository implements OutboxRepository {
  private items = new Map<string, OutboxItemDto>();
  private itemsByIdempotencyKey = new Map<string, string>(); // idempotencyKey -> id
  private dispatchLockExpiresAt: Date | null = null;

  constructor(private clock: Clock) {}

  async create(
    item: Omit<OutboxItemDto, "id" | "status" | "attempts" | "createdAt">,
  ): Promise<OutboxItemDto> {
    const existingId = this.itemsByIdempotencyKey.get(item.idempotencyKey);
    if (existingId) {
      const existing = this.items.get(existingId);
      if (existing) return { ...existing };
    }

    const id = crypto.randomUUID();
    const full: OutboxItemDto = {
      ...item,
      id,
      status: "PENDING",
      attempts: 0,
      createdAt: this.clock.now().toISOString(),
    };
    this.items.set(id, full);
    this.itemsByIdempotencyKey.set(item.idempotencyKey, id);
    return { ...full };
  }

  async findDueItems(now: Date, limit: number): Promise<OutboxItemDto[]> {
    const nowIso = now.toISOString();
    const due: OutboxItemDto[] = [];
    for (const item of this.items.values()) {
      const isDueStatus = item.status === "PENDING" || item.status === "FAILED";
      if (isDueStatus && item.attempts < 5 && item.scheduledFor <= nowIso) {
        due.push({ ...item });
        if (due.length >= limit) break;
      }
    }
    return due;
  }

  async updateStatus(
    id: string,
    status: OutboxItemDto["status"],
    lastAttemptAt: Date,
    attemptsIncrement = 1,
  ): Promise<void> {
    const item = this.items.get(id);
    if (!item) throw new Error(`Outbox item ${id} not found`);
    item.status = status;
    item.lastAttemptAt = lastAttemptAt.toISOString();
    item.attempts += attemptsIncrement;
    this.items.set(id, item);
  }

  async acknowledge(id: string, acknowledgedAt: Date): Promise<void> {
    const item = this.items.get(id);
    if (!item) throw new Error(`Outbox item ${id} not found`);
    item.acknowledgedAt = acknowledgedAt.toISOString();
    this.items.set(id, item);
  }

  async listByTenant(tenantId: string): Promise<OutboxItemDto[]> {
    const result: OutboxItemDto[] = [];
    for (const item of this.items.values()) {
      if (item.tenantId === tenantId) {
        result.push({ ...item });
      }
    }
    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async acquireDispatchLock(leaseDurationMs: number): Promise<boolean> {
    const now = this.clock.now().getTime();
    if (this.dispatchLockExpiresAt && this.dispatchLockExpiresAt.getTime() > now) {
      return false; // Already locked
    }
    this.dispatchLockExpiresAt = new Date(now + leaseDurationMs);
    return true;
  }

  async releaseDispatchLock(): Promise<void> {
    this.dispatchLockExpiresAt = null;
  }
}
