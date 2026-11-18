# Standing Rules for Agents Working on Saans

1. **Follow §13 phase order strictly:** Report gate output verbatim; never claim something works without running it.
2. **Built-in quality:** Quality, security, testing, efficiency, and accessibility checks are built _with_ each feature, never deferred.
3. **Resource hygiene:** Touch only `saans-*` resources; never delete or alter anything else in the GCP project; ask before destructive or IAM-expanding actions.
4. **Data privacy & safety:** No secrets, keys, real personal or health data in code, logs, fixtures or screenshots; all demo data is synthetic.
5. **Pure domain engines:** Engines in `server/src/core/` stay pure without I/O; time comes strictly from the injected `Clock` port; no direct `Date.now()` or `new Date()` in `core/` or `services/`.
6. **Zod validation & fail closed:** Validate every input and output with Zod; deny by default in authorization; fail closed on corrupted state.
7. **Untrusted AI output:** Constrain, validate, ground numbers, label with badges, require explicit human confirmation for state mutations.
8. **Cited data & honest uncertainty:** Never present an uncited number as fact; show uncertainty ranges; strictly separate exposure (health) from emissions (city).
9. **Minimal dependencies & supply chain audit:** Keep dependencies few and justified; verify `npm audit` and security scanning.
10. **Browser verification:** Use browser checks at 320, 390, 768, and 1440 px across light, dark, and high-contrast modes with 140% scale and keyboard navigation.
11. **Documentation in lockstep:** Keep documentation and OpenAPI specs in sync with code in the same change; scratch notes and rubric self-checks go strictly in `donotpush/` (git-ignored).
12. **Privacy default:** When a requirement is ambiguous, choose the option that protects household privacy and keeps humans in control, record it as an assumption in the README, and continue.
