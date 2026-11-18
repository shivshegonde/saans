# Saans — Urban Air Quality Assistant · Antigravity Master Prompt

**Hackathon:** Catalyst PromptWars · **Problem:** Urban Air Quality Assistant (winter smog)
**GCP project:** `ai-builder-sql-copilot` · **Hosting:** Cloud Run · **Product name:** Saans (Hindi/Marathi for "breath" — rename freely)

---

## How to use this file

1. Open an **empty folder** as a new workspace in Antigravity (a different folder from the CareCircle build; both can share the same GCP project safely because every resource here is prefixed `saans-`).
2. Start a new agent conversation in **Planning mode** with the strongest reasoning model available.
3. Paste everything between `===== BEGIN PROMPT =====` and `===== END PROMPT =====` as the first message.
4. Approve the **Implementation Plan** only if it follows §13. The plan is built around one rule: **a deployed, tested vertical slice exists after Phase 1**, so you always have something to submit.
5. Speed tip: once Phase 1 is done (contracts, scaffold, CI), you may open two extra agents in the Agent Manager — one for `server/`, one for `web/` — each told to touch only its own folder and the shared Zod contracts. Merge before Phase 5.
6. Keep this file in the repo as `docs/PROMPT.md`.

---

===== BEGIN PROMPT =====

## 0. Role, objective and the grading formula

You are one elite team: Principal Software Architect, Staff Security Engineer, Lead Full-Stack Developer, product designer and QA lead. Design, implement, deploy and verify **Saans**, a GenAI-powered urban air quality assistant, engineered to score **100% under an automated, multi-dimensional AI review** (first gate) and to impress human judges (second gate) with how it **looks, feels and explains itself**.

**Grading model (assume exactly this):**

```
Total Score    = Σ (CategoryScore_i × Weight_i), i = 1..6
CategoryScore  = 0.75 × booleanSubscore + 0.25 × numericSubscore
```

_booleanSubscore_ = discrete pass/fail evidence (file exists, endpoint guarded, header present, test present, rule implemented). _numericSubscore_ = measured values (coverage %, test count and speed, compression ratio, Lighthouse, contrast ratios).

| #   | Category                        | Weight | What the reviewer looks for                                                   |
| --- | ------------------------------- | ------ | ----------------------------------------------------------------------------- |
| 1   | **Requirement alignment**       | 33.33% | Problem fidelity, domain model, persona workflows, invariants, grounded GenAI |
| 2   | **Code quality & architecture** | 22.22% | SOLID, sub-routers < 250 lines, OpenAPI 3.0, linters, strict TS               |
| 3   | **Security & data protection**  | 16.67% | Granular RBAC, tenant isolation, rate limiting, headers, audit trail          |
| 4   | **Efficiency & scalability**    | 11.11% | Compound indexes, outbox batching, compression, caching                       |
| 5   | **Testing & coverage**          | 8.33%  | 100% line coverage on core services, edge branches, 0 failures                |
| 6   | **Accessibility & inclusivity** | 8.33%  | WCAG 2.2 AA, high-contrast mode, rem scaling, ARIA                            |

**Rules that follow from the formula:**

- **Code quality, security, testing, efficiency and accessibility are primary deliverables, not polish.** They are the first gate and carry 67% of the score. Build them from the first commit, not at the end.
- Every pass/fail item in §7–§11 and §16 is a _boolean_ the reviewer can check. Make each one findable by the exact file or name given.
- Every measured item must have a real number recorded in `docs/METRICS.md`, produced by `npm run metrics` (coverage, test count and duration, bundle size, compression ratio, Lighthouse, contrast results).
- Spend effort proportionally to weight, but never ship a category at zero: a missing boolean costs more than a missing nicety.

**Working mode:** produce an _Implementation Plan_ and _Task List_ artifact first. Execute phase by phase (§13), run the gate commands after each phase, show real output, and continue only when the gate passes. Finish with a _Walkthrough_ artifact containing screenshots from the browser run of the **deployed** app at 390 px, 768 px and 1440 px.

---

## 1. Problem, personas and product vision

**Problem statement:** _Create a GenAI-powered assistant that helps families and communities navigate severe winter smog and urban air pollution. The application should suggest low-emission daily routines, indoor air quality hacks, and sustainable alternatives tailored to their location and lifestyle, while clearly explaining the direct impact of their choices._

**Interpretation (each clause becomes testable requirements in §3):**

| Clause                                                  | What we build                                                                                                                                            |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| "GenAI-powered assistant"                               | Gemini on Vertex AI: grounded, cited, multilingual assistant plus narrative plans — with a deterministic engine underneath that works when AI is offline |
| "families and communities"                              | Household accounts with members and dependents; communities (RWA, school, office) with privacy-safe aggregate impact                                     |
| "low-emission daily routines"                           | A personalised, time-ordered Daily Plan of action cards                                                                                                  |
| "indoor air quality hacks"                              | Indoor Air Hub: room model, purifier sizing, ventilation timing, hacks library, room simulator                                                           |
| "sustainable alternatives"                              | Transport, cooking, energy and waste alternatives with cost/time trade-offs                                                                              |
| "tailored to location and lifestyle"                    | Live local air and weather data plus a household/lifestyle profile                                                                                       |
| "clearly explaining the direct impact of their choices" | **Impact Lab**: transparent, two-lens calculations (my family's exposure · my city's emissions) with assumptions and uncertainty                         |

| Persona                         | Role                                 | Needs                                                                  | View                                     |
| ------------------------------- | ------------------------------------ | ---------------------------------------------------------------------- | ---------------------------------------- |
| **Riya, 38, Delhi-NCR**         | `HOUSEHOLD_OWNER`                    | Protect a 6-year-old with asthma and her parents; practical, not scary | Streamlined, large cards, plain language |
| **Dadaji, 68**                  | `HOUSEHOLD_MEMBER` (invited, scoped) | Know when his morning walk is safe; large text, Hindi                  | Today + plan, high readability           |
| **Mr. Kulkarni, RWA secretary** | `COMMUNITY_ADMIN`                    | Understand collective impact, run pledges, issue advisories            | Data-dense dashboard, aggregates only    |

**Design principles:**

1. **Calm clarity, never panic.** Honest, specific, actionable. No full-screen alarm red, no fear copy.
2. **Code decides, AI explains.** All numbers come from deterministic, cited, tested engines. Gemini personalises, phrases, translates and converses — and may never introduce a number or claim that the engines and knowledge base did not supply.
3. **Show your work.** Every impact figure opens an "How we calculated this" sheet: formula, inputs, sources, uncertainty range.
4. **Household owns its data.** Collaborators get revocable, scoped access; communities see only k-anonymous aggregates.
5. **Safe by default.** No medical advice or diagnosis; emergency symptoms short-circuit to emergency guidance before any model is called.
6. **Works offline from the AI.** Core features run deterministically if Gemini, Google APIs or any air-data provider is unavailable.
7. **Inclusive.** Hindi, Marathi and English; high-contrast; scalable text; screen-reader and keyboard complete.

---

## 2. Cloud environment (already provisioned — do not re-create)

- Google Cloud CLI (`gcloud`) is **already installed, authenticated and configured**. Everything needed is set up; you may use **any Google Cloud service and any Vertex AI / Gemini model** the design needs.
- Project: **`ai-builder-sql-copilot`**. Run `gcloud config set project ai-builder-sql-copilot` and verify it.
- Host on **Cloud Run**; use managed Google Cloud services for database, scheduling, AI, secrets, air-quality data, observability and CI/CD. Add one line per service to `docs/adr/0002-gcp-services.md` explaining why it earns its place.
- This project **may already hold other resources** (including another hackathon app named `carecircle-*`). **Never modify or delete anything you did not create.** Prefix every resource with `saans-`; use the **named Firestore database `saans`**.
- Region `asia-south1` (Mumbai) by default; verify availability per service (Vertex AI may need `global` or another region → `VERTEX_LOCATION`).
- **ADC and attached service accounts only.** No JSON key files, no secrets in the repo.

**Pre-flight (Phase 0 — run and report output before writing code):**

```bash
gcloud config set project ai-builder-sql-copilot
gcloud config list && gcloud auth list
gcloud services list --enabled --format="value(config.name)"
gcloud run services list --region asia-south1
gcloud firestore databases list
```

Enable (idempotent, `infra/00-enable-apis.sh`): `run`, `cloudbuild`, `artifactregistry`, `firestore`, `secretmanager`, `cloudscheduler`, `aiplatform`, `logging`, `monitoring`, `cloudtrace`, `clouderrorreporting`, `iamcredentials`, plus `airquality.googleapis.com`, `texttospeech`, `pubsub`, `bigquery`, `cloudtasks` as needed.

**Model usage:** do not hard-code Gemini model IDs from memory. In Phase 0 test candidate IDs with the Google Gen AI SDK (`@google/genai`, Vertex mode), pick the newest stable **Flash-class** (chat, plans, translation) and **Pro-class** (complex reasoning, evals) models that respond in the project, and store them as `GEMINI_MODEL_FAST` and `GEMINI_MODEL_REASONING`.

| Google Cloud service                                     | Used for                                                                                             | Tier                                    |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | --------------------------------------- |
| **Cloud Run**                                            | One service `saans` serving the API and the built web app; `max-instances` capped                    | Core                                    |
| **Firestore** (named DB `saans`)                         | Households, memberships, plans, ledger, communities, outbox, audit log; TTL on sessions/attempts     | Core                                    |
| **Vertex AI Gemini**                                     | Grounded assistant, plan narrative, translation, myth check, advisory/complaint drafts               | Core                                    |
| **Google Maps Platform Air Quality API**                 | Primary live and forecast air data, local AQI, health recommendations (key in Secret Manager)        | Core (with keyless Open-Meteo fallback) |
| **Secret Manager**                                       | Session pepper, air-quality API key, email credentials                                               | Core                                    |
| **Cloud Scheduler**                                      | Alert evaluation every 15 min, outbox dispatch every minute, demo reset nightly (OIDC-authenticated) | Core                                    |
| **Artifact Registry + Cloud Build**                      | Image build and CI (`npm run verify` → build → deploy)                                               | Core                                    |
| **Cloud Logging / Error Reporting / Monitoring / Trace** | Structured logs with trace correlation, log-based metrics, uptime check, alert on failed dispatch    | Core                                    |
| **Cloud Text-to-Speech**                                 | Read-aloud of Today's Plan in en/hi/mr (cached)                                                      | Plus                                    |
| **Pub/Sub → BigQuery**                                   | Anonymised impact events for community analytics                                                     | Plus                                    |
| **Cloud Tasks**                                          | Per-alert delivery with retry and deterministic names                                                | Plus                                    |
| **Gemini grounding with Google Search**                  | Local advisories (e.g. city smog-response stages) shown with citations                               | Plus                                    |
| **Cloud KMS**                                            | Envelope encryption of sensitive-group flags                                                         | Plus                                    |

**Config:** one `config.ts` validates all environment variables with Zod at startup and fails fast. Ship `.env.example`: `GCP_PROJECT_ID=ai-builder-sql-copilot`, `GCP_REGION=asia-south1`, `FIRESTORE_DATABASE=saans`, `VERTEX_LOCATION`, `GEMINI_MODEL_FAST`, `GEMINI_MODEL_REASONING`, `AQ_PROVIDER_ORDER=google,openmeteo,scenario`, `EMAIL_PROVIDER` (`console|smtp`), `EMAIL_FROM`, `PUBLIC_BASE_URL`, `DEMO_MODE`, `K_ANONYMITY_MIN=5`, `NODE_ENV`.

**Email:** Google Cloud has no transactional-email product. Implement an `EmailSender` port with `console` (dev/tests/judge inspector) and `smtp` adapters. **Pause and ask me for SMTP credentials during Phase 6**; store them in Secret Manager.

**Ask me before:** anything destructive, IAM changes beyond service accounts you created, enabling services outside the list, or spending decisions.

---

## 3. Product specification (Pillar 1 — requirement alignment)

Tag each requirement `FR-n` in code comments and tests.

| ID    | Requirement                          | Acceptance criteria                                                                                                                                                                                                                                                                                                     |
| ----- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-1  | **Onboarding and household profile** | ≤ 60 s, 4 steps, skippable: location (geolocation or search) → who lives here (adult, child, older adult, respiratory condition, pregnancy as flags only) → lifestyle (commute mode and distance, vehicle, cooking fuel, windows habit, purifiers with CADR, room areas) → language, alerts, AI-personalisation consent |
| FR-2  | **Air Now**                          | Live PM2.5/PM10/NO₂/O₃/CO/SO₂, **CPCB NAQI computed by us** plus provider AQI, dominant pollutant, WHO-guideline multiple, freshness and provenance, 72 h forecast                                                                                                                                                      |
| FR-3  | **Smog drivers**                     | Plain-language reasons from weather (low wind, shallow mixing/inversion proxy, high humidity, cold) with thresholds documented                                                                                                                                                                                          |
| FR-4  | **Best-window finder**               | Best/worst hours for outdoor activity, ventilation and commute, per household member sensitivity                                                                                                                                                                                                                        |
| FR-5  | **Daily Plan**                       | Time-ordered action cards: why, impact (health + city), effort, cost band, evidence level, done/skip/swap; works fully without AI                                                                                                                                                                                       |
| FR-6  | **Indoor Air Hub**                   | Per-room dynamic indoor PM2.5 estimate, purifier right-sizing, ventilation schedule, hacks library, interactive Room Simulator                                                                                                                                                                                          |
| FR-7  | **Sustainable alternatives**         | Transport, cooking, heating/energy, waste: ranked by impact, cost and time; honest trade-offs (e.g. cycling in severe smog)                                                                                                                                                                                             |
| FR-8  | **Impact Lab**                       | Two lenses: _My family's exposure_ and _My city's emissions_. Before/after, formula sheet, assumptions, uncertainty range                                                                                                                                                                                               |
| FR-9  | **Impact Ledger and Breathe Score**  | Weekly receipt of actions done → exposure reduced, emissions avoided, money saved; Breathe Score is deterministic habit-and-exposure score                                                                                                                                                                              |
| FR-10 | **Ask Saans**                        | Grounded, cited chat in en/hi/mr; read-only tools; proposals need a tap to apply; emergency/out-of-scope/injection interceptor before the model                                                                                                                                                                         |
| FR-11 | **Myth Check**                       | Paste a forwarded claim → verdict (supported / partly / unsupported / no evidence) with citations from the knowledge base                                                                                                                                                                                               |
| FR-12 | **Family mode**                      | Per-member guidance, school-run and outdoor-activity advisor, elder walk-time advisor                                                                                                                                                                                                                                   |
| FR-13 | **Household sharing**                | Owner invites members with scopes (`VIEW_PLAN`, `LOG_ACTIONS`, `EDIT_PROFILE`); one-click instant revoke with zero residual access                                                                                                                                                                                      |
| FR-14 | **Communities**                      | Join by invite code; pledges; collective impact using only k-anonymous aggregates (n ≥ `K_ANONYMITY_MIN`); admin dashboard; advisory composer (AI draft → admin approval → outbox); civic-complaint drafter (draft only, never auto-sent)                                                                               |
| FR-15 | **Smog alerts**                      | Opt-in thresholds; evaluated by Scheduler; delivered through the transactional outbox; acknowledgement with grace-period escalation to a co-guardian (only with their consent)                                                                                                                                          |
| FR-16 | **Calendar export**                  | RFC 5545 `.ics` for plan items, best windows and alerts (`GET /api/v1/plan/ics`)                                                                                                                                                                                                                                        |
| FR-17 | **Multilingual and voice**           | UI and AI output in English, Hindi, Marathi; read-aloud via Cloud TTS with Web Speech fallback                                                                                                                                                                                                                          |
| FR-18 | **PWA and offline**                  | Installable; last-known Air Now and plan available offline with a clear "last updated" banner                                                                                                                                                                                                                           |
| FR-19 | **Data rights and audit**            | Owner exports all data (JSON) and deletes the household; immutable audit trail visible to the owner                                                                                                                                                                                                                     |
| FR-20 | **Judge Demo Bar**                   | §12; gated by `DEMO_MODE`; affects only the caller's own demo session                                                                                                                                                                                                                                                   |

**Non-negotiable domain invariants (each has a test):**

- The household owner owns the data; the owner cannot be removed or revoked by anyone.
- A revoked member loses access on the very next request; their sessions are invalidated.
- Community admins can never read household-level data — only aggregates over ≥ `K_ANONYMITY_MIN` contributing households; leaving a community removes the household from aggregates immediately.
- AI and background jobs **never** perform destructive or irreversible actions (delete, revoke, invite, send a community broadcast, change settings) without explicit human approval.
- Sensitive-group flags are never sent to the LLM with identifiers; only abstract categories, and only if the owner has consented to AI personalisation.
- Core features (profile, plan, indoor model, impact calculations, ledger, alerts, `.ics`) function deterministically with every external API offline.

---

## 4. Domain engines (pure TypeScript in `server/src/core/`, injected clock, no I/O)

### 4.1 Air data providers (ports and adapters, with fallback chain)

`AirQualityProvider { getCurrent(loc), getForecast(loc, hours) }` with adapters: **`GoogleAirQualityProvider`** (Air Quality API: current conditions, hourly forecast, local AQI and health recommendations where available), **`OpenMeteoProvider`** (keyless; air-quality and weather endpoints), **`ScenarioProvider`** (deterministic synthetic curves for tests and the judge demo: _Clean_, _Moderate_, _Poor_, _Severe Delhi winter_, _Hazardous_). A `ProviderChain` tries adapters in `AQ_PROVIDER_ORDER` with timeouts, a circuit breaker and single-flight de-duplication, returns stale-but-flagged cache data before failing, and always reports provenance (`source`, `fetchedAt`, `isStale`). Verify endpoint and variable names against the providers' current documentation; do not rely on memory.

### 4.2 AQI engine (`aqi.ts`)

Compute **CPCB NAQI** sub-indices from pollutant concentrations using the official breakpoint tables (24 h averages from the trailing hourly series), category, dominant pollutant, and **WHO multiple** (`pm25_24h / 15 µg/m³`, 2021 guideline). For PM2.5 the CPCB bands are 0–30 Good, 31–60 Satisfactory, 61–90 Moderate, 91–120 Poor, 121–250 Very Poor, 250+ Severe; **verify every breakpoint against CPCB's published table and cite it in code comments**. Also map to US EPA AQI for non-Indian locations.

### 4.3 Smog drivers (`smogDrivers.ts`)

Rule-based classification from wind speed, humidity, temperature and, where the provider exposes it, mixing-layer height or an inversion proxy. Thresholds are named constants with a rationale comment. Output: ranked drivers with plain-language explanation ("Winds are very light, so pollutants are not dispersing").

### 4.4 Indoor model (`indoor.ts`)

Mass-balance per room, hourly:

```
dC/dt = P·a·C_out + S/V − (a + k + Q/V)·C
steady state: C_in = (P·a·C_out + S/V) / (a + k + Q/V)
P = penetration factor · a = air exchange rate (h⁻¹, depends on windows open/closed) · k = deposition rate (h⁻¹)
Q = purifier CADR (m³/h) · V = room volume (m³) · S = indoor source strength (µg/h: cooking, incense, mosquito coil)
```

Defaults for `P`, `a`, `k`, `S` come from cited literature in `data/indoor-defaults.json` with ranges. **Purifier right-sizing:** required CADR ≈ V × target ACH (4–5 for smoke/PM). Output indoor/outdoor ratio, hours above threshold, and the best hours to ventilate (lowest forecast outdoor PM2.5).

### 4.5 Exposure model (`exposure.ts`)

Daily inhaled dose = Σ concentration(t, microenvironment) × inhalation rate(activity, age group) × Δt, for microenvironments _indoor home / commute / outdoor / school-work_. Inhalation rates from a cited exposure-factors source. Mask effect uses a conservative **range** for a well-fitted N95/FFP2 (and states that cloth/surgical masks give limited protection against PM2.5). Output the **point estimate and range**, never false precision.

### 4.6 Emissions model (`emissions.ts`)

Avoided emissions = distance/usage × (baseline factor − alternative factor), for transport (petrol/diesel car, 2-wheeler, auto, bus, metro, cycle, walk, carpool, EV, WFH day), cooking (biomass, LPG, induction/electric, PNG), and waste burning avoided. Each factor in `data/emission-factors.json` has `value`, `unit`, `pollutant` (CO₂e, PM2.5, NOx), `source`, `year`, `uncertainty`. **Use only factors you can cite; mark uncertain ones `estimate` and show ranges.** Separate **exposure** (health, my family) from **emissions** (city) everywhere in UI and copy so users never confuse them.

### 4.7 Plan engine (`planEngine.ts`)

`buildPlan(ctx): ActionCard[]` — deterministic, ranked by (health benefit × feasibility ÷ effort), time-slotted by the forecast. Every card carries `ruleId`, `why`, `impact{health,city}`, `effort`, `costBand` (₹ / ₹₹ / ₹₹₹ / free), `evidence`, `knowledgeIds[]`.

| Rule | Behaviour                                                                                                                              |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------- |
| P1   | Sensitive group present and NAQI ≥ Poor → move exercise/play indoors or into the best window; shorten outdoor time                     |
| P2   | Ventilate only in the forecast lowest-PM2.5 window; keep windows closed when outdoor ≥ indoor                                          |
| P3   | Purifier: run when estimated indoor PM2.5 exceeds target; pre-run the bedroom before sleep; flag under-sized units                     |
| P4   | Mask guidance when unavoidable outdoor exposure is long and PM2.5 is high; fit caveat, especially for children                         |
| P5   | Commute: suggest metro/bus/carpool/WFH when feasible; **do not** push cycling or running in Very Poor/Severe air (higher inhaled dose) |
| P6   | Cooking: exhaust/chimney on; discourage biomass; suggest LPG/induction shift with cost note                                            |
| P7   | Cleaning: wet mop or HEPA vacuum rather than dry sweeping; avoid incense and coils at peak hours                                       |
| P8   | Community/civic: do not burn leaves or waste; cut engine idling at school gates                                                        |
| P9   | Older adults: shift walks away from early-morning/night peaks as shown by the forecast                                                 |
| P10  | Severe or worse: minimise trips, WFH if possible, school outdoor activity off, check local advisories                                  |

### 4.8 Knowledge base (`server/src/knowledge/*.json`)

At least **40 curated entries** (routines, indoor hacks, alternatives, myths) each with `id`, `category`, `title`, `appliesWhen`, `effort`, `costBand`, `evidence{level: strong|moderate|limited, sources[{title, organisation, year, url}]}`, `effectModel`. Use the browser to research and cite WHO, CPCB, US EPA, peer-reviewed or government sources. **Never invent a citation or number**; if you cannot verify, set `evidence.level = "limited"` and omit effect numbers. Include honest myth entries (e.g. houseplants do not materially clean room air; ozone generators and ionisers can add pollutants; cloth masks have limited filtration).

---

## 5. GenAI layer (Vertex AI, `@google/genai`)

**Pipeline for every AI feature:** `Safety interceptor → deterministic retrieval → computed facts payload → Gemini (JSON schema, low temperature) → validators → human-visible result → (optional) human-approved action`.

1. **Pre-model safety interceptor (`safety.ts`, deterministic):** detects emergency symptoms (severe breathlessness, chest pain, blue lips, child struggling to breathe, fainting), self-harm, out-of-scope topics, and prompt-injection patterns. Emergency → fixed guidance to seek immediate care (India: **112** national emergency number; make numbers a verified per-country config) and the model is **not called**. Out-of-scope → polite redirect. Injection → neutralised and logged.
2. **Retrieval:** rule- and tag-based selection from the knowledge base (no vector DB needed); only the selected entries and the computed facts go to the model.
3. **Facts payload:** AQI, forecast, drivers, indoor results, exposure and emissions numbers, and abstract household categories (e.g. `sensitiveGroups: ["child","respiratory"]`) — **no names, emails, addresses, exact coordinates**; coordinates coarsened to ~1 km. Only sent if `aiPersonalization` consent is true.
4. **Generation:** structured output `{ summary, actions[{ id, headline, because, impactStatement, citations[] }], caveats[] }` in the user's language; temperature ≤ 0.2; timeouts and jittered retries; per-user daily quota.
5. **Validators (`validators.ts`):** schema check (Zod); every citation id must exist in the knowledge base; **number-grounding check** — every number in the narrative must appear in the facts payload (± rounding) or be rejected; banned-claims lexicon (no cure/diagnosis/guarantee language); language check. Any failure → **deterministic template narrative** from the plan engine. The UI shows an "AI-written · numbers verified" badge only when validators passed, otherwise "Standard guidance".
6. **Ask Saans tools** (function calling, **read-only**): `getAirNow`, `getForecast`, `getPlan`, `calculateImpact`, `searchKnowledge`. Anything that changes state is returned as a **proposal card** the user must tap to apply.
7. **Myth Check:** claim → retrieval → verdict constrained to the four allowed values with citations; "no evidence found" is a valid, honest answer.
8. **Drafting tools** (advisories, civic complaints): produce drafts only; community advisories require explicit admin approval before the outbox accepts them.
9. **Evals:** `server/src/ai/evals/` holds ≥ 30 golden cases (emergency, injection, out-of-scope, Hindi, Marathi, myth, child, elder, missing data, provider outage) run with a mocked model in CI and optionally live via `npm run ai:eval`.
10. Optional (Plus): Gemini grounding with Google Search for local advisories, always displayed with source links and a "verify with official sources" line.

---

## 6. Experience and visual design (this is what judges see — make it exceptional)

**Direction:** _calm, trustworthy, atmospheric._ Think premium health-tech meets weather app: generous whitespace, large rounded cards, soft depth, one confident accent. Avoid default-Tailwind look and avoid alarmist red.

**Tokens (CSS variables, light / dark / high-contrast sets):** 4 px spacing scale; radii 12/20/28; soft layered shadows; type scale with fluid sizes; fonts _Plus Jakarta Sans_ (or Inter) with _Noto Sans Devanagari_ fallback and tabular numerals for data. AQI palette starting points (adjust until contrast tests pass): Good `#2E9E4F`, Satisfactory `#7BC043`, Moderate `#F2C230`, Poor `#F28C28`, Very Poor `#E0443E`, Severe `#8E1B3A`. Every category also has an **icon, label and pattern** — never colour alone. A `contrast.test.ts` verifies every foreground/background token pair (≥ 4.5:1, ≥ 7:1 in high-contrast).

**Navigation:** mobile bottom tab bar (**Today · Plan · Impact · Home Air · Community**) with a floating **Ask Saans** button; desktop left rail with a two-column dashboard. Persona-aware: Household views are streamlined; Community Admin views are data-dense (tables, filters, CSV export of aggregates).

**Signature screens and moments:**

1. **Air Now hero ("living sky").** A calm gradient sky that shifts with the AQI category, with two or three layers of slow haze (CSS only, GPU-friendly, paused under `prefers-reduced-motion`). Huge tabular AQI number with count-up, category chip (icon + text), PM2.5 value with "**×N WHO guideline**", a one-line human sentence ("Hazy and still — keep windows shut until about 1 pm"), smog-driver chips, and a provenance popover ("Google Air Quality API · updated 4 min ago").
2. **72-hour timeline.** Area chart banded by CPCB categories, "now" marker, shaded **best window**, keyboard-scrubbable with arrow keys, plus a data-table toggle for screen readers.
3. **Today's Plan.** Cards grouped Morning / Afternoon / Evening / Night. Each card: icon, headline, time chip, **Why** disclosure, impact badges (_Health: ~35% less inhaled PM2.5_ · _City: −1.2 kg CO₂e_), effort and cost chips, a satisfying Done micro-animation, "Add to calendar". A sticky "3 things that matter most today" strip.
4. **Impact Lab.** Segmented _My family / My city_ lens; toggles and sliders (commute mode, distance, mask, purifier, window schedule, cooking ventilation); animated before/after bars with count-up; **"How we calculated this"** sheet (formula, inputs, sources, range); "Add to my ledger".
5. **Home Air.** Room cards plus a **Room Simulator**: a canvas where particle density follows the modelled PM2.5 inside versus outside, with toggles (window, purifier, cooking) and a time scrubber; a static, labelled fallback under reduced motion; a purifier right-sizing calculator; a filterable hacks library ("Free", "Under ₹500", "5 minutes").
6. **Family.** Member chips, per-member guidance switcher, school-run and outdoor-activity advisor ("Outdoor PE today? Not recommended before 1 pm — here is why").
7. **Community.** Join code, collective impact ring and counters, pledges with progress, and an admin dashboard (adoption, aggregate impact, anonymised exposure bands, advisory composer with approval, civic-complaint drafter).
8. **Ask Saans.** Bottom sheet/side panel, suggested prompts, streaming-feel typing indicator, citation chips that open the source, a visible safety banner for emergency responses, language switch.
9. **Shareable card.** One tap renders "Today in my city" as an image (canvas → PNG with alt text) for WhatsApp sharing.
10. **Delight, within accessibility limits:** animated gauge, Breathe Score ring, skeleton loaders, optimistic updates, toasts, thoughtful empty states, error boundaries, offline banner, 404 page, motion ≤ 250 ms ease-out.

**Copy:** warm, plain, specific; ≤ 8th-grade reading level; every screen has one clear primary action; every number is explained within one tap.

**Design QA loop (mandatory):** after building each screen, open it in the browser at 320, 390, 768 and 1440 px in light, dark and high-contrast themes; fix alignment, spacing, truncation and contrast issues; capture screenshots into `docs/screenshots/`. Embed the best six in the README.

---

## 7. Code quality and architecture (Pillar 2 — primary gate)

**Stack (fixed unless an ADR changes it):** Node.js LTS · TypeScript `strict` · **Express** with domain sub-routers · Zod + `@asteasolutions/zod-to-openapi` · Pino · `compression` · Vitest · React + Vite + Tailwind + Radix UI + TanStack Query + i18next + Recharts + lucide-react · npm workspaces.

```
saans/
├─ server/
│  ├─ src/
│  │  ├─ core/          # PURE engines: aqi, smogDrivers, indoor, exposure, emissions, planEngine, safety, rbac, ics, kAnonymity, breatheScore
│  │  ├─ services/      # auth, household, invitation, plan, impact, community, alert, outbox, audit, demo  (business rules, no HTTP)
│  │  ├─ repositories/  # ports (interfaces) + memory/ + firestore/ adapters
│  │  ├─ adapters/      # air providers, gemini, email, tts, system clock
│  │  ├─ ai/            # prompts, schemas, validators, evals/
│  │  ├─ knowledge/  data/   # curated JSON with citations
│  │  ├─ routes/        # one file per domain (each < 250 lines) + index.ts
│  │  ├─ middleware/    # requestId, auth, requirePermission, rateLimit, securityHeaders, demoGuard, requireOidc, errorHandler
│  │  ├─ container.ts   # composition root (dependency injection)
│  │  ├─ config.ts      # Zod-validated env
│  │  └─ server.ts
│  └─ tests/            # unit/ integration/ security/ contract/
├─ web/                 # React app: routes/ features/ components/ design-system/ i18n/ a11y/
├─ shared/              # Zod schemas, DTO types, permission constants (single source of truth)
├─ docs/                # openapi.json ARCHITECTURE SECURITY ACCESSIBILITY TESTING METRICS DEMO PROMPT adr/ screenshots/
├─ infra/               # idempotent gcloud scripts, firestore.indexes.json, firestore.rules
├─ donotpush/           # GIT-IGNORED: scratch notes, rubric self-checks, eval scripts
├─ .eslintrc.json  .prettierrc  tsconfig.base.json  .gitignore  .editorconfig  Dockerfile  cloudbuild.yaml  AGENTS.md  README.md
```

**Sub-routers (`server/src/routes/`, each file < 250 lines, mounted by `index.ts` on `/api/v1`):**

| File                  | Responsibility                                                                                |
| --------------------- | --------------------------------------------------------------------------------------------- |
| `auth.routes.ts`      | Register, login, logout, session, password change                                             |
| `household.routes.ts` | Household profile and entities (members, rooms, devices), invitations, sharing scopes, revoke |
| `air.routes.ts`       | Air Now, forecast, smog drivers, best windows, location search                                |
| `plan.routes.ts`      | Daily plan, action logging, alternatives, `.ics` export                                       |
| `impact.routes.ts`    | What-if calculator, emission factors, indoor simulation, formula sheets                       |
| `community.routes.ts` | Communities, join codes, pledges, aggregates, advisories (draft/approve)                      |
| `alerts.routes.ts`    | Alert preferences, evaluation, acknowledgement and escalation, outbox listing                 |
| `analytics.routes.ts` | Ledger, Breathe Score, metrics, audit trail                                                   |
| `ai.routes.ts`        | Ask Saans, Myth Check, drafting tools                                                         |
| `demo.routes.ts`      | Judge demo controls (guarded by `DEMO_MODE`)                                                  |
| `internal.routes.ts`  | Scheduler endpoints, OIDC-verified                                                            |
| `health.routes.ts`    | `/health` (liveness) and `/ready`                                                             |
| `index.ts`            | Mounts everything                                                                             |

**SOLID, made visible (document in `docs/ARCHITECTURE.md` with file links):** _SRP_ — routes parse/validate/respond, services hold rules, repositories persist, engines compute. _OCP_ — new air providers or repositories plug in by implementing a port; no edits to callers. _LSP_ — one **contract test suite** runs against both the memory and Firestore repositories. _ISP_ — small ports (`Clock`, `AirQualityProvider`, `HouseholdRepository`, `AuditRepository` with append-only API, `OutboxRepository`, `EmailSender`, `AiClient`). _DIP_ — services depend on ports; `container.ts` is the only place that wires concrete adapters.

**Boolean quality checks (each must exist and be enforced in CI):**

- Root `.eslintrc.json` with `@typescript-eslint` parser; rules: `no-explicit-any: error`, `complexity ≤ 10`, `max-lines-per-function ≤ 50`, `max-lines ≤ 300` (≤ 250 for `routes/`), import-boundary rule (`core/` may not import from `adapters/`, `routes/` or SDKs).
- Root `.prettierrc`; `npm run format:check`.
- `"strict": true` in `tsconfig.base.json` plus `noUncheckedIndexedAccess`; **zero `any`, zero `@ts-ignore`**.
- `docs/openapi.json` (OpenAPI **3.0**) generated from the Zod contracts by `npm run openapi`: every endpoint, query param, request body, response code, and a `bearerAuth` scheme; served at `/api/docs`; `openapi.sync.test.ts` fails if any Express route is undocumented or any documented route is missing.
- `npm run check:size` fails the build when any router exceeds 250 lines.
- Errors: typed domain errors → RFC 7807 `application/problem+json` with `correlationId`; no stack traces to clients.
- Structured Pino logs with a redaction list; request IDs propagated to Cloud Trace.
- TSDoc on every exported function, port and engine; constants named in `core/constants.ts` (no magic numbers); formulas cite their source in comments.
- Husky pre-commit: lint-staged, type-check, `gitleaks`. ADRs: `0001-architecture`, `0002-gcp-services`, `0003-auth-and-sessions`, `0004-impact-models`, `0005-ai-guardrails`, `0006-database-ports`.

---

## 8. Security, privacy and access control (Pillar 3)

**RBAC with explicit scopes** — `READ, CREATE, UPDATE, DELETE, INVITE, REVOKE, AUDIT`, defined once in `shared/permissions.ts`:

| Tenant    | Role               | Scopes                                                                                                                                                       |
| --------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Household | `OWNER`            | all seven                                                                                                                                                    |
| Household | `MEMBER`           | derived from invitation scopes: `VIEW_PLAN` → `READ`; `LOG_ACTIONS` → `CREATE` on action logs; `EDIT_PROFILE` → `UPDATE`; never `DELETE/INVITE/REVOKE/AUDIT` |
| Community | `COMMUNITY_ADMIN`  | `READ` (aggregates only), `CREATE`, `UPDATE`, `INVITE`, `REVOKE`, `AUDIT` — **never** household-level data                                                   |
| Community | `COMMUNITY_MEMBER` | `READ` (aggregates), `CREATE` (own pledge participation)                                                                                                     |

- **`requirePermission(scope)` middleware on every protected endpoint**; never trust UI checks. Rejection branches, each tested: no/invalid bearer → 401; missing tenant param → 400; not a member of the tenant → 403; insufficient scope → 403; **corrupted stored permission JSON → deny and log** (fail closed).
- **Strict tenant isolation:** every repository query is parameterised by `tenantId`; User B can never read or mutate User A's household without a membership record. Test with an exhaustive cross-tenant matrix across all routers.
- **Authentication hardening:** password ≥ 8 characters plus a common-password denylist; Argon2id (or Node `scrypt` with documented parameters — record the choice in ADR 0003); **5 consecutive failures lock the account and the IP+account pair → HTTP 429 with `Retry-After`**; generic error messages; constant-time comparisons.
- **Sessions:** opaque 256-bit bearer tokens, stored only as SHA-256 hashes with expiry, revocable, invalidated on password change and on member revocation.
- **Invitations and one-time tokens:** cryptographically random, **stored as SHA-256 hashes**, with `expiresAt`, single-use flag, `revokedAt`, scope list and inviter; edge cases tested: invalid, expired, used, revoked, owner protection.
- **Rate limiting:** global per-IP limiter, stricter on `/auth/*`, per-user quota on `/ai/*`; counters in a store port (memory for tests, Firestore with TTL for production).
- **Hardened headers on every response** (`securityHeaders.ts`): `Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: blob:; connect-src 'self'; font-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Cross-Origin-Opener-Policy: same-origin`, `Cross-Origin-Resource-Policy: same-origin`, HSTS, and `Permissions-Policy` that allows `geolocation=(self)` (the app uses it) and denies camera, microphone and payment.
- **Immutable audit trail:** append-only `auditLog` with `actor_id, action, entity_type, entity_id, before_snapshot, after_snapshot, reason, correlation_id, at`; the `AuditRepository` interface exposes only `append` and `list` (compile-time guarantee); snapshots exclude secrets and sensitive flags; owner can view their household's trail (`AUDIT`).
- **Privacy by design:** location coarsened (~1 km) before storage and before any AI call; sensitive-group flags stored as minimal booleans (optionally KMS-envelope-encrypted); explicit consent toggles (`aiPersonalization`, `shareWithCommunity`); data export and delete (step-up password); TTL on sessions, attempts, outbox (30 days); k-anonymity for all community aggregates. State alignment _in spirit_ with consent, purpose-limitation and erasure principles (e.g. India's DPDP Act) without claiming legal compliance.
- **AI security:** pre-model interceptor, schema and number-grounding validators, read-only tools, drafts only, no PII in prompts, quotas, injection fixtures (`docs/SECURITY.md` includes the AI data-flow diagram).
- **Secrets and supply chain:** Secret Manager only; separate runtime service account with least privilege (Firestore user, Secret accessor, Vertex user, log writer); non-root distroless image; `npm audit` and `gitleaks` in CI; Artifact Analysis scanning on the image.
- `docs/SECURITY.md`: a STRIDE-style threat model table (threat → mitigation → test file) and a clear statement that Saans gives general guidance, not medical advice.

---

## 9. Efficiency and scalability (Pillar 4)

- **Compound indexes** (`infra/firestore.indexes.json`), every one justified by a query path: `memberships(userId, status)`, `actionLogs(householdId, date, memberId)`, `alerts(householdId, status, scheduledFor)`, `outbox(status, availableAt)`, `auditLog(tenantId, at desc)`, `pledges(communityId, status, createdAt)`, `ledger(householdId, weekStart)`. The in-memory adapter mirrors the same access patterns.
- **Compression:** `compression()` (gzip/Brotli) on API and static responses; pre-compressed Brotli assets at build; record measured size reduction (target > 70% on JSON/JS/CSS) in `docs/METRICS.md`.
- **Caching:** fingerprinted assets `Cache-Control: public, max-age=31536000, immutable`; `index.html` and service-worker `no-cache`; ETags on read endpoints; air-data cache keyed by 0.05° grid cell (TTL ≈ 30 min current, 3 h forecast) with **single-flight** request coalescing; Gemini narrative cache keyed by hash of (facts, profile-hash, language) for 1 h; knowledge base loaded once.
- **Transactional outbox:** state change and outbox record written atomically; idempotent delivery keys `${tenantId}_${entityId}_${eventType}_${timestamp}`; dispatcher reads due items in pages and writes status updates with **batched writes** (`WriteBatch`/`BulkWriter`, never sequential loops); exponential backoff, max attempts, dead-letter status.
- **Concurrency mutex:** `OutboxDispatcher` guards itself with an in-process `isDispatching` lock **and** a Firestore lease document so overlapping Scheduler invocations across instances cannot double-dispatch.
- **Front end:** route-level code splitting, initial JS ≤ 180 KB gzip, subsetted self-hosted fonts with `font-display: swap`, AVIF/WebP images, memoised charts, no layout shift; Lighthouse mobile performance ≥ 90.
- **Cloud Run:** CPU boost, concurrency 80, `max-instances 3`, scale to zero (min 1 only during the demo window, documented).
- Record real numbers in `docs/METRICS.md`: Firestore reads per request on hot paths, p95 latency, cache hit ratio, bundle sizes, compression ratio, Lighthouse scores.

---

## 10. Accessibility and inclusive UX (Pillar 5)

Target **WCAG 2.2 AA** everywhere. Theme system via CSS variables (primary), **plus** the explicit utility-class safety net below so no dark text can ever land on a dark surface.

- **Bulletproof high-contrast mode** (`<html data-contrast="high">`, persisted in `localStorage` key `saans.contrast`): page background `#000000`, surfaces `#0b0f17`. Universal text inversion in `web/src/a11y/high-contrast.css`:

```css
html[data-contrast="high"] body {
  background: #000000;
  color: #ffffff;
}
html[data-contrast="high"] [class*="bg-slate-9"],
html[data-contrast="high"] [class*="bg-gray-9"] {
  background-color: #0b0f17 !important;
}
html[data-contrast="high"] [class*="text-slate-9"],
html[data-contrast="high"] [class*="text-gray-9"],
html[data-contrast="high"] [class*="text-slate-8"],
html[data-contrast="high"] [class*="text-gray-8"],
html[data-contrast="high"] h1,
html[data-contrast="high"] h2,
html[data-contrast="high"] h3 {
  color: #ffffff !important;
}
html[data-contrast="high"] [class*="text-slate-5"],
html[data-contrast="high"] [class*="text-slate-6"],
html[data-contrast="high"] [class*="text-gray-5"],
html[data-contrast="high"] [class*="text-gray-6"] {
  color: #fef08a !important;
}
html[data-contrast="high"] input,
html[data-contrast="high"] select,
html[data-contrast="high"] textarea {
  background-color: #000000 !important;
  color: #ffffff !important;
  border: 2px solid #facc15 !important;
}
```

- **Root rem scaler** (100% / 120% / 140%): sets `document.documentElement.style.fontSize`, persisted in `localStorage` key `saans.fontScale`, applied before first paint to avoid flash.
- **No text overlap:** never place absolutely-positioned corner badges over titles; use `flex flex-wrap items-center justify-between` flows; global `line-height: 1.5 !important; overflow-wrap: break-word;` for body text; layouts verified at 320 px and 140% scale.
- **Forms:** every `<input>`, `<textarea>`, `<select>` has an explicit `id` matching its `<label htmlFor>`; inline, specific error messages in `aria-live` regions; correct `autocomplete`; no placeholder-only labels.
- **Dialogs:** `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, **focus trap**, close on **Escape**, focus returns to the trigger.
- **Landmarks:** a **single global skip link** `<a href="#main-content">Skip to main content</a>` targeting `<main id="main-content">`; no duplicate IDs anywhere (`duplicate-ids.test` scans rendered routes).
- **Charts and visuals:** every chart has a text summary and a data-table toggle; categories use icon + label + pattern; the Room Simulator has a static, described fallback; animations respect `prefers-reduced-motion`.
- **Targets and input:** touch targets ≥ 44 px (≥ 56 px for primary actions in the Dadaji view), full keyboard operation, visible focus ring, no keyboard traps, 200% zoom without loss.
- **Language:** `lang` attribute follows locale; en/hi/mr i18n with Devanagari-safe fonts; read-aloud button on Today and Plan.
- **Automated gates:** `@axe-core/playwright` on every route in light, dark and high-contrast themes at 140% scale — zero serious/critical violations; Lighthouse accessibility ≥ 95; manual checklist (screen reader, keyboard-only, zoom, reduced motion) recorded in `docs/ACCESSIBILITY.md`.

---

## 11. Testing and coverage (Pillar 6)

- **Runner:** Vitest. `npm test` = fast suite (server unit + integration + security, in-memory fixtures, `FakeClock`, `ScenarioProvider`, `FakeAi`) with **60+ tests, 0 failures, 0 skipped, completing in < 5 s**. `npm run test:web` (component tests), `npm run test:integration` (Firestore emulator, repository contract suite) and `npm run test:e2e` (Playwright + axe) run in `npm run verify`.
- **Coverage:** `vitest.config.ts` enforces **100% line coverage** (thresholds, build fails below) on `server/src/core/**` and `server/src/services/**`; middleware ≥ 95%. Cover every happy path, failure path, guard clause and boundary: threshold cut-offs, expiry timestamps, schedule filters, DST-free local-time maths, leap/edge dates.
- **Must-have failure-path tests:** auth — missing bearer header, malformed token, non-existent user, expired session, lockout after 5 failures (429); invitations — invalid, expired, used, revoked, owner protection; RBAC — unauthenticated, missing tenant param, non-member, insufficient scope, corrupted stored JSON fallback.
- **Tests that must exist by name:**
  `aqi.cpcb.test` · `aqi.who.test` · `smogDrivers.test` · `indoor.massBalance.test` · `indoor.purifierSizing.test` · `exposure.test` · `emissions.test` · `planEngine.rules.test` (P1–P10) · `safety.interceptor.test` · `breatheScore.test` · `kAnonymity.test` · `ics.rfc5545.test` · `providerChain.fallback.test` · `auth.service.test` · `invitation.service.test` · `household.service.test` · `community.service.test` · `alert.service.test` (thresholds, ack, grace-period escalation) · `outbox.service.test` (idempotency, batching, `isDispatching` mutex) · `audit.append-only.test` · `requirePermission.test` · `securityHeaders.test` · `rateLimit.test` · `errorHandler.test` · `crossTenant.isolation.test` · `revoke.immediate.test` · `community.no-household-leak.test` · `ai.injection.test` · `ai.number-grounding.test` · `ai.fallback.test` · `openapi.sync.test` · `health.ready.test` · `contrast.test` · `highContrast.test` · `fontScaler.test` · `skipLink.test` · `modal.a11y.test` · `duplicate-ids.test` · `a11y.routes.spec` · `e2e.happy-path.spec`.
- **Property tests (fast-check):** AQI monotonicity, indoor model never negative and bounded by outdoor with no indoor sources, `.ics` always valid (CRLF, 75-octet folding, escaped text, unique UID), k-anonymity never releases n < K.
- `npm run verify` = format check → lint → typecheck → size/boundary checks → openapi sync → tests → build → coverage gate. CI (`cloudbuild.yaml`) runs the same command before deploy. Commit the latest numbers to `docs/TESTING.md` and `docs/METRICS.md`.

---

## 12. Interactive Judge Demo Bar (FR-20)

Judges must see complex lifecycles in under 3 minutes. When `DEMO_MODE=true`, show a collapsible **Judge Demo Bar** (keyboard-accessible, labelled, dismissible). Every demo action is scoped to the caller's own demo session and household (no cross-tenant effect) and is audited.

- **Time travel:** `+15m`, `+30m`, `+1h`, `+6h`, `↺ Reset Clock`. The simulated clock is stored per demo session and injected through the `Clock` port everywhere.
- **⚡ Fast-forward to next event:** jumps to the next scheduled domain event — next forecast category change, next plan-slot start, or next alert due.
- **🌫️ Scenario switcher:** _Clean · Moderate · Poor · Severe (Delhi winter) · Hazardous_ via `ScenarioProvider`, so the whole app (hero sky, plan, indoor model, impact) visibly reacts.
- **⚠️ Trigger severe-smog event:** switches to Severe and advances to the peak; alert rules fire and land in the outbox.
- **⏱️ Trigger grace timeout:** advances past the 30-minute acknowledgement window so the **escalation** to the consenting co-guardian dispatches.
- **Toast feedback on every action:** a banner states exactly what was evaluated, transitioned or dispatched (e.g. "Evaluated 72 forecast hours · AQI crosses Severe at 06:00 · 2 alerts queued").
- **Event/Delivery Inspector:** full-screen drawer or modal showing real transactional-outbox records — subject, body, recipient, language, timestamp, status, attempts, idempotency key — with filters.
- **Instant persona switcher:** one-click login as **Riya (Household Owner)**, **Dadaji (scoped member)**, **Mr. Kulkarni (Community Admin)**, each landing on its tailored view.
- **Seed:** `npm run seed` creates synthetic personas, a household, a community with ≥ 6 households (so aggregates exceed k-anonymity), and ledger history. No real personal data anywhere. A Scheduler job resets the demo data nightly.

---

## 13. Build plan with gates (do not start a phase until the previous gate passes)

| Phase                             | Work                                                                                                                                                                                                         | Gate (show real output)                                                                                             |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| **0 Pre-flight**                  | gcloud checks, enable APIs, service accounts, Firestore DB `saans`, secrets, model discovery, ADRs 1–2, repo scaffold with lint/format/strict TS/CI skeleton                                                 | gcloud listings; `npm run verify` green on the scaffold                                                             |
| **1 Walking skeleton (deployed)** | Shared Zod contracts, auth + household minimum, `ProviderChain` with Scenario + Open-Meteo, Air Now endpoint and the living-sky hero, `/health` + `/ready`, Dockerfile, Cloud Build, **deploy to Cloud Run** | Live URL shows Air Now; `/health` and `/ready` return 200 `CONNECTED`; CI green                                     |
| **2 Domain engines**              | `aqi`, `smogDrivers`, `indoor`, `exposure`, `emissions`, `planEngine`, `safety`, `ics`, `breatheScore`, `kAnonymity`, knowledge base and data files with citations                                           | 100% line coverage on `core/`; all named unit and property tests pass                                               |
| **3 Services, security, API**     | RBAC, sessions, lockout, invitations, audit, outbox, repositories (memory + Firestore), all sub-routers, OpenAPI generation                                                                                  | Security and cross-tenant tests pass; `openapi.sync.test` green; services at 100%                                   |
| **4 Web experience**              | Design system, all screens in §6, i18n, PWA, themes, high-contrast, scaler, charts, Room Simulator, share card                                                                                               | axe zero serious violations in 3 themes; Lighthouse a11y ≥ 95, perf ≥ 90; screenshots captured                      |
| **5 GenAI**                       | Interceptor, retrieval, Gemini integration, validators, Ask Saans, Myth Check, drafting tools, evals                                                                                                         | AI tests green; forced model outage shows deterministic fallback; injection fixtures pass                           |
| **6 Alerts, demo, hardening**     | Scheduler jobs with OIDC, alert evaluation, outbox dispatcher, Judge Demo Bar and Inspector, monitoring and alert policy, **ask me for SMTP credentials**                                                    | Demo walk-through works on the live URL; unauthenticated `/internal/*` returns 401/403; an email arrives end to end |
| **7 Evidence and polish**         | `docs/METRICS.md`, README, all docs, screenshots, §16 checklist, single clean root commit                                                                                                                    | Every §16 box ticked with evidence                                                                                  |

**If time runs short, cut in this order:** KMS, Pub/Sub→BigQuery, Search grounding, Cloud Tasks, Cloud TTS (keep Web Speech), shareable card, Room Simulator particles (keep static visual). **Never cut:** the six pillars' boolean checks, the walking skeleton, the deterministic fallbacks, the Judge Demo Bar, README and docs.

---

## 14. Standing rules for the agent (write to `AGENTS.md`; mirror into workspace rules if supported)

1. Follow §13 order; report gate output verbatim; never claim something works without running it.
2. Quality, security, testing, efficiency and accessibility checks are built **with** each feature, never deferred.
3. Touch only `saans-*` resources; never delete or alter anything else; ask before destructive or IAM-expanding actions.
4. No secrets, keys, real personal or health data in code, logs, fixtures or screenshots; all demo data is synthetic.
5. Engines in `core/` stay pure; time comes from the injected `Clock`; no `Date.now()` in `core/` or `services/`.
6. Validate every input and output with Zod; deny by default in authorization; fail closed.
7. AI output is untrusted: constrain, validate, ground numbers, label, require human confirmation for anything that changes state.
8. Never present an uncited number as fact; show ranges; separate exposure from emissions.
9. Keep dependencies few and justified; run `npm audit` and `gitleaks` at the end of each phase.
10. Use the browser to verify every screen (320 / 390 / 768 / 1440 px; light, dark, high-contrast; 140% scale; keyboard only).
11. Keep docs in sync with code in the same change; scratch notes and rubric self-checks go only in `donotpush/` (git-ignored).
12. When a requirement is ambiguous, choose the option that protects household privacy and keeps humans in control, record it as an assumption in the README, and continue.

---

## 15. Documentation (the README is read first)

`README.md`, in this order: **(1)** title, one-line pitch, live URL, demo persona credentials (synthetic); **(2)** the problem and how every clause is solved (the §1 table); **(3)** approach and logic — design principles, "code decides, AI explains", engine formulas, plan rules table; **(4)** how it works — architecture diagram, data flow, AI pipeline with validators, privacy model; **(5)** requirement traceability — FR-1…FR-20 → implementation file → test file; **(6)** how this submission maps to the six grading categories with links (the §0 table filled with evidence); **(7)** Google Cloud services used and why; **(8)** run locally, test, deploy (exact commands); **(9)** assumptions and limitations (general guidance not medical advice; estimates have ranges; emission factors and exposure defaults are cited approximations; air data availability varies by city; email is the alert channel; demo data is synthetic); **(10)** security, accessibility and testing summaries with links; **(11)** six screenshots; **(12)** roadmap (SMS/WhatsApp alerts, sensor integration, school and municipal dashboards, more languages).

`docs/DEMO.md`: a 3-minute judge script — switch scenario to Severe, watch the sky and plan change; open Impact Lab and show a formula sheet; trigger alert → inspector → grace timeout → escalation; ask Saans in Hindi and see cited, number-verified answers; paste a myth; log in as Mr. Kulkarni and show aggregates-only; show the CI result, coverage and axe report.

---

## 16. Pre-submission zero-defect checklist (tick each with evidence)

- [ ] `npm test` passes: 60+ tests, 0 failures, 0 skipped, < 5 s
- [ ] `server/src/core/**` and `server/src/services/**` report 100% line coverage (≥ 99.3% accepted only for file-header artefacts)
- [ ] `npm run verify` and `npm run build` pass with 0 TypeScript errors and 0 bundler errors
- [ ] `.eslintrc.json`, `.prettierrc`, strict `tsconfig`, zero `any`; every router < 250 lines; `docs/openapi.json` complete and in sync
- [ ] Every protected endpoint uses `requirePermission(scope)`; cross-tenant isolation, instant revoke and community no-household-leak tests pass
- [ ] Lockout returns 429 after 5 failures; invitation and session tokens stored as SHA-256 hashes; all required security headers present
- [ ] Compression, cache headers, compound indexes, batched outbox writes and the `isDispatching` mutex implemented and measured in `docs/METRICS.md`
- [ ] High-contrast mode, rem scaler, skip link, labelled form controls, accessible dialogs; axe zero serious violations; Lighthouse accessibility ≥ 95
- [ ] AI fallback verified by forcing a model outage; number-grounding and injection tests pass; emergency inputs never reach the model
- [ ] Deployed Cloud Run URL works; `/health` and `/ready` return HTTP 200 with `CONNECTED`; Judge Demo Bar, persona switcher and Event Inspector work live
- [ ] README follows §15; all `docs/` files and six screenshots present
- [ ] No secrets in the repo (gitleaks clean); `donotpush/` is git-ignored and uncommitted
- [ ] **After I confirm:** the repository has exactly **one clean root commit** on `main` (`git checkout --orphan`, commit, replace `main`; never force-push to a remote without asking me)
- [ ] Final message to me: what was built, live URL, how to run the demo, known limitations, and anything I must do manually (e.g. SMTP credentials)

===== END PROMPT =====
