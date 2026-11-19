# ADR 0006: Database Abstraction, Persistence Strategy, and Firestore Integration

## Status

Accepted

## Context

Saans requires persistent storage for household profiles, community memberships, notification subscriptions, transactional outbox messages, and append-only audit trails. The persistence layer must support fast, fully deterministic automated testing in CI without external emulator dependencies, while deploying seamlessly to Google Cloud Firestore with strong multi-tenant isolation, sub-10ms queries, and enterprise security in production.

## Decisions

1. **Repository Port Interfaces (`server/src/repositories/ports/`):**
   - Persistence operations are abstracted behind pure TypeScript interfaces:
     - `HouseholdRepository`: Manages user profiles, household settings, vulnerability markers, and session tokens.
     - `CommunityRepository`: Manages RWA/society communities, memberships, and aggregated community statistics.
     - `AuditRepository`: Manages immutable, append-only security and operational audit logs.
     - `OutboxRepository`: Manages transactional outbox records with lease locks, retry counters, and delivery timestamps.
   - Domain services (`server/src/services/`) interact exclusively with these interfaces and have zero awareness of underlying storage technologies.

2. **Dual Adapter Implementations:**
   - **In-Memory Adapters (`server/src/repositories/memory/`)**:
     - Fast, deterministic, zero-dependency in-memory hash maps and arrays.
     - Used in automated unit suites (`npm test`), integration tests, and local demo modes.
     - Allows running the full 40-suite test battery in under 15 seconds without running Docker or downloading heavy Firestore emulators.
   - **Firestore Adapters (`server/src/repositories/firestore/`)**:
     - Integrates with the official `@google-cloud/firestore` SDK.
     - Connects to the dedicated named database `saans` in GCP region `asia-south1`.
     - Uses Google Cloud Application Default Credentials (ADC) with zero stored API keys or credentials.
     - Uses batch operations and transactions to guarantee atomic multi-document writes.

3. **Multi-Tenant Data Isolation:**
   - Every collection document is partitioned by `householdId` or `communityId`.
   - The repository layer enforces tenant validation on every read, update, and delete: queries without tenant scope are rejected.
   - Cross-tenant leakage tests (`server/tests/crossTenant.isolation.test.ts` and `community.no-household-leak.test.ts`) assert that no tenant can read or mutate another tenant's records.

4. **Append-Only Audit Trails:**
   - The `AuditRepository` contract exposes only `append()` and `query()`. There are deliberately no `update()` or `delete()` methods on the audit interface.
   - Every security-relevant action (login, logout, permission grant, profile deletion) writes an immutable audit record with timestamp, actor, IP address, and requestId.

5. **Compound Indexing & Transactional Outbox:**
   - High-throughput polling queries (e.g. `WHERE status == 'PENDING' AND nextAttemptAt <= now() ORDER BY nextAttemptAt ASC`) are backed by composite indexes defined in `infra/firestore.indexes.json`.
   - Dispatcher workers acquire leases via atomic Firestore transactions (`isDispatching: true`, `leaseExpiresAt: now() + 60s`), preventing duplicate dispatches in multi-instance Cloud Run deployments.

## Consequences

- Tests run at maximum developer velocity with zero network flakes or emulator boot overhead.
- Switching or migrating databases requires modifying only the adapter classes without touching domain logic.
- Production data is securely protected by Google Cloud IAM, Firestore security rules, and strict multi-tenant repository boundaries.
