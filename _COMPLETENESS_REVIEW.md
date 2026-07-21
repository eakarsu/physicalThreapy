# Completeness Review: physicalThreapy

**Review date:** 2026-07-18

## Assessment basis

Static inspection of project-owned source and configuration only; no dependency installation, build, database migration, external-service call, or runtime launch was performed. The scan considered 78 project files (60 source files), 1 manifest(s), 0 test-like file(s), and 0 CI workflow(s), excluding dependency/generated directories.

## Classification

**Functional but incomplete**

This is a substantive but unfinished healthcare/care operations application, not just an empty scaffold. Inspection found 60 source files across `app/`, `components/`, `lib/`, `prisma/` using Next.js, React, Prisma; however, the checked-in workflow and delivery controls do not yet demonstrate a complete, production-operable product.

## Why it is not complete

- Mock, demo, sample, fixture, or placeholder behavior remains in executable/product paths.
- No recognizable project-owned automated tests were found for the main workflow.
- No checked-in CI workflow proves builds, tests, migrations, and security checks on every change.

## Needed features

1. Integrate standards-based clinical/care data (for example FHIR where applicable) with identity matching and consent.
2. Add clinician/caseworker review boundaries, provenance, contraindication/safety checks, and escalation for uncertain output.
3. Implement field-level access control, audit history, retention, encryption, and regulated-data incident procedures.
4. Validate the intended workflow with representative users and test high-risk, missing-data, and handoff scenarios.
5. Add risk-based unit, integration, and end-to-end tests in CI, including migration and failure-path coverage.

## Risks or launch blockers

- Credential/configuration exposure: environment files are present in the repository tree and must be checked against Git history and rotated if real.
- Weak/fallback secret patterns can permit forged sessions or accidental insecure deployments.
- Automation contains destructive process, filesystem, or database operations; do not run it on a shared machine without review.
- Startup appears coupled to seed/migration behavior, risking data mutation or non-repeatable launches.

## Evidence inspected

- `docs/README.md`
- `docs/README.md:109`
- `start.sh:133`
- `app/layout.tsx`
- `package.json`
- `start.sh`

## Recommended next action

Choose one real healthcare/care operations journey, define acceptance criteria and external contracts, then close its persistence, permission, integration, failure, and test gaps before expanding features.

## Implementation progress (2026-07-20)

The project remains **Functional but incomplete** and is not approved for real PHI, clinical decision-making, or production deployment. This pass preserved the earlier safe startup/authentication work and implemented one bounded, API-first journey: trusted FHIR intake → identity review → care-team/consent gate → encrypted clinical draft → deterministic safety escalation → independent therapist review → projected read/audit/retention.

### Numbered needed-feature disposition

1. **FHIR, identity, and consent implemented:** `/api/clinical/fhir/import` accepts only FHIR R4 Patient/Consent resources from an exact allowlist, bounds bundles, requires two identifiers from distinct systems, HMACs identifier values, encrypts demographics, records source hashes/version, refuses ambiguous matches, and quarantines new identities for explicit reasoned verification. Drafts require verified, effective consent covering both treatment and data use. Actual EHR trading-partner profile validation and jurisdiction-specific consent approval remain external onboarding gates.
2. **Clinical boundary implemented:** only assigned therapists can create drafts; provenance, source resources, indications, contraindications, author attestation, and confidence are captured. Deterministic cardiopulmonary, neurologic, cauda-equina, post-operative infection, and trauma checks force escalation. Missing data or confidence below 0.8 also escalates. Outputs are non-authoritative until a different assigned therapist attests and approves; self-review and approval of unresolved escalation are rejected. All legacy AI egress is disabled.
3. **Data controls implemented for the bounded path:** practice membership, role, care-team, portal-patient, and explicit field projections limit access. AES-256-GCM uses record/tenant-bound additional authenticated data; identifiers use a separate keyed hash. Reads and changes append a per-practice hash chain; database triggers prohibit audit/review update/delete and reject cross-practice clinical references. Approved retention policy, dry-run-first purge, encrypted tombstones, legal holds, incident intake/state evidence, and an incident runbook are present. Managed KMS/HSM rotation, SSO/MFA, centralized audit export/monitoring, backup/restore, disaster recovery, vendor agreements, penetration testing, and named accountable owners remain external deployment gates.
4. **Scenario validation harness implemented; human execution remains blocked externally:** automated tests cover high-risk language, missing data, low confidence, cross-practice denial, consent, immutable evidence, and independent-review handoff. `docs/WORKFLOW_VALIDATION.md` defines ten representative clinician/caseworker/admin/patient scenarios and evidence/sign-off requirements. No representative users participated in this code pass, so production human-factors validation is explicitly not claimed.
5. **Risk-based CI implemented:** CI provisions disposable PostgreSQL, applies and checks both migrations, runs unit/negative-boundary/database workflow tests, type-checks, builds, audits production dependencies at high severity, and scans secrets. The local verified run passed 23/23 tests, including the database integration test, migration deployment/status, TypeScript, and the production build (26 page groups plus proxy). Browser-backed human interaction remains an external verification gate; the earlier real HTTP NextAuth acceptance remains the current login evidence.

Independent handoff verification repeated the install against the committed lockfile, applied both migrations twice to a fresh isolated PostgreSQL database with an explicit disposable connection identity, confirmed migration status and zero schema drift, and reran all 23 tests, TypeScript, the 26-page-group production build, the zero-finding low-threshold production dependency audit, diff checks, and current/two-commit secret scans. CI now uses per-run database/session material, audits at the same low threshold, and fetches history for its secret gate.

### Operational safety retained

- `start.sh` remains non-mutating: it does not install, seed, migrate, delete caches, start system services, or kill port owners. The disposable seed still requires an explicit acknowledgement, loopback database, and caller-provided 16+ character password.
- Legacy unscoped patient/session/billing/message pages redirect to the controlled boundary; their mutation and AI APIs return `410`. `lib/ai.ts` contains no provider key or outbound fetch.
- Example configuration contains placeholders only. Real secrets/data are prohibited from source control, and the incident/security documentation identifies the required production controls and accountable decisions.

### Remaining release gates

- Complete and sign the representative-user protocol with practicing users, remediate findings, and repeat browser-backed end-to-end acceptance.
- Approve the exact FHIR partner profiles/identifiers, consent/retention rules, deployment threat model, clinical red-flag policy, incident contacts, infrastructure controls, key custody/rotation, backup/restore, monitoring, BAAs/DPAs, and privacy/security ownership.
- Until those gates have attributable evidence, keep this classification **Functional but incomplete** and use synthetic data only.

### Runtime acceptance refresh (2026-07-20)

- The release launcher now requires an explicit unused `PORT`; it has no fallback port and remains non-mutating. Disposable acceptance can resolve checked build artifacts through `RUNTIME_PROJECT_SOURCE` without changing normal launch behavior.
- On isolated PostgreSQL port `55681` and application port `6166`, the shared runtime validator completed production startup, a real credentials callback, a NextAuth session read, and an authenticated API request: `API_VERIFIED|physicalThreapy|startup_login_session_api`.
- The refresh also passed TypeScript, 22 executable tests with one database-only test skipped in that invocation, and the 26-page-group production build. All assigned listeners were released after validation.
