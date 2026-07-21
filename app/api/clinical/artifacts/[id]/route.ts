import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { appendAudit } from '@/lib/clinical/audit';
import { requireClinicalActor, requireRole } from '@/lib/clinical/authorization';
import { decryptJson } from '@/lib/clinical/crypto';
import { clinicalError } from '@/lib/clinical/http';
import { requireCareTeamAccess } from '@/lib/clinical/policy';
import { ClinicalBoundaryError } from '@/lib/clinical/types';

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireClinicalActor(request.headers.get('x-practice-id'));
    requireRole(actor, ['THERAPIST', 'PATIENT_PORTAL']);
    const { id } = await context.params;
    const artifact = await prisma.$transaction(async (tx) => {
      const record = await tx.clinicalArtifact.findFirst({ where: { id, practiceId: actor.practiceId, purgedAt: null } });
      if (!record) throw new ClinicalBoundaryError('Artifact not found', 404, 'ARTIFACT_NOT_FOUND');
      await requireCareTeamAccess(tx, actor, record.patientId);
      if (actor.role === 'PATIENT_PORTAL' && record.status !== 'APPROVED') throw new ClinicalBoundaryError('Artifact not found', 404, 'ARTIFACT_NOT_FOUND');
      const content = decryptJson<Record<string, unknown>>(record.encryptedContent, `${actor.practiceId}:${record.id}:artifact`);
      await appendAudit(tx, actor, { action: 'CLINICAL_ARTIFACT_READ', resourceType: 'ClinicalArtifact', resourceId: id, patientId: record.patientId, purposeOfUse: request.headers.get('x-purpose-of-use') ?? 'TREATMENT', outcome: 'SUCCESS', metadata: { status: record.status, role: actor.role } });
      return { id: record.id, patientId: record.patientId, artifactType: record.artifactType, status: record.status, risk: record.risk, provenance: record.provenance, safetyFlags: record.safetyFlags, missingData: record.missingData, content, authoritative: record.status === 'APPROVED' };
    }, { isolationLevel: 'Serializable' });
    return NextResponse.json(artifact, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return clinicalError(error); }
}
