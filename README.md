# PT Flow

PT Flow is a local physical-therapy care-workflow prototype. Its bounded `/api/clinical` path demonstrates FHIR R4 Patient/Consent intake, manual identity verification, care-team and consent enforcement, encrypted clinical drafts, deterministic safety escalation, independent clinician review, role-specific projections, immutable audit evidence, retention/legal holds, and incident intake. It is not a medical device, diagnosis system, treatment recommendation system, certified EHR, HIPAA certification, or production repository for protected health information.

Legacy unscoped clinical pages and mutation/AI routes are intentionally blocked. External model egress is disabled. The governed workflow and external deployment gates are documented in [docs/CONTROLLED_CARE_WORKFLOW.md](docs/CONTROLLED_CARE_WORKFLOW.md); representative-user validation remains governed by [docs/WORKFLOW_VALIDATION.md](docs/WORKFLOW_VALIDATION.md).

## Safe local verification

1. Run `npm ci` and `npm run db:generate`.
2. Provision a disposable loopback PostgreSQL database and set `DATABASE_URL`.
3. Apply a reviewed schema migration. Never use `prisma db push --accept-data-loss` against shared data.
4. To populate a disposable database only, set `ALLOW_DISPOSABLE_SEED=YES` and a unique `SEED_USER_PASSWORD` of at least 16 characters, then run `npm run db:seed`.
5. For synthetic controlled-workflow tests, set independent `PHI_ENCRYPTION_KEY`, `PHI_ENCRYPTION_KEY_ID`, `IDENTITY_HASH_KEY`, and exact `FHIR_TRUSTED_SOURCE_SYSTEMS` values described in `.env.example`.
6. Set a 32+ character `NEXTAUTH_SECRET` and exact `NEXTAUTH_URL`, run `npm run build`, then `./start.sh`.

The launcher never installs software, creates/resets/seeds a database, deletes caches, starts system services, or kills port owners. The seed deletes its target data and therefore fails unless the explicit disposable-database acknowledgement and loopback URL are present.

Runtime acceptance requires readiness of `/login`, rejection of an incorrect password, successful sign-in with an operator-seeded user, access to one protected page, and clean shutdown. Do not use real patient data for local verification.

Verification uses `npm test`, `npm run typecheck`, `npm run build`, `npm audit --omit=dev --audit-level=high`, and a disposable PostgreSQL database for `npm run db:migrate` plus the integration test. CI runs the same migration, unit, negative authorization/safety, database, build, dependency, and secret checks.
