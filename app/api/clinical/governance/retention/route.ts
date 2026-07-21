import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { appendAudit } from '@/lib/clinical/audit';
import { requireClinicalActor, requireRole } from '@/lib/clinical/authorization';
import { encryptJson } from '@/lib/clinical/crypto';
import { clinicalError, limitedJson, requireSameOrigin } from '@/lib/clinical/http';
import { ClinicalBoundaryError } from '@/lib/clinical/types';

export async function PUT(request: NextRequest) {
  try {
    requireSameOrigin(request);
    const actor = await requireClinicalActor(request.headers.get('x-practice-id'));
    requireRole(actor, ['ADMIN']);
    const body = await limitedJson(request) as { recordType?: string; retainDays?: number };
    if (body.recordType !== 'ClinicalArtifact' || !Number.isInteger(body.retainDays) || body.retainDays! < 1 || body.retainDays! > 36_500) {
      throw new ClinicalBoundaryError('ClinicalArtifact retainDays must be between 1 and 36500', 422, 'RETENTION_POLICY_INVALID');
    }
    const policy = await prisma.$transaction(async (tx) => {
      const record = await tx.retentionPolicy.upsert({
        where: { practiceId_recordType: { practiceId: actor.practiceId, recordType: body.recordType! } },
        create: { practiceId: actor.practiceId, recordType: body.recordType!, retainDays: body.retainDays!, approvedBy: actor.userId },
        update: { retainDays: body.retainDays!, enabled: true, approvedBy: actor.userId },
      });
      await appendAudit(tx, actor, { action: 'RETENTION_POLICY_SET', resourceType: 'RetentionPolicy', resourceId: record.id, purposeOfUse: 'HEALTHCARE_OPERATIONS', outcome: 'SUCCESS', metadata: { recordType: body.recordType, retainDays: body.retainDays } });
      return record;
    }, { isolationLevel: 'Serializable' });
    return NextResponse.json({ id: policy.id, retainDays: policy.retainDays });
  } catch (error) { return clinicalError(error); }
}

export async function POST(request: NextRequest) {
  try {
    requireSameOrigin(request);
    const actor = await requireClinicalActor(request.headers.get('x-practice-id'));
    requireRole(actor, ['ADMIN']);
    const apply = request.headers.get('x-retention-approval') === 'APPLY';
    const expired = await prisma.clinicalArtifact.findMany({
      where: { practiceId: actor.practiceId, purgedAt: null, retainedUntil: { lte: new Date() }, patient: { legalHolds: { none: { releasedAt: null } } } },
      select: { id: true, patientId: true }, take: 100, orderBy: { retainedUntil: 'asc' },
    });
    if (!apply) return NextResponse.json({ dryRun: true, eligibleArtifactIds: expired.map(({ id }) => id), capped: expired.length === 100 });
    const purged = await prisma.$transaction(async (tx) => {
      const ids: string[] = [];
      for (const artifact of expired) {
        const tombstone = encryptJson({ purged: true, reason: 'RETENTION_EXPIRED' }, `${actor.practiceId}:${artifact.id}:artifact`);
        await tx.clinicalArtifact.update({ where: { id: artifact.id }, data: { encryptedContent: tombstone.ciphertext, encryptionKeyId: tombstone.keyId, contentHash: tombstone.hash, provenance: {}, sourceResourceIds: [], safetyFlags: [], missingData: [], status: 'SUPERSEDED', purgedAt: new Date() } });
        await appendAudit(tx, actor, { action: 'RETENTION_PURGE', resourceType: 'ClinicalArtifact', resourceId: artifact.id, patientId: artifact.patientId, purposeOfUse: 'HEALTHCARE_OPERATIONS', outcome: 'SUCCESS' });
        ids.push(artifact.id);
      }
      return ids;
    }, { isolationLevel: 'Serializable' });
    return NextResponse.json({ dryRun: false, purgedArtifactIds: purged });
  } catch (error) { return clinicalError(error); }
}
