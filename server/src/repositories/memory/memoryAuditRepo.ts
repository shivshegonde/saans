import { AuditRepository } from "../ports/auditRepo.js";
import { AuditLogEntry } from "shared";
import crypto from "node:crypto";

export class MemoryAuditRepository implements AuditRepository {
  private logs: AuditLogEntry[] = [];

  async append(entry: Omit<AuditLogEntry, "id">): Promise<AuditLogEntry> {
    const full: AuditLogEntry = {
      ...entry,
      id: crypto.randomUUID(),
    };
    this.logs.push(full);
    return { ...full };
  }

  async listByTenant(tenantId: string, limit = 100): Promise<AuditLogEntry[]> {
    return this.logs
      .filter((l) => l.tenantId === tenantId)
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
      .slice(0, limit);
  }
}
