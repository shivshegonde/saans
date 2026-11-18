# Saans Security Architecture & Threat Model

## 1. Threat Model & Invariants

| Threat / Risk                                   | Countermeasure & Implementation                                                                                                                                              | Verification Test                           |
| :---------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------ |
| **Cross-Tenant Data Leakage**                   | Household IDs are strictly verified against authenticated session context in repository queries. Users cannot query or mutate records outside their tenant.                  | `tests/crossTenant.isolation.test.ts`       |
| **Community Surveillance / De-anonymization**   | Strict $k \ge 5$ threshold enforced in `core/kAnonymity.ts`. Sub-threshold counts return empty aggregates with a privacy notice. Zero household identifiers exposed.         | `tests/community.no-household-leak.test.ts` |
| **Credential Brute-Forcing**                    | Account lockout triggered after 5 consecutive failed attempts, returning HTTP 429 with exponential cooldown.                                                                 | `tests/auth.service.test.ts`                |
| **Session Hijacking & Token Storage Theft**     | Session tokens and invitation codes are never stored in plaintext; stored strictly as SHA-256 hex hashes.                                                                    | `tests/auth.service.test.ts`                |
| **Delayed Member Revocation**                   | Tokens are checked against live membership records on every request. Revoking a member invalidates access immediately with zero grace delay.                                 | `tests/revoke.immediate.test.ts`            |
| **Adversarial Prompt Injection / Jailbreaking** | Deterministic pre-model regex interceptor neutralizes jailbreak patterns (DAN, system prompt leak, SQL injection, script tags) before model execution.                       | `tests/ai.injection.test.ts`                |
| **Hallucinated Medical or Health Advice**       | Post-model validators check numbers against input facts and verify citation IDs against the curated knowledge base. Banned medical claims ("cure", "100% safe") fail closed. | `tests/ai.number-grounding.test.ts`         |
| **Scheduler Endpoint Tampering**                | All `/internal/*` routes require Google Cloud OIDC authentication. Direct unauthenticated calls return HTTP 401.                                                             | `tests/internal.oidc.test.ts`               |

---

## 2. RBAC Scope & Permissions Matrix

Saans defines 7 fine-grained permission scopes:

| Scope             | Description                                                     | Assigned to OWNER | Assigned to MEMBER |
| :---------------- | :-------------------------------------------------------------- | :---------------: | :----------------: |
| `READ`            | View live air quality, plans, and household profiles            |        Yes        |        Yes         |
| `CREATE`          | Toggle action cards, submit community pledges, calculate impact |        Yes        |        Yes         |
| `UPDATE`          | Edit household rooms, purifier details, and routine preferences |        Yes        |         No         |
| `DELETE`          | Delete household records or clear historical audit logs         |        Yes        |         No         |
| `MANAGE_MEMBERS`  | Create invitations and revoke household members                 |        Yes        |         No         |
| `MANAGE_ALERTS`   | Configure smog alert thresholds and co-guardian consents        |        Yes        |         No         |
| `COMMUNITY_ADMIN` | Draft society advisories and civic complaints (RWA Admin)       |  Yes (if Admin)   |         No         |

---

## 3. Security Headers Specification

Every HTTP response emitted by the Saans API gateway includes hardened security headers configured via `server/src/middleware/securityHeaders.ts`:

- **Content-Security-Policy (CSP)**: `default-src 'self'; img-src 'self' data: https:; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; frame-ancestors 'none';`
- **Strict-Transport-Security (HSTS)**: `max-age=31536000; includeSubDomains; preload`
- **X-Frame-Options**: `DENY` (prevents clickjacking)
- **X-Content-Type-Options**: `nosniff` (prevents MIME sniffing)
- **Referrer-Policy**: `strict-origin-when-cross-origin`
- **Permissions-Policy**: `camera=(), microphone=(), geolocation=()`
