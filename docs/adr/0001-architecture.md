# ADR 0001: Clean Hexagonal Architecture & Monorepo Structure

## Status

Accepted

## Context

Saans is an urban air quality assistant that requires deterministic calculations, high auditability, robust security, and reliable fallbacks if external APIs or AI systems are unavailable. The architecture must strictly separate core mathematical and logical models from HTTP frameworks, database drivers, and external AI services.

## Decision

1. **Hexagonal (Ports & Adapters) Pattern:**
   - **`server/src/core/`**: Pure functions with zero I/O and zero framework dependencies. Clock, random generators, and math dependencies are injected. Invariants (NAQI, mass-balance indoor PM2.5, inhaled doses, avoided emissions, plan rules P1–P10) live here.
   - **`server/src/services/`**: Application business logic orchestrated around repository and provider ports.
   - **`server/src/repositories/`**: Decoupled repository interfaces (`ports`) with dual implementations: in-memory adapters (for fast unit testing and determinism) and Firestore adapters (for production).
   - **`server/src/adapters/`**: External integration adapters (Air Quality Provider Chain, Vertex AI Gemini, Email Sender, Clock).
   - **`server/src/routes/`**: Express sub-routers with each file strictly under 250 lines of code, mounted uniformly at `/api/v1`.
2. **Monorepo Structure (npm workspaces):**
   - `shared/`: TypeScript contracts and Zod schemas shared between `server/` and `web/`.
   - `server/`: Backend service running on Node.js LTS with strict TypeScript.
   - `web/`: Frontend Single Page Application built with Vite, React, Tailwind CSS, Radix UI, TanStack Query, and i18next.
3. **Strict Validation and Fail-Closed Security:**
   - Zod validation at every network boundary (requests, responses, and environment variables).
   - Explicit RBAC scopes on every protected route.

## Consequences

- 100% test coverage can be achieved on core engines without mocking network or disk I/O.
- Zero-cost test execution in memory without requiring local database emulators for fast unit suites.
- High resilience: provider outages degrade gracefully to synthetic scenario curves or keyless fallbacks.
