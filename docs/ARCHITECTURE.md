# Saans Architecture Documentation

## 1. System Overview

**Saans** is built on a decoupled, hexagonal (Ports and Adapters) architecture designed to ensure zero-IO purity for core calculations, strict cross-tenant data isolation, and grounded, non-hallucinatory AI assistance.

```mermaid
flowchart TD
    Client["Web Client (React / Vite / Tailwind)"] -->|"HTTPS / JSON"| Express["Express API Gateway"]

    subgraph Express["Express API Server"]
        SecMid["Security Headers & Rate Limiting"] --> AuthMid["Session & RBAC Middleware"]
        AuthMid --> Routes["Sub-Routers (< 250 lines)"]

        subgraph Core["Core Pure Domain (Zero I/O)"]
            AQIEngine["CPCB / WHO NAQI Engine"]
            PlanEngine["Deterministic Plan Engine (P1-P10)"]
            IndoorPhysics["Indoor Mass-Balance Engine"]
            ExposureModel["Inhaled Dose Exposure Model"]
            EmissionModel["Avoided Emissions Engine"]
            SafetyInterceptor["Safety & Injection Guardrails"]
        end

        subgraph AI["GenAI Guardrails Pipeline"]
            FactsBuilder["Coarsened Facts Builder"]
            Retrieval["Curated KB Retrieval"]
            GeminiClient["Vertex AI Gemini 2.5"]
            Validators["Number Grounding & Banned Claims"]
        end

        subgraph Outbox["Reliability & Async Dispatch"]
            OutboxRepo["Transactional Outbox Repository"]
            BatchLease["isDispatching Mutex & Deduplication"]
            EmailSender["Email / Push Notification Port"]
        end
    end

    Routes --> Core
    Routes --> AI
    Routes --> Outbox

    AI -.->|"Deterministic Fallback on Outage"| Core
    Express -->|"Named DB 'saans'"| Firestore["Google Cloud Firestore"]
    Express -->|"OpenMeteo / CPCB"| AirAPIs["Air Quality Weather Providers"]
    CloudScheduler["Google Cloud Scheduler"] -->|"OIDC Bearer Token"| InternalRoutes["/internal/* Endpoints"]
```

---

## 2. Hexagonal Ports and Adapters

To guarantee that business logic is completely immune to external API shifts or database changes:

1. **`Clock` Port (`server/src/core/ports/clock.ts`)**:
   - In production: `SystemClock` reads system time.
   - In automated tests and Judge Demo Bar: `FakeClock` allows advancing time (`+15m`, `+1h`, `+6h`) with zero system clock pollution.
   - **Invariable Rule**: `Date.now()` and direct `new Date()` are strictly banned inside domain engines.

2. **`AirQualityProvider` Port (`server/src/core/ports/airProvider.ts`)**:
   - `OpenMeteoProvider`: Fetches real-time ambient PM2.5, PM10, temperature, and relative humidity.
   - `ScenarioProvider`: Provides deterministic test scenarios (`Clean`, `Moderate`, `Poor`, `Severe`, `Hazardous`) for live judging and CI.
   - `ProviderChain`: Chains live upstream with seamless fallback to simulated scenarios on network timeout.

3. **Repository Ports (`server/src/repositories/ports/`)**:
   - `HouseholdRepository`, `CommunityRepository`, `AuditRepository`, `OutboxRepository`.
   - Backed by high-speed in-memory implementations for sub-second CI execution and Firestore implementations for production persistence.

---

## 3. Pure Domain Calculation Engines

All mathematical models in `server/src/core/` are pure TypeScript functions without side effects or I/O:

- **CPCB NAQI & WHO Multiples (`core/aqi.ts`)**: Implements official Indian CPCB piecewise linear interpolation across 6 breakpoints. Computes exact WHO multiple: $\frac{\text{PM2.5}}{15\ \mu\text{g/m}^3}$.
- **Indoor Mass-Balance Physics (`core/indoor.ts`)**:
  $$\frac{dC_{\text{in}}}{dt} = a \cdot C_{\text{out}} - \left(a + k + \frac{\text{CADR}}{V}\right) C_{\text{in}} + \frac{S}{V}$$
  Computes continuous room particle concentration considering wall deposition ($k$), air exchange rate ($a$), room volume ($V$), and filter clean air delivery rate (CADR).
- **Inhaled Dose Exposure Model (`core/exposure.ts`)**:
  $$D = \sum_{i} C_i \cdot V_E \cdot t_i$$
  Calculates microgram PM2.5 lung burden across daily activity microenvironments, displaying uncertainty ranges rather than deceptive single-point numbers.
- **$k$-Anonymity Aggregator (`core/kAnonymity.ts`)**:
  Enforces strict $k \ge 5$ threshold before releasing community-level metrics. RWAs with fewer than 5 active households display an educational anonymity notice.

---

## 4. Grounded GenAI Guardrails Pipeline

```mermaid
sequenceDiagram
    participant User as User / Client
    participant Interceptor as Safety Interceptor
    participant Retrieval as Curated Knowledge Base
    participant Builder as Facts Payload Builder
    participant Gemini as Vertex AI Gemini
    participant Validator as Post-Model Validators

    User->>Interceptor: "Ask Saans" Query
    alt Emergency Symptoms (e.g. chest pain, cyanosis)
        Interceptor-->>User: Instant 112 Medical Alert (Deterministic)
    else Adversarial Prompt Injection (e.g. DAN, ignore rules)
        Interceptor-->>User: Neutralized Safe Refusal
    else Out-of-Scope Query (e.g. crypto, cricket)
        Interceptor-->>User: Polite Environmental Health Redirect
    else Valid Air Quality Query
        Interceptor->>Retrieval: Retrieve Relevant Curated Guidance
        Interceptor->>Builder: Construct Coarsened Facts (1 km approx, no PII)
        Builder->>Gemini: Low Temperature Prompt (0.2) + JSON Schema
        alt Model Outage or Network Failure
            Builder-->>User: Deterministic Rule-Based Fallback
        else Model Returns Response
            Gemini->>Validator: Validate Numbers against Facts & KB Citations
            alt Hallucinated Numbers or Banned Claims Detected
                Validator-->>User: Deterministic Plan Fallback
            else Validation Passed
                Validator-->>User: Grounded Answer with Badges & Citations
            end
        end
    end
```

---

## 5. Transactional Outbox Pattern

All critical events (smog threshold alerts, co-guardian escalations) write to the `outbox` table in the same transaction as household state updates:

- **Deduplication**: Monotonically assigned `idempotencyKey` prevents duplicate notifications across network retries.
- **Lease Mutex**: Atomic lease acquisition with `isDispatching` flag prevents concurrent Cloud Scheduler instances from double-sending messages.
- **Exponential Backoff**: Up to 3 automatic retries with dead-letter queue isolation for persistent failures.

---

## 6. SOLID Principles Verification

The codebase strictly adheres to the five SOLID design principles across all layers:

1. **Single Responsibility Principle (SRP)**:
   - Each module owns exactly one axis of change.
   - For example:
     - `server/src/core/aqi.ts` is responsible solely for CPCB NAQI breakpoint interpolation and WHO ratio math.
     - `server/src/core/indoor.ts` is responsible solely for mass-balance differential physics.
     - `server/src/core/safety.ts` is responsible solely for prompt sanitization, emergency symptom triage, and injection rejection.
     - `server/src/services/auth.service.ts` owns credential hashing and token lifecycle; it delegates storage to repository ports.
     - Express sub-routers in `server/src/routes/` handle exclusively HTTP request validation and status response mapping (each strictly $< 250$ lines).

2. **Open-Closed Principle (OCP)**:
   - Core behavior is extensible without modifying existing code through polymorphism and strategy registries:
     - **Air Quality Providers (`server/src/adapters/providerChain.ts`)**: New weather or municipal air providers (e.g. CPCB CAAQMS, IQAir, proprietary IoT sensors) implement the `AirQualityProvider` port and plug into `ProviderChain` without altering domain math.
     - **Plan Rules Engine (`server/src/core/planEngine.ts`)**: Rules P1 through P10 are modeled as isolated, prioritized rule evaluators. New municipal or health directives can be added to the evaluation pipeline without refactoring existing rules.
     - **Impact Calculation Models (`server/src/core/emissions.ts`)**: Emission factors in `server/src/data/emission-factors.json` can be calibrated for new vehicle categories or regional power grids without altering computation logic.

3. **Liskov Substitution Principle (LSP)**:
   - Derived implementations can be substituted for their abstractions without breaking callers or altering system invariants:
     - **Repository Implementations & Contract Suite (`server/src/repositories/ports/`, verified in `server/tests/repository.contract.test.ts`)**: A single parameterized contract test suite runs identically against `MemoryHouseholdRepository` and `FirestoreHouseholdRepository`, guaranteeing identical invariants, mutations, and return types across development, CI, and GCP Cloud Run environments.
     - **Clocks (`server/src/core/ports/clock.ts`)**: `SystemClock` (production) and `FakeClock` (testing and time-travel judging) are 100% interchangeable across all services and core engines.
     - **Air Quality Providers (`server/src/core/ports/airProvider.ts`)**: `OpenMeteoProvider` and `ScenarioProvider` both conform to the `AirQualityProvider` contract, allowing seamless fallback during network outages.

4. **Interface Segregation Principle (ISP)**:
   - Interfaces are fine-grained and purpose-specific, ensuring clients never depend on methods they do not need:
     - **Repository Ports**: `AuditRepository` defines strictly `append()` and `query()`; it omits mutative methods (`update`, `delete`) to guarantee immutability.
     - **Clock Port**: Exposes only `now(): Date`, keeping time consumer dependencies minimal.
     - **Air Provider Port**: Exposes only `getCurrentAndForecast(lat, lon, hours)`, decoupling callers from vendor-specific authentication, raw payload structures, or HTTP specifics.
     - **User Permissions**: Granular permissions in `shared/src/permissions.ts` segregate capabilities (`household:read`, `household:write`, `community:read`, `community:admin`, `audit:read`, `system:run-tasks`).

5. **Dependency Inversion Principle (DIP)**:
   - High-level business logic and core mathematical engines never import or depend on low-level database drivers, network clients, or Express web frameworks:
     - `server/src/core/` has **zero** dependencies on Express, Firestore, Node.js `fs`, or network APIs.
     - `server/src/services/` depend only on abstractions (`ports`), receiving concrete repository and clock adapters via dependency injection in `server/src/container.ts`.
     - High-level routes depend on domain service interfaces, not database implementations.

---

## 7. Architectural Decision Records (ADRs)

Detailed records of key architectural decisions are documented in the `docs/adr/` directory:

1. [ADR 0001: Clean Hexagonal Architecture & Monorepo Structure](adr/0001-architecture.md)
2. [ADR 0002: Google Cloud Platform Managed Services Selection](adr/0002-gcp-services.md)
3. [ADR 0003: Authentication, Session Management, and Credential Protection](adr/0003-auth-and-sessions.md)
4. [ADR 0004: Air Quality Impact Models and Data Provenance](adr/0004-impact-models.md)
5. [ADR 0005: AI Guardrails, Deterministic Interceptors, and Fallback Strategy](adr/0005-ai-guardrails.md)
6. [ADR 0006: Database Abstraction, Persistence Strategy, and Firestore Integration](adr/0006-database-ports.md)
