# ADR 0003: Authentication, Session Management, and Credential Protection

## Status

Accepted

## Context

Saans manages household environmental health data, sensitive demographic attributes (e.g. respiratory vulnerability, infant/elderly presence), and community roles. The platform requires high-assurance authentication and authorization mechanisms that protect against credential stuffing, session hijacking, replay attacks, and unauthorized privilege escalation.

## Decisions

1. **Password Hashing (scrypt):**
   - User passwords are hashed using Node.js native `crypto.scrypt` with a minimum CPU/memory cost parameter ($N=16384$, $r=8$, $p=1$, 64-byte key length).
   - Each hash incorporates a cryptographically secure 16-byte random salt and an application-level server pepper retrieved strictly from environment/Secret Manager (`AUTH_PEPPER`).
   - Timing-safe equality (`crypto.timingSafeEqual`) is used for all password comparisons to eliminate timing side-channel attacks.

2. **Session Token Design (Opaque SHA-256 Tokens):**
   - Rather than relying on self-signed client-side JWTs that cannot be immediately invalidated without complex revocation lists, Saans uses opaque 32-byte cryptographically random session tokens (`crypto.randomBytes(32).toString('hex')`).
   - The server stores the SHA-256 hash of the token (`tokenHash`) in the session store alongside `userId`, `householdId`, `role`, and `expiresAt`.
   - The raw token is returned to the client and transmitted either via `Authorization: Bearer <token>` or in a secure, `HttpOnly`, `SameSite=Strict`, `Secure` cookie.
   - If a database breach occurs, leaked session token hashes cannot be used to forge live sessions.

3. **Account Lockout & Brute-Force Defense:**
   - Failed login attempts increment an in-memory/repository counter per email.
   - Upon 5 consecutive failed attempts, the account is locked for 15 minutes (`lockoutUntil`), returning HTTP 429 / 401 with an explicit retry-after window.
   - Successful logins reset the failed attempt counter.

4. **Immediate Revocation & Session Lifecycle:**
   - Logouts (`POST /api/v1/auth/logout`) immediately delete the session record from the session store.
   - Password changes or security resets invalidate all active sessions for that `userId`.

5. **Fine-Grained Role-Based Access Control (RBAC):**
   - Roles (`resident`, `co_guardian`, `rwa_admin`, `auditor`, `system`) map strictly to granular permissions defined in `shared/src/permissions.ts` (e.g., `household:read`, `household:write`, `community:admin`).
   - Sub-routers enforce permissions declaratively via `requirePermission(Permission)` middleware before any service logic executes.

6. **Sensitive Operation Step-Up Protection:**
   - Destructive operations (such as `DELETE /api/v1/household/profile`) require re-authentication (`stepUpPassword`) and an explicit confirmation header (`x-confirm-action: true`) to prevent accidental or CSRF-driven data loss.

## Consequences

- Sessions can be invalidated instantaneously across all devices.
- No client-side secret keys or private signing keys need to be distributed or managed.
- Rate-limiting and lockouts protect resident credentials against dictionary attacks.
- High security without introducing third-party SaaS identity lock-in during core evaluation.
