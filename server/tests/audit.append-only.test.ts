import { describe, it, expect } from "vitest";
import { MemoryAuditRepository } from "../src/repositories/memory/memoryAuditRepo.js";
import { AuditService } from "../src/services/audit.service.js";

describe("AuditRepository & AuditService (Pillar 3 Security, Immutable Audit Trail)", () => {
  it("appends audit records and retrieves them ordered by reverse chronology", async () => {
    const repo = new MemoryAuditRepository();
    const service = new AuditService(repo);

    await service.append({
      tenantId: "hh-audit",
      actorId: "user-1",
      action: "ACTION_1",
      entityType: "SETTING",
      entityId: "id-1",
      beforeSnapshot: null,
      afterSnapshot: { val: 1 },
      correlationId: "corr-1",
      at: "2026-11-18T10:00:00Z",
    });

    await service.append({
      tenantId: "hh-audit",
      actorId: "user-1",
      action: "ACTION_2",
      entityType: "SETTING",
      entityId: "id-2",
      beforeSnapshot: { val: 1 },
      afterSnapshot: { val: 2 },
      correlationId: "corr-2",
      at: "2026-11-18T11:00:00Z",
    });

    const logs = await service.listHouseholdAudit("hh-audit");
    expect(logs.length).toBe(2);
    expect(logs[0]?.action).toBe("ACTION_2"); // latest first
    expect(logs[1]?.action).toBe("ACTION_1");
  });

  it("strictly provides only append and listByTenant methods (immutable contract)", () => {
    const repo = new MemoryAuditRepository();
    expect(repo).toHaveProperty("append");
    expect(repo).toHaveProperty("listByTenant");
    expect((repo as unknown as Record<string, unknown>)["update"]).toBeUndefined();
    expect((repo as unknown as Record<string, unknown>)["delete"]).toBeUndefined();
  });
});
