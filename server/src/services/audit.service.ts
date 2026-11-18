import { AuditRepository } from "../repositories/ports/auditRepo.js";
import { AuditLogEntry } from "shared";

export class AuditService {
  constructor(private auditRepo: AuditRepository) {}

  async listHouseholdAudit(householdId: string, limit = 50): Promise<AuditLogEntry[]> {
    return this.auditRepo.listByTenant(householdId, limit);
  }

  async append(entry: Omit<AuditLogEntry, "id">): Promise<AuditLogEntry> {
    return this.auditRepo.append(entry);
  }
}
