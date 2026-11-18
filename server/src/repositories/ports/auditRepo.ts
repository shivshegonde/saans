import { AuditLogEntry } from "shared";

/**
 * AuditRepository - Append-only interface for immutable audit logs.
 * Purposely provides NO update or delete methods to satisfy Section 8 invariants.
 */
export interface AuditRepository {
  append(entry: Omit<AuditLogEntry, "id">): Promise<AuditLogEntry>;
  listByTenant(tenantId: string, limit?: number): Promise<AuditLogEntry[]>;
}
