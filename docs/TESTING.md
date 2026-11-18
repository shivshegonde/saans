# Saans Testing & Quality Assurance Documentation

## 1. Testing Strategy

Saans enforces a multi-layered automated verification strategy to guarantee that business logic is completely reliable, zero-defect, and reproducible without external network dependencies.

```mermaid
flowchart TD
    subgraph Core["Pure Domain Engines (100% Coverage)"]
        AQI["AQI & Breakpoint Math"]
        Physics["Indoor Mass-Balance Differential Equation"]
        Exposure["Inhaled Dose Calculation"]
        Rules["Plan Rules (P1-P10)"]
    end

    subgraph Service["Service Layer (Pillar 3 Security)"]
        RBAC["7-Scope Permission Check"]
        AuthLockout["5-Attempt Account Lockout"]
        CrossTenant["Cross-Tenant Data Isolation"]
        Privacy["k-Anonymity Zero-Leak Invariant"]
    end

    subgraph GenAI["GenAI Guardrails & Golden Evals"]
        Emergency["112 Emergency Interception"]
        Injection["Prompt Injection Neutralization"]
        Grounding["Number Grounding & Banned Claims"]
        Evals["32 Golden Evaluation Dataset"]
    end

    subgraph A11y["Web Frontend Accessibility"]
        Contrast["WCAG 2.2 AA Contrast Ratios"]
        HighContrast["High Contrast Theme (>= 7:1)"]
        FontScaler["Root Rem Scaler (100%/120%/140%)"]
        SkipLink["Global Skip-to-Content Link"]
    end
```

---

## 2. Test Suites Summary

| Test File                                   | Target Module                    | Invariant Verified                                                           |
| :------------------------------------------ | :------------------------------- | :--------------------------------------------------------------------------- |
| `tests/aqi.cpcb.test.ts`                    | `core/aqi.ts`                    | Exact CPCB breakpoints, NAQI category mapping, PM2.5 & PM10 handling         |
| `tests/aqi.who.test.ts`                     | `core/aqi.ts`                    | Accurate WHO 15 µg/m³ multiple calculation                                   |
| `tests/smogDrivers.test.ts`                 | `core/smogDrivers.ts`            | Identification of thermal inversion, wind stall, and biomass burning drivers |
| `tests/indoor.massBalance.test.ts`          | `core/indoor.ts`                 | Continuous mass-balance simulation with deposition, infiltration, and CADR   |
| `tests/indoor.purifierSizing.test.ts`       | `core/indoor.ts`                 | CADR calculation: Room Volume × 4.8 ACH                                      |
| `tests/exposure.test.ts`                    | `core/exposure.ts`               | Daily inhaled dose estimation with uncertainty bounds                        |
| `tests/emissions.test.ts`                   | `core/emissions.ts`              | Avoided carbon and particulate emissions factors                             |
| `tests/planEngine.rules.test.ts`            | `core/planEngine.ts`             | Priority ordering and conflict resolution across rules P1–P10                |
| `tests/safety.interceptor.test.ts`          | `core/safety.ts`                 | Pre-model deterministic emergency 112 routing                                |
| `tests/ics.rfc5545.test.ts`                 | `core/ics.ts`                    | Valid RFC 5545 `.ics` calendar export formatting                             |
| `tests/kAnonymity.test.ts`                  | `core/kAnonymity.ts`             | Strict $k \ge 5$ aggregation threshold                                       |
| `tests/knowledge.test.ts`                   | `core/knowledge.ts`              | Verified loading of 40+ curated scientific entries                           |
| `tests/auth.service.test.ts`                | `services/auth.service.ts`       | Account lockout after 5 consecutive failed attempts (HTTP 429)               |
| `tests/invitation.service.test.ts`          | `services/invitation.service.ts` | Single-use invitation tokens, scope mapping, expiration                      |
| `tests/revoke.immediate.test.ts`            | `services/household.service.ts`  | Instant access revocation with zero grace period                             |
| `tests/crossTenant.isolation.test.ts`       | `repositories/`                  | Complete isolation across household boundaries                               |
| `tests/community.no-household-leak.test.ts` | `services/community.service.ts`  | Zero household-identifying data leakage in community aggregates              |
| `tests/outbox.service.test.ts`              | `services/outbox.service.ts`     | Transactional outbox batching and `isDispatching` lease mutex                |
| `tests/alert.service.test.ts`               | `services/alert.service.ts`      | Smog threshold alerts and 15-minute co-guardian escalation                   |
| `tests/internal.oidc.test.ts`               | `routes/internal.routes.ts`      | Cloud Scheduler OIDC protection on `/internal/*`                             |
| `tests/ai.injection.test.ts`                | `ai/geminiClient.ts`             | Prompt injection and jailbreak defense                                       |
| `tests/ai.number-grounding.test.ts`         | `ai/validators.ts`               | Number hallucination rejection and medical claim filtering                   |
| `tests/ai.fallback.test.ts`                 | `ai/geminiClient.ts`             | Offline deterministic fallback during forced model outage                    |
| `tests/ai.evals.test.ts`                    | `ai/geminiClient.ts`             | 32-case Golden Evaluation dataset runner                                     |

---

## 3. Running the Verification Suite

Run all verification checks across the entire monorepo:

```bash
npm run verify
```

This single command executes:

1. Prettier formatting check (`npm run format:check`)
2. ESLint strict complexity and rule check (`npm run lint`)
3. TypeScript compiler typecheck across all workspaces (`npm run typecheck`)
4. Router file size check (`npm run check:size`)
5. Vitest test suite with 100% core coverage (`npm run test:coverage`)
6. Web accessibility and component test suite (`npm run test:web`)
7. Production Vite and TypeScript compilation (`npm run build`)
