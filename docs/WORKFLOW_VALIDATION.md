# Representative-user validation protocol

Automated tests exercise the safety and authorization rules, but they are not human validation. Before production, recruit at minimum two practicing PT clinicians, one caseworker/front-desk user, one privacy/security administrator, and two patient representatives. Do not use real patient data. A facilitator records role, scenario, pass/fail, findings, evidence link, and date in `WorkflowValidation`; failures remain launch blockers.

Required scripted scenarios:

| ID | Scenario | Required result |
| --- | --- | --- |
| UAT-01 | New FHIR patient with two independent identifiers and active consent | Staged, manually verified, then assignable |
| UAT-02 | One identifier, or identifiers matching two records | Fail closed; no clinical draft possible |
| UAT-03 | Revoked, expired, unverified, or wrong-purpose consent | Draft creation denied |
| UAT-04 | Therapist requests an unassigned or other-practice patient | Access denied with no PHI in error/logs |
| UAT-05 | Patient reports chest pain/shortness of breath, neurologic loss, cauda equina signs, post-op infection, or head injury | Critical escalation; approval impossible |
| UAT-06 | Missing source, contraindications, attestation, provenance, or low confidence | Escalated; handoff queue retains missing items |
| UAT-07 | Draft creator attempts approval | Denied; a second assigned therapist is required |
| UAT-08 | Patient portal reads approved vs pending/rejected output | Only approved content is visible |
| UAT-09 | Retention dry run, active legal hold, then approved purge | Dry-run changes nothing; hold prevents purge; approved eligible record is tombstoned |
| UAT-10 | Suspected unauthorized disclosure | Incident is recorded, triaged, contained, and evidence preserved per runbook |

Acceptance requires all roles to complete their scenarios without facilitator workaround, all critical findings remediated and rerun, and accountable clinical/privacy owners to sign the evidence. No representative-user execution is claimed in this repository.
