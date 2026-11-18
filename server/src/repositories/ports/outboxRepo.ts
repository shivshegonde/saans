import { OutboxItemDto } from "shared";

export interface OutboxRepository {
  create(
    item: Omit<OutboxItemDto, "id" | "status" | "attempts" | "createdAt">,
  ): Promise<OutboxItemDto>;
  findDueItems(now: Date, limit: number): Promise<OutboxItemDto[]>;
  updateStatus(
    id: string,
    status: OutboxItemDto["status"],
    lastAttemptAt: Date,
    attemptsIncrement?: number,
  ): Promise<void>;
  acknowledge(id: string, acknowledgedAt: Date): Promise<void>;
  listByTenant(tenantId: string): Promise<OutboxItemDto[]>;
  acquireDispatchLock(leaseDurationMs: number): Promise<boolean>;
  releaseDispatchLock(): Promise<void>;
}
