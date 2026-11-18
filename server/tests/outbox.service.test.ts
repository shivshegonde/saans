import { describe, it, expect, beforeEach } from "vitest";
import { FakeClock } from "../src/adapters/fakeClock.js";
import { MemoryOutboxRepository } from "../src/repositories/memory/memoryOutboxRepo.js";
import { OutboxService, EmailSender } from "../src/services/outbox.service.js";

class MockEmailSender implements EmailSender {
  public failMode = false;
  public sentMessages: Array<{ to: string; subject: string }> = [];

  async send(to: string, subject: string, _body: string): Promise<boolean> {
    if (this.failMode) return false;
    this.sentMessages.push({ to, subject });
    return true;
  }
}

describe("OutboxService (Pillar 4 Efficiency, Mutex, Dead-letter)", () => {
  let clock: FakeClock;
  let outboxRepo: MemoryOutboxRepository;
  let emailSender: MockEmailSender;
  let outboxService: OutboxService;

  beforeEach(() => {
    clock = new FakeClock();
    outboxRepo = new MemoryOutboxRepository(clock);
    emailSender = new MockEmailSender();
    outboxService = new OutboxService(outboxRepo, emailSender, clock);
  });

  it("processes due outbox items and marks them SENT", async () => {
    await outboxRepo.create({
      tenantId: "hh-1",
      entityId: "alert-1",
      eventType: "SMOG_ALERT",
      channel: "email",
      recipient: "riya@saans.local",
      subject: "Severe Smog Alert",
      body: "AQI is 340",
      idempotencyKey: "key-1",
      scheduledFor: clock.now().toISOString(),
    });

    const result = await outboxService.processOutbox(10);
    expect(result.processed).toBe(1);
    expect(result.sent).toBe(1);
    expect(result.failed).toBe(0);
    expect(emailSender.sentMessages.length).toBe(1);

    // Items are no longer due
    const remaining = await outboxRepo.findDueItems(clock.now(), 10);
    expect(remaining.length).toBe(0);
  });

  it("handles delivery failure and transitions to DEAD_LETTER after 5 attempts", async () => {
    emailSender.failMode = true;

    const item = await outboxRepo.create({
      tenantId: "hh-1",
      entityId: "alert-deadletter",
      eventType: "SMOG_ALERT",
      channel: "email",
      recipient: "fail@saans.local",
      subject: "Alert",
      body: "Body",
      idempotencyKey: "key-deadletter",
      scheduledFor: clock.now().toISOString(),
    });

    // 4 failed dispatches
    for (let i = 0; i < 4; i++) {
      const res = await outboxService.processOutbox(10);
      expect(res.failed).toBe(1);
    }

    // 5th failed dispatch moves to DEAD_LETTER
    await outboxService.processOutbox(10);

    const tenantItems = await outboxRepo.listByTenant("hh-1");
    const found = tenantItems.find((i) => i.id === item.id);
    expect(found?.status).toBe("DEAD_LETTER");
    expect(found?.attempts).toBe(5);
  });

  it("prevents overlapping concurrent dispatches with mutex", async () => {
    // Acquire the repository dispatch lock manually
    await outboxRepo.acquireDispatchLock(60000);

    // Second runner cannot dispatch while lock is active
    const result = await outboxService.processOutbox(10);
    expect(result.processed).toBe(0);
    expect(result.sent).toBe(0);
  });
});
