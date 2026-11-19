import { Clock } from "../core/ports/clock.js";
import type { EmailSender } from "../core/ports/emailSender.js";
import { OutboxRepository } from "../repositories/ports/outboxRepo.js";
import { OutboxItemDto } from "shared";

export type { EmailSender };

export class ConsoleEmailSender implements EmailSender {
  async send(_to: string, _subject: string, _body: string): Promise<boolean> {
    // Console adapter for dev, tests, and judge demo inspection
    return true;
  }
}

export class OutboxService {
  private inProcessDispatching = false;

  constructor(
    private outboxRepo: OutboxRepository,
    private emailSender: EmailSender,
    private clock: Clock,
  ) {}

  async processOutbox(
    batchSize = 20,
  ): Promise<{ processed: number; sent: number; failed: number }> {
    // Dual concurrency mutex: in-process flag AND repository distributed lease
    if (this.inProcessDispatching) {
      return { processed: 0, sent: 0, failed: 0 };
    }

    const acquired = await this.outboxRepo.acquireDispatchLock(30000); // 30s lease
    if (!acquired) {
      return { processed: 0, sent: 0, failed: 0 };
    }

    this.inProcessDispatching = true;
    let sent = 0;
    let failed = 0;

    try {
      const now = this.clock.now();
      const dueItems = await this.outboxRepo.findDueItems(now, batchSize);

      for (const item of dueItems) {
        try {
          const success = await this.emailSender.send(item.recipient, item.subject, item.body);
          if (success) {
            await this.outboxRepo.updateStatus(item.id, "SENT", this.clock.now());
            sent++;
          } else {
            throw new Error("Email provider returned failure");
          }
        } catch {
          failed++;
          const newAttempts = item.attempts + 1;
          const status: OutboxItemDto["status"] = newAttempts >= 5 ? "DEAD_LETTER" : "FAILED";
          await this.outboxRepo.updateStatus(item.id, status, this.clock.now(), 1);
        }
      }

      return { processed: dueItems.length, sent, failed };
    } finally {
      this.inProcessDispatching = false;
      await this.outboxRepo.releaseDispatchLock();
    }
  }

  async listTenantOutbox(tenantId: string): Promise<OutboxItemDto[]> {
    return this.outboxRepo.listByTenant(tenantId);
  }
}
