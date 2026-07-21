CREATE TYPE "MembershipStatus" AS ENUM ('ACTIVE', 'SUSPENDED');
CREATE TYPE "IdentityState" AS ENUM ('NEEDS_REVIEW', 'VERIFIED', 'REJECTED');
CREATE TYPE "ConsentStatus" AS ENUM ('DRAFT', 'ACTIVE', 'INACTIVE', 'REJECTED', 'ENTERED_IN_ERROR');
CREATE TYPE "ConsentScope" AS ENUM ('TREATMENT', 'DATA_USE', 'EXTERNAL_DISCLOSURE', 'EXTERNAL_AI');
CREATE TYPE "ArtifactStatus" AS ENUM ('PENDING_REVIEW', 'ESCALATED', 'APPROVED', 'REJECTED', 'SUPERSEDED');
CREATE TYPE "ClinicalRisk" AS ENUM ('LOW', 'MODERATE', 'HIGH', 'CRITICAL');
CREATE TYPE "ReviewDecision" AS ENUM ('APPROVE', 'REJECT', 'RETURN_FOR_CHANGES');
CREATE TYPE "IncidentStatus" AS ENUM ('OPEN', 'CONTAINED', 'INVESTIGATING', 'RESOLVED');

CREATE TABLE "practices" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "practices_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "practice_memberships" (
  "id" TEXT NOT NULL,
  "practiceId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "role" "UserRole" NOT NULL,
  "status" "MembershipStatus" NOT NULL DEFAULT 'ACTIVE',
  "portalPatientId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "practice_memberships_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "clinical_patients" (
  "id" TEXT NOT NULL,
  "practiceId" TEXT NOT NULL,
  "fhirResourceId" TEXT,
  "identityState" "IdentityState" NOT NULL DEFAULT 'NEEDS_REVIEW',
  "encryptedDemographics" TEXT NOT NULL,
  "encryptionKeyId" TEXT NOT NULL,
  "payloadHash" TEXT NOT NULL,
  "sourceSystem" TEXT NOT NULL,
  "fhirVersion" TEXT NOT NULL DEFAULT '4.0.1',
  "verifiedByUserId" TEXT,
  "verifiedAt" TIMESTAMP(3),
  "retainedUntil" TIMESTAMP(3),
  "purgedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "clinical_patients_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "patient_identifiers" (
  "id" TEXT NOT NULL,
  "practiceId" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "system" TEXT NOT NULL,
  "valueHash" TEXT NOT NULL,
  "lastFour" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "patient_identifiers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "consent_records" (
  "id" TEXT NOT NULL,
  "practiceId" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "fhirConsentId" TEXT,
  "status" "ConsentStatus" NOT NULL,
  "scopes" "ConsentScope"[],
  "policyUri" TEXT NOT NULL,
  "sourceSystem" TEXT NOT NULL,
  "sourceHash" TEXT NOT NULL,
  "effectiveFrom" TIMESTAMP(3) NOT NULL,
  "effectiveUntil" TIMESTAMP(3),
  "verified" BOOLEAN NOT NULL DEFAULT false,
  "verifiedByUserId" TEXT,
  "verifiedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "consent_records_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "care_team_assignments" (
  "id" TEXT NOT NULL,
  "practiceId" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "relationship" TEXT NOT NULL,
  "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "endsAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "care_team_assignments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "clinical_artifacts" (
  "id" TEXT NOT NULL,
  "practiceId" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "artifactType" TEXT NOT NULL,
  "encryptedContent" TEXT NOT NULL,
  "encryptionKeyId" TEXT NOT NULL,
  "contentHash" TEXT NOT NULL,
  "provenance" JSONB NOT NULL,
  "sourceResourceIds" TEXT[],
  "safetyFlags" TEXT[],
  "missingData" TEXT[],
  "risk" "ClinicalRisk" NOT NULL,
  "status" "ArtifactStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
  "createdByUserId" TEXT NOT NULL,
  "approvedByUserId" TEXT,
  "approvedAt" TIMESTAMP(3),
  "retainedUntil" TIMESTAMP(3),
  "purgedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "clinical_artifacts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "clinical_reviews" (
  "id" TEXT NOT NULL,
  "artifactId" TEXT NOT NULL,
  "reviewerUserId" TEXT NOT NULL,
  "decision" "ReviewDecision" NOT NULL,
  "rationale" TEXT NOT NULL,
  "safetyAttested" BOOLEAN NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "clinical_reviews_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "audit_events" (
  "id" TEXT NOT NULL,
  "practiceId" TEXT NOT NULL,
  "sequence" BIGINT NOT NULL,
  "actorUserId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "resourceType" TEXT NOT NULL,
  "resourceId" TEXT NOT NULL,
  "patientId" TEXT,
  "purposeOfUse" TEXT NOT NULL,
  "outcome" TEXT NOT NULL,
  "metadata" JSONB NOT NULL,
  "previousHash" TEXT NOT NULL,
  "eventHash" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "retention_policies" (
  "id" TEXT NOT NULL,
  "practiceId" TEXT NOT NULL,
  "recordType" TEXT NOT NULL,
  "retainDays" INTEGER NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "approvedBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "retention_policies_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "retention_policies_days_check" CHECK ("retainDays" BETWEEN 1 AND 36500)
);

CREATE TABLE "legal_holds" (
  "id" TEXT NOT NULL,
  "practiceId" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "openedBy" TEXT NOT NULL,
  "releasedBy" TEXT,
  "releasedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "legal_holds_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "security_incidents" (
  "id" TEXT NOT NULL,
  "practiceId" TEXT NOT NULL,
  "status" "IncidentStatus" NOT NULL DEFAULT 'OPEN',
  "severity" "ClinicalRisk" NOT NULL,
  "summary" TEXT NOT NULL,
  "detectedByUserId" TEXT NOT NULL,
  "containmentNotes" TEXT,
  "affectedResources" TEXT[],
  "notificationDueAt" TIMESTAMP(3),
  "resolvedAt" TIMESTAMP(3),
  "outcome" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "security_incidents_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "workflow_validations" (
  "id" TEXT NOT NULL,
  "practiceId" TEXT NOT NULL,
  "scenarioId" TEXT NOT NULL,
  "participantRole" TEXT NOT NULL,
  "facilitatorId" TEXT NOT NULL,
  "result" TEXT NOT NULL,
  "evidenceUri" TEXT NOT NULL,
  "findings" JSONB NOT NULL,
  "performedAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "workflow_validations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "practice_memberships_userId_status_idx" ON "practice_memberships"("userId", "status");
CREATE UNIQUE INDEX "practice_memberships_practiceId_userId_key" ON "practice_memberships"("practiceId", "userId");
CREATE INDEX "clinical_patients_practiceId_identityState_idx" ON "clinical_patients"("practiceId", "identityState");
CREATE UNIQUE INDEX "clinical_patients_practiceId_fhirResourceId_key" ON "clinical_patients"("practiceId", "fhirResourceId");
CREATE INDEX "patient_identifiers_patientId_idx" ON "patient_identifiers"("patientId");
CREATE UNIQUE INDEX "patient_identifiers_practiceId_system_valueHash_key" ON "patient_identifiers"("practiceId", "system", "valueHash");
CREATE INDEX "consent_records_patientId_status_effectiveFrom_idx" ON "consent_records"("patientId", "status", "effectiveFrom");
CREATE UNIQUE INDEX "consent_records_practiceId_fhirConsentId_key" ON "consent_records"("practiceId", "fhirConsentId");
CREATE INDEX "care_team_assignments_practiceId_userId_endsAt_idx" ON "care_team_assignments"("practiceId", "userId", "endsAt");
CREATE UNIQUE INDEX "care_team_assignments_practiceId_patientId_userId_relations_key" ON "care_team_assignments"("practiceId", "patientId", "userId", "relationship");
CREATE INDEX "clinical_artifacts_practiceId_status_risk_idx" ON "clinical_artifacts"("practiceId", "status", "risk");
CREATE INDEX "clinical_artifacts_patientId_createdAt_idx" ON "clinical_artifacts"("patientId", "createdAt");
CREATE INDEX "clinical_reviews_artifactId_createdAt_idx" ON "clinical_reviews"("artifactId", "createdAt");
CREATE INDEX "audit_events_practiceId_patientId_createdAt_idx" ON "audit_events"("practiceId", "patientId", "createdAt");
CREATE UNIQUE INDEX "audit_events_practiceId_sequence_key" ON "audit_events"("practiceId", "sequence");
CREATE UNIQUE INDEX "retention_policies_practiceId_recordType_key" ON "retention_policies"("practiceId", "recordType");
CREATE INDEX "legal_holds_practiceId_patientId_releasedAt_idx" ON "legal_holds"("practiceId", "patientId", "releasedAt");
CREATE INDEX "security_incidents_practiceId_status_severity_idx" ON "security_incidents"("practiceId", "status", "severity");
CREATE UNIQUE INDEX "workflow_validations_practiceId_scenarioId_participantRole__key" ON "workflow_validations"("practiceId", "scenarioId", "participantRole", "performedAt");

ALTER TABLE "practice_memberships" ADD CONSTRAINT "practice_memberships_practiceId_fkey" FOREIGN KEY ("practiceId") REFERENCES "practices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "practice_memberships" ADD CONSTRAINT "practice_memberships_portalPatientId_fkey" FOREIGN KEY ("portalPatientId") REFERENCES "clinical_patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "practice_memberships" ADD CONSTRAINT "practice_memberships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "clinical_patients" ADD CONSTRAINT "clinical_patients_practiceId_fkey" FOREIGN KEY ("practiceId") REFERENCES "practices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "patient_identifiers" ADD CONSTRAINT "patient_identifiers_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "clinical_patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "consent_records" ADD CONSTRAINT "consent_records_practiceId_fkey" FOREIGN KEY ("practiceId") REFERENCES "practices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "consent_records" ADD CONSTRAINT "consent_records_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "clinical_patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "care_team_assignments" ADD CONSTRAINT "care_team_assignments_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "clinical_patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "care_team_assignments" ADD CONSTRAINT "care_team_assignments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "clinical_artifacts" ADD CONSTRAINT "clinical_artifacts_practiceId_fkey" FOREIGN KEY ("practiceId") REFERENCES "practices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "clinical_artifacts" ADD CONSTRAINT "clinical_artifacts_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "clinical_patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "clinical_reviews" ADD CONSTRAINT "clinical_reviews_artifactId_fkey" FOREIGN KEY ("artifactId") REFERENCES "clinical_artifacts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_practiceId_fkey" FOREIGN KEY ("practiceId") REFERENCES "practices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "legal_holds" ADD CONSTRAINT "legal_holds_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "clinical_patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "security_incidents" ADD CONSTRAINT "security_incidents_practiceId_fkey" FOREIGN KEY ("practiceId") REFERENCES "practices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Database-enforced append-only evidence. The application role can insert, but
-- no UPDATE or DELETE can rewrite the audit or review history.
CREATE FUNCTION forbid_evidence_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'immutable evidence table % cannot be modified', TG_TABLE_NAME;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_events_immutable BEFORE UPDATE OR DELETE ON "audit_events"
FOR EACH ROW EXECUTE FUNCTION forbid_evidence_mutation();
CREATE TRIGGER clinical_reviews_immutable BEFORE UPDATE OR DELETE ON "clinical_reviews"
FOR EACH ROW EXECUTE FUNCTION forbid_evidence_mutation();

-- Reject cross-practice references even if application checks regress.
CREATE FUNCTION enforce_clinical_tenant() RETURNS trigger AS $$
DECLARE patient_practice TEXT;
BEGIN
  SELECT "practiceId" INTO patient_practice FROM "clinical_patients" WHERE "id" = NEW."patientId";
  IF patient_practice IS NULL OR patient_practice <> NEW."practiceId" THEN
    RAISE EXCEPTION 'cross-practice clinical reference rejected';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER patient_identifiers_tenant BEFORE INSERT OR UPDATE ON "patient_identifiers" FOR EACH ROW EXECUTE FUNCTION enforce_clinical_tenant();
CREATE TRIGGER consent_records_tenant BEFORE INSERT OR UPDATE ON "consent_records" FOR EACH ROW EXECUTE FUNCTION enforce_clinical_tenant();
CREATE TRIGGER care_team_assignments_tenant BEFORE INSERT OR UPDATE ON "care_team_assignments" FOR EACH ROW EXECUTE FUNCTION enforce_clinical_tenant();
CREATE TRIGGER clinical_artifacts_tenant BEFORE INSERT OR UPDATE ON "clinical_artifacts" FOR EACH ROW EXECUTE FUNCTION enforce_clinical_tenant();
CREATE TRIGGER legal_holds_tenant BEFORE INSERT OR UPDATE ON "legal_holds" FOR EACH ROW EXECUTE FUNCTION enforce_clinical_tenant();

CREATE FUNCTION enforce_portal_membership_tenant() RETURNS trigger AS $$
DECLARE patient_practice TEXT;
BEGIN
  IF NEW."portalPatientId" IS NULL THEN RETURN NEW; END IF;
  SELECT "practiceId" INTO patient_practice FROM "clinical_patients" WHERE "id" = NEW."portalPatientId";
  IF patient_practice IS NULL OR patient_practice <> NEW."practiceId" THEN
    RAISE EXCEPTION 'cross-practice portal membership rejected';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER practice_memberships_tenant BEFORE INSERT OR UPDATE ON "practice_memberships" FOR EACH ROW EXECUTE FUNCTION enforce_portal_membership_tenant();
