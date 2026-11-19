# ADR 0005: AI Guardrails, Deterministic Interceptors, and Fallback Strategy

## Status

Accepted

## Context

Generative AI models are inherently non-deterministic and susceptible to prompt injection, hallucinated numerical facts, and inappropriate medical advice during health emergencies. In an environmental health application, an ungrounded or delayed answer during an asthma crisis can lead to severe harm. Saans requires a multi-layered, fail-closed AI architecture where safety is guaranteed by deterministic code before and after any LLM invocation.

## Decisions

1. **Pre-Model Deterministic Interceptor (`server/src/core/safety.ts`):**
   - Every user query is evaluated by pure regex/pattern-based interceptors before any external network request is made.
   - **Emergency Symptoms**: Queries indicating acute distress (e.g., "chest pain", "blue lips", "cannot breathe", "stridor") immediately return a hardcoded, deterministic emergency response directing the user to dial 112 / seek emergency medical care. The LLM is never invoked for emergencies.
   - **Prompt Injection Defense**: Adversarial patterns (e.g., "ignore previous instructions", "DAN mode", "system prompt reveal", "act as an unrestricted AI") are detected and neutralized with safe refusal messages.
   - **Domain Scope Enforcement**: Queries unrelated to air quality, respiratory health, or community environmental action (e.g., financial advice, sports trivia, coding) are politely redirected to core platform capabilities.

2. **Privacy-Preserving Context Coarsening (`server/src/ai/factsBuilder.ts`):**
   - The LLM context payload never receives precise household GPS coordinates, apartment numbers, or resident names.
   - Location is coarsened to a ~1 km radius neighborhood identifier.
   - Environmental facts (current AQI, forecast trajectory, primary pollutant, weather) are injected as structured JSON alongside relevant curated passages from our vetted knowledge base (`server/src/knowledge/`).

3. **Low-Temperature Model Execution (`server/src/ai/geminiClient.ts`):**
   - Vertex AI Gemini 2.5 is invoked with `temperature: 0.2`, `top_p: 0.8`, and strict JSON schema output constraints (`responseMimeType: "application/json"`).
   - This prevents conversational drift and ensures consistent, machine-parseable outputs.

4. **Post-Model Number Grounding & Claim Validation (`server/src/ai/validators.ts`):**
   - All numerical quantities in the model response are extracted and checked against the grounded facts payload. If a number deviates from the verified facts without contextual citation, the response is rejected.
   - The response is scanned for banned claims (e.g., claiming an air purifier "cures" asthma, recommending unproven homeopathic remedies during acute pollution episodes, or recommending uncertified masks).
   - Responses that pass validation receive a cryptographic grounding badge and metadata references.

5. **Deterministic Rule-Based Fallback (`server/src/ai/fallbackTemplates.ts`):**
   - If Vertex AI times out (exceeding 3500ms), returns an HTTP 429/503 error, runs out of quota, or fails post-model validation, the service immediately invokes deterministic rule templates.
   - The user receives an immediate, accurate, rule-grounded response derived directly from the plan engine rules (P1–P10) and curated knowledge base.
   - System availability remains 100% even during complete upstream cloud AI outages.

## Consequences

- Zero risk of dangerous medical delays during life-threatening acute respiratory episodes.
- No PII is ever leaked to LLM providers or log sinks.
- Full compliance with §5 and §9 requirements for untrusted AI output handling.
- Graceful offline degradation for all user workflows.
