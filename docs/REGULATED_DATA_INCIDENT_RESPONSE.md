# Regulated-data incident response

The accountable security/privacy owner must adapt and approve this runbook before production.

1. Report immediately through `POST /api/clinical/governance/incidents`; do not paste PHI into the summary. Record opaque affected resource IDs, detection time, severity, and reporter.
2. Contain access without destroying evidence: suspend compromised memberships/credentials, revoke sessions and provider tokens, isolate the affected integration, preserve logs, and start an incident timeline. Do not edit audit or clinical-review rows.
3. Investigate scope and harm: verify audit-chain integrity, identify data types/people/systems/time window, preserve chain of custody, engage the privacy/security owner and counsel, and document each determination.
4. Eradicate and recover: rotate affected secrets/keys, patch the cause, validate least privilege, restore only from verified backups if needed, monitor for recurrence, and record containment/recovery evidence.
5. The privacy owner determines breach-notification duties and deadlines under applicable law and contracts; the software does not make this legal determination. Coordinate required notices to affected people, regulators, customers, insurers, and law enforcement.
6. Close only after documenting outcome, corrective actions, owners, due dates, and a post-incident test. Preserve records under retention/legal-hold policy.

Emergency contacts, on-call rotation, regulator/insurer contacts, breach counsel, backup owner, and vendors are deployment-specific external gates and must be tested in a tabletop exercise.
