# ADR 0002: Google Cloud Platform Managed Services Selection

## Status

Accepted

## Context

Saans is designed to deploy on Google Cloud Platform under project `ai-builder-sql-copilot` in region `asia-south1`. We need managed, scalable, and secure cloud services that integrate with zero long-lived credentials (using ADC and IAM service accounts).

## Decisions & Service Rationale

- **Cloud Run**: Serves the unified Node.js API and optimized static SPA with automatic scaling to zero and CPU boost for predictable latency.
- **Cloud Firestore (named database `saans`)**: Provides scalable, multi-tenant document storage with compound indexes, strong consistency, and sub-10ms query latencies for user profiles and outbox records.
- **Vertex AI Gemini (`@google/genai`)**: Supplies state-of-the-art multilingual understanding and grounded contextual synthesis for conversational advice while maintaining low temperature and deterministic verification.
- **Google Maps Platform Air Quality API**: Delivers real-time, hyperlocal air pollutant measurements and hourly forecasts specifically calibrated for urban centers.
- **Secret Manager**: Securely stores application secrets (session pepper, API keys, email credentials) with automatic versioning and IAM-bound access.
- **Cloud Scheduler**: Dispatches automated cron events (every 15 min alert evaluation, 1 min outbox dispatch, nightly demo resets) over authenticated OIDC tokens.
- **Artifact Registry**: Houses hardened, scanned container images with immutable digest tags.
- **Cloud Build**: Executes reproducible multi-stage container builds and pre-deployment verification tests (`npm run verify`).
- **Cloud Logging & Error Reporting**: Aggregates structured JSON logs correlated with trace IDs for audit compliance and immediate anomaly detection.
- **Cloud Trace**: Tracks request latencies end-to-end across Express middleware, database queries, and external APIs.
- **Cloud Monitoring**: Tracks operational SLOs, uptime checks, and outbox delivery latency alerts.
- **Cloud Text-to-Speech**: Synthesizes natural spoken Hindi, Marathi, and English audio for Daily Plan read-aloud features.

## Consequences

- Every resource is strictly namespaced under `saans-` or the `saans` named database, preventing conflict with other workloads in the same GCP project.
- No static service account keys are stored in source code or repositories; authentication relies strictly on Workload Identity and Application Default Credentials (ADC).
