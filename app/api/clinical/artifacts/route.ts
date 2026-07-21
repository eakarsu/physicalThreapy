import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { appendAudit } from '@/lib/clinical/audit';
import { requireClinicalActor, requireRole } from '@/lib/clinical/authorization';
import { encryptJson } from '@/lib/clinical/crypto';
import { clinicalError, limitedJson, requireSameOrigin } from '@/lib/clinical/http';
import { requireCareTeamAccess, requireConsent } from '@/lib/clinical/policy';
import { screenClinicalDraft } from '@/lib/clinical/safety';
import { ClinicalBoundaryError } from '@/lib/clinical/types';

export async function GET(request: NextRequest) {
  try {
    const actor = await requireClinicalActor(request.headers.get('x-practice-id'));
    requireRole(actor, ['THERAPIST']);
    const status = request.nextUrl.searchParams.get('status') ?? 'PENDING_REVIEW';
    if (!['PENDING_REVIEW', 'ESCALATED'].includes(status)) throw new ClinicalBoundaryError('Review queue status is invalid', 422, 'QUEUE_STATUS_INVALID');
    const artifacts = await prisma.$transaction(async (tx) => {
      const records = await tx.clinicalArtifact.findMany({
        where: { practiceId: actor.practiceId, status: status as 'PENDING_REVIEW' | 'ESCALATED', purgedAt: null, patient: { careTeam: { some: { userId: actor.userId, startsAt: { lte: new Date() }, OR: [{ endsAt: null }, { endsAt: { gt: new Date() } }] } } } },
        select: { id: true, patientId: true, artifactType: true, risk: true, status: true, safetyFlags: true, missingData: true, createdByUserId: true, createdAt: true },
        orderBy: [{ risk: 'desc' }, { createdAt: 'asc' }],
        take: 100,
      });
      await appendAudit(tx, actor, { action: 'CLINICAL_REVIEW_QUEUE_READ', resourceType: 'ClinicalArtifact', resourceId: `queue:${status}`, purposeOfUse: 'TREATMENT', outcome: 'SUCCESS', metadata: { resultCount: records.length } });
      return records;
    }, { isolationLevel: 'Serializable' });
    return NextResponse.json({ artifacts }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return clinicalError(error); }
}

export async function POST(request: NextRequest) {
  try {
    requireSameOrigin(request);
    const actor = await requireClinicalActor(request.headers.get('x-practice-id'));
    requireRole(actor, ['THERAPIST']);
    const body = await limitedJson(request) as {
      patientId?: string; artifactType?: string; content?: string; sourceResourceIds?: string[];
      provenance?: { sourceSystem?: string; authorRole?: string; generatedBy?: string; modelVersion?: string | null };
      indications?: string[]; contraindications?: string[]; confidence?: number; authorAttestation?: boolean;
    };
    if (!body.patientId || !body.artifactType || !body.content || body.content.length > 50_000) {
      throw new ClinicalBoundaryError('patientId, artifactType, and bounded content are required', 422, 'ARTIFACT_INVALID');
    }
    const patientId = body.patientId;
    const artifactType = body.artifactType;
    const content = body.content;
    const safety = screenClinicalDraft({ ...body, content });
    const id = randomUUID();
    const encrypted = encryptJson({ content, indications: body.indications, contraindications: body.contraindications }, `${actor.practiceId}:${id}:artifact`);
    const artifact = await prisma.$transaction(async (tx) => {
      const patient = await tx.clinicalPatient.findFirst({ where: { id: patientId, practiceId: actor.practiceId } });
      if (!patient) throw new ClinicalBoundaryError('Patient not found', 404, 'PATIENT_NOT_FOUND');
      if (patient.identityState !== 'VERIFIED') throw new ClinicalBoundaryError('Verified patient identity is required', 409, 'IDENTITY_NOT_VERIFIED');
      await requireCareTeamAccess(tx, actor, patient.id);
      await requireConsent(tx, actor.practiceId, patient.id, ['TREATMENT', 'DATA_USE']);
      const retention = await tx.retentionPolicy.findUnique({ where: { practiceId_recordType: { practiceId: actor.practiceId, recordType: 'ClinicalArtifact' } } });
      if (!retention?.enabled || retention.retainDays < 1) throw new ClinicalBoundaryError('An approved ClinicalArtifact retention policy is required', 409, 'RETENTION_POLICY_REQUIRED');
      if (!body.provenance?.sourceSystem || !body.provenance.authorRole || !body.provenance.generatedBy) {
        safety.missingData.push('provenance');
        safety.status = 'ESCALATED';
      }
      const record = await tx.clinicalArtifact.create({
        data: {
          id, practiceId: actor.practiceId, patientId: patient.id, artifactType,
          encryptedContent: encrypted.ciphertext, encryptionKeyId: encrypted.keyId, contentHash: encrypted.hash,
          provenance: body.provenance ?? {}, sourceResourceIds: body.sourceResourceIds ?? [], safetyFlags: safety.safetyFlags,
          missingData: [...new Set(safety.missingData)], risk: safety.risk, status: safety.status, createdByUserId: actor.userId,
          retainedUntil: new Date(Date.now() + retention.retainDays * 86_400_000),
        },
      });
      await appendAudit(tx, actor, { action: 'CLINICAL_DRAFT_CREATED', resourceType: 'ClinicalArtifact', resourceId: id, patientId: patient.id, purposeOfUse: 'TREATMENT', outcome: 'SUCCESS', metadata: { artifactType, risk: safety.risk, status: safety.status, safetyFlags: safety.safetyFlags, missingData: safety.missingData } });
      return record;
    }, { isolationLevel: 'Serializable' });
    return NextResponse.json({ id: artifact.id, status: artifact.status, risk: artifact.risk, safetyFlags: artifact.safetyFlags, missingData: artifact.missingData, authoritative: false }, { status: artifact.status === 'ESCALATED' ? 202 : 201 });
  } catch (error) { return clinicalError(error); }
}
