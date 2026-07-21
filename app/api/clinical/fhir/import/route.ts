import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireClinicalActor, requireRole } from '@/lib/clinical/authorization';
import { encryptJson, hashIdentifier, stableHash } from '@/lib/clinical/crypto';
import { parseR4Consent, parseR4Patient, resourcesFromR4 } from '@/lib/clinical/fhir';
import { clinicalError, limitedJson, requireSameOrigin } from '@/lib/clinical/http';
import { appendAudit } from '@/lib/clinical/audit';
import { ClinicalBoundaryError } from '@/lib/clinical/types';

function trustedSource(request: NextRequest): string {
  const source = request.headers.get('x-fhir-source-system')?.trim();
  const allowed = (process.env.FHIR_TRUSTED_SOURCE_SYSTEMS ?? '').split(',').map((item) => item.trim()).filter(Boolean);
  if (!source || !allowed.includes(source)) throw new ClinicalBoundaryError('FHIR source is not trusted', 403, 'FHIR_SOURCE_FORBIDDEN');
  return source;
}

export async function POST(request: NextRequest) {
  try {
    requireSameOrigin(request);
    const actor = await requireClinicalActor(request.headers.get('x-practice-id'));
    requireRole(actor, ['ADMIN', 'THERAPIST']);
    const sourceSystem = trustedSource(request);
    const input = await limitedJson(request, 512_000);
    const resources = resourcesFromR4(input);
    if (resources.some((resource) => !['Patient', 'Consent'].includes(String(resource.resourceType)))) {
      throw new ClinicalBoundaryError('Only Patient and Consent resources are accepted by this endpoint', 422, 'FHIR_RESOURCE_UNSUPPORTED');
    }

    const result = await prisma.$transaction(async (tx) => {
      const importedPatients: Array<{ id: string; fhirResourceId: string | null; identityState: string }> = [];
      for (const resource of resources.filter((item) => item.resourceType === 'Patient')) {
        const parsed = parseR4Patient(resource);
        const identifiers = parsed.identifiers.map((identifier) => ({
          ...identifier,
          valueHash: hashIdentifier(identifier.system, identifier.value),
          lastFour: identifier.value.slice(-4).padStart(4, '*'),
        }));
        const matches = await tx.patientIdentifier.findMany({
          where: { practiceId: actor.practiceId, OR: identifiers.map(({ system, valueHash }) => ({ system, valueHash })) },
          select: { patientId: true, system: true, valueHash: true },
        });
        const patientIds = [...new Set(matches.map((match) => match.patientId))];
        if (patientIds.length > 1 || (patientIds.length === 1 && matches.length < 2)) {
          throw new ClinicalBoundaryError('Patient identifiers are ambiguous and require identity review', 409, 'IDENTITY_AMBIGUOUS');
        }
        const patientId = patientIds[0] ?? crypto.randomUUID();
        const encrypted = encryptJson(parsed.demographics, `${actor.practiceId}:${patientId}:demographics`);
        const patient = patientIds.length
          ? await tx.clinicalPatient.update({
              where: { id: patientId },
              data: { encryptedDemographics: encrypted.ciphertext, encryptionKeyId: encrypted.keyId, payloadHash: encrypted.hash, sourceSystem },
            })
          : await tx.clinicalPatient.create({
              data: {
                id: patientId,
                practiceId: actor.practiceId,
                fhirResourceId: parsed.resourceId,
                encryptedDemographics: encrypted.ciphertext,
                encryptionKeyId: encrypted.keyId,
                payloadHash: encrypted.hash,
                sourceSystem,
                identifiers: { create: identifiers.map(({ system, valueHash, lastFour }) => ({ practiceId: actor.practiceId, system, valueHash, lastFour })) },
              },
            });
        importedPatients.push({ id: patient.id, fhirResourceId: patient.fhirResourceId, identityState: patient.identityState });
        await appendAudit(tx, actor, { action: patientIds.length ? 'FHIR_PATIENT_MATCHED' : 'FHIR_PATIENT_STAGED', resourceType: 'ClinicalPatient', resourceId: patient.id, patientId: patient.id, purposeOfUse: 'TREATMENT', outcome: 'SUCCESS', metadata: { sourceSystem, fhirVersion: '4.0.1', sourceHash: stableHash(resource) } });
      }

      const importedConsents: string[] = [];
      for (const resource of resources.filter((item) => item.resourceType === 'Consent')) {
        const parsed = parseR4Consent(resource);
        const fhirPatientId = parsed.patientReference.replace(/^Patient\//, '');
        const patient = await tx.clinicalPatient.findFirst({ where: { practiceId: actor.practiceId, fhirResourceId: fhirPatientId } });
        if (!patient) throw new ClinicalBoundaryError('Consent patient could not be matched inside the practice', 422, 'CONSENT_PATIENT_UNMATCHED');
        const consent = await tx.consentRecord.upsert({
          where: { practiceId_fhirConsentId: { practiceId: actor.practiceId, fhirConsentId: parsed.resourceId ?? `hash:${stableHash(resource)}` } },
          create: { practiceId: actor.practiceId, patientId: patient.id, fhirConsentId: parsed.resourceId ?? `hash:${stableHash(resource)}`, status: parsed.status, scopes: parsed.scopes, policyUri: parsed.policyUri, sourceSystem, sourceHash: stableHash(resource), effectiveFrom: parsed.effectiveFrom, effectiveUntil: parsed.effectiveUntil, verified: parsed.verified, verifiedByUserId: parsed.verified ? actor.userId : null, verifiedAt: parsed.verified ? new Date() : null },
          update: { status: parsed.status, scopes: parsed.scopes, policyUri: parsed.policyUri, sourceHash: stableHash(resource), effectiveFrom: parsed.effectiveFrom, effectiveUntil: parsed.effectiveUntil, verified: parsed.verified, verifiedByUserId: parsed.verified ? actor.userId : null, verifiedAt: parsed.verified ? new Date() : null },
        });
        importedConsents.push(consent.id);
        await appendAudit(tx, actor, { action: 'FHIR_CONSENT_IMPORTED', resourceType: 'ConsentRecord', resourceId: consent.id, patientId: patient.id, purposeOfUse: 'TREATMENT', outcome: 'SUCCESS', metadata: { sourceSystem, scopes: parsed.scopes, status: parsed.status } });
      }
      return { patients: importedPatients, consentIds: importedConsents };
    }, { isolationLevel: 'Serializable' });

    const needsReview = result.patients.some((patient) => patient.identityState === 'NEEDS_REVIEW');
    return NextResponse.json({ ...result, identityReviewRequired: needsReview }, { status: needsReview ? 202 : 200 });
  } catch (error) {
    return clinicalError(error);
  }
}
