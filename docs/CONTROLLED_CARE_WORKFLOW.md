# Controlled care workflow

This is an API-first, bounded workflow for synthetic-data verification. It is not a certified EHR or medical device, and it does not authorize production PHI. Every request requires an authenticated session plus `X-Practice-ID`; clinical reads should include `X-Purpose-Of-Use`, and mutations must carry an `Origin` exactly matching `NEXTAUTH_URL`.

1. An operator explicitly runs `npm run practice:provision` with the environment values documented in `.env.example`. It requires an existing `ADMIN`, creates the first practice membership and `ClinicalArtifact` retention policy, and records the genesis audit event. The administrator can then add exact-role members through `/api/clinical/governance/memberships`.
2. `POST /api/clinical/fhir/import` accepts only FHIR R4 Patient and Consent resources from an allowlisted `X-FHIR-Source-System`. Patient identity requires two identifiers with different systems. Values are HMACed and demographics are AES-256-GCM encrypted.
3. New identities return `202` and cannot enter care. `POST /api/clinical/patients/{id}/identity` records a reasoned verification or rejection. Ambiguous matches fail closed.
4. An administrator assigns an active therapist with `POST /api/clinical/patients/{id}/care-team`. The database and application reject cross-practice references.
5. `POST /api/clinical/artifacts` requires verified identity, care-team assignment, active verified consent covering treatment and data use, complete provenance, sources, indications, contraindications, author attestation, and confidence. It never calls an external model.
6. Red-flag text, missing evidence, or confidence below 0.8 creates an `ESCALATED` non-authoritative artifact. Otherwise it is `PENDING_REVIEW`.
7. Assigned therapists use `GET /api/clinical/artifacts` for the bounded review queue and `GET /api/clinical/artifacts/{id}` for an audited, decrypted review view. A different assigned therapist uses `POST /api/clinical/artifacts/{id}/review`. Self-review and approval of unresolved safety/missing-data escalation are blocked. Patient-portal users can retrieve only `APPROVED` artifacts for their linked identity.
8. Reads use explicit role projections and append an audit event. Audit events and clinical reviews are database-immutable and audit entries form a per-practice hash chain.
9. Retention execution at `POST /api/clinical/governance/retention` is dry-run unless `X-Retention-Approval: APPLY` is present. Active legal holds exclude records. Purging replaces encrypted content with an encrypted tombstone and keeps immutable evidence.

External onboarding gates: validate the trading partner's FHIR profile and identifiers, approve jurisdiction-specific consent policy, configure managed key storage/rotation, execute backup/restore and disaster recovery, complete security/privacy risk analysis and vendor agreements, and run the representative-user protocol below.
