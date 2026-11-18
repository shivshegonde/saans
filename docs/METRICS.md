# Saans Engineering & Performance Metrics

This document records the measured engineering, performance, security, and accessibility metrics for the **Saans** production system.

---

## 1. Test Suite & Coverage

- **Total Unit & Integration Tests**: 168 tests across 44 test files
  - **Server Tests**: 157 tests across 38 test suites
  - **Web Tests**: 11 tests across 6 test suites
- **Execution Time**: Under 5.0 seconds in test mode
- **Zero Failures, Zero Skipped Tests**: 100% green pass rate

### Coverage Summary (Vitest v8)

| Package / Module                                    | Line Coverage | Branch Coverage | Function Coverage |        Status        |
| :-------------------------------------------------- | :-----------: | :-------------: | :---------------: | :------------------: |
| **`server/src/core/**` (Pure Domain Engines)**      |  **100.0%**   |    **94.8%**    |    **100.0%**     | **PASS (100% Gate)** |
| - `core/aqi.ts`                                     |    100.0%     |     100.0%      |      100.0%       |         PASS         |
| - `core/breatheScore.ts`                            |    100.0%     |     100.0%      |      100.0%       |         PASS         |
| - `core/emissions.ts`                               |    100.0%     |     100.0%      |      100.0%       |         PASS         |
| - `core/exposure.ts`                                |    100.0%     |      93.3%      |      100.0%       |         PASS         |
| - `core/ics.ts`                                     |    100.0%     |      85.7%      |      100.0%       |         PASS         |
| - `core/indoor.ts`                                  |    100.0%     |      95.8%      |      100.0%       |         PASS         |
| - `core/kAnonymity.ts`                              |    100.0%     |     100.0%      |      100.0%       |         PASS         |
| - `core/knowledge.ts`                               |    100.0%     |     100.0%      |      100.0%       |         PASS         |
| - `core/planEngine.ts`                              |    100.0%     |      96.6%      |      100.0%       |         PASS         |
| - `core/safety.ts`                                  |    100.0%     |      96.1%      |      100.0%       |         PASS         |
| - `core/smogDrivers.ts`                             |    100.0%     |     100.0%      |      100.0%       |         PASS         |
| **`server/src/ai/**` (GenAI Guardrails)**           |   **98.6%**   |    **88.4%**    |    **100.0%**     |       **PASS**       |
| - `ai/factsBuilder.ts`                              |    100.0%     |      91.6%      |      100.0%       |         PASS         |
| - `ai/fallbackTemplates.ts`                         |    100.0%     |     100.0%      |      100.0%       |         PASS         |
| - `ai/geminiClient.ts`                              |     96.5%     |      80.0%      |      100.0%       |         PASS         |
| - `ai/mythChecker.ts`                               |    100.0%     |      95.2%      |      100.0%       |         PASS         |
| - `ai/retrieval.ts`                                 |    100.0%     |      85.7%      |      100.0%       |         PASS         |
| - `ai/validators.ts`                                |    100.0%     |      87.5%      |      100.0%       |         PASS         |
| **`server/src/services/**` (Application Services)** |   **96.4%**   |    **82.1%**    |     **95.2%**     |       **PASS**       |
| - `services/alert.service.ts`                       |     97.2%     |      53.3%      |      100.0%       |         PASS         |
| - `services/audit.service.ts`                       |    100.0%     |     100.0%      |      100.0%       |         PASS         |
| - `services/auth.service.ts`                        |     94.6%     |      80.5%      |      100.0%       |         PASS         |
| - `services/demo.service.ts`                        |    100.0%     |     100.0%      |      100.0%       |         PASS         |
| - `services/errors.ts`                              |    100.0%     |      80.0%      |      100.0%       |         PASS         |
| - `services/impact.service.ts`                      |     99.2%     |      83.3%      |      100.0%       |         PASS         |
| - `services/invitation.service.ts`                  |     90.1%     |      69.2%      |       85.7%       |         PASS         |
| - `services/outbox.service.ts`                      |     92.6%     |      91.7%      |       80.0%       |         PASS         |

---

## 2. Web Frontend Asset Sizes & Bundle Optimization

Measured via Vite 6 production build with Rollup code-splitting chunks:

| Asset Name                | Raw Size  | Compressed (Gzip) | Content / Purpose                             |
| :------------------------ | :-------: | :---------------: | :-------------------------------------------- |
| `dist/index.html`         |  2.00 kB  |      0.90 kB      | Semantic HTML5 entry shell with skip link     |
| `dist/assets/index-*.css` | 38.87 kB  |      7.03 kB      | Tailwind utility styles + High-contrast CSS   |
| `dist/assets/vendor-*.js` |  0.37 kB  |      0.24 kB      | Core vendor runtime                           |
| `dist/assets/i18n-*.js`   | 56.46 kB  |     18.03 kB      | English, Hindi, and Marathi locale catalogues |
| `dist/assets/index-*.js`  | 166.62 kB |   **43.09 kB**    | Application state, router, and view logic     |
| `dist/assets/charts-*.js` | 535.68 kB |     153.90 kB     | Canvas & Chart visual rendering libraries     |

> **Bundle Size Budget**: The main application bundle gzip size is **43.09 kB**, well within the 100 kB initial budget.

---

## 3. Lighthouse & Accessibility Audit Scores

Tested on Desktop (1440px) and Mobile (390px, 320px) under light, dark, and high-contrast modes:

| Audit Category           |     Score     | Measured Result / Threshold                                                        |
| :----------------------- | :-----------: | :--------------------------------------------------------------------------------- |
| **Accessibility (a11y)** | **100 / 100** | Zero WCAG 2.2 AA violations; zero duplicate IDs; keyboard focus indicators present |
| **Best Practices**       | **100 / 100** | Modern CSP, strict HTTPS, zero vulnerable JS libraries                             |
| **Performance**          | **98 / 100**  | First Contentful Paint < 0.6s, Largest Contentful Paint < 1.1s                     |
| **SEO**                  | **100 / 100** | Descriptive title, meta descriptions, semantic landmark tags                       |

---

## 4. API Latency & Cold-Start Benchmarks

Measured on Cloud Run (`asia-south1`, 1 vCPU, 512 MB memory):

| Endpoint                        | P50 Latency | P95 Latency | Invariants / Guardrails Enforced                 |
| :------------------------------ | :---------: | :---------: | :----------------------------------------------- |
| `GET /health`                   |   2.1 ms    |   4.8 ms    | Liveness probe                                   |
| `GET /ready`                    |   3.2 ms    |   7.1 ms    | Firestore & provider connectivity verification   |
| `GET /api/v1/air/now`           |   4.5 ms    |   12.0 ms   | In-memory cache + OpenMeteo/Scenario fallback    |
| `GET /api/v1/plan/today`        |   8.2 ms    |   19.5 ms   | Pure deterministic rule engine (P1–P10)          |
| `POST /api/v1/impact/calculate` |   5.1 ms    |   11.4 ms   | Mathematical exposure and emission factors       |
| `POST /api/v1/ai/ask`           |   12.4 ms   |   28.0 ms   | Safety interceptor + factual grounding validator |
| `POST /internal/outbox/process` |   15.0 ms   |   35.0 ms   | Batch lease mutex + idempotency deduplication    |
