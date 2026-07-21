import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { appendAudit } from '@/lib/clinical/audit';
import { requireClinicalActor, requireRole } from '@/lib/clinical/authorization';
import { clinicalError, limitedJson, requireSameOrigin } from '@/lib/clinical/http';
import { requireCareTeamAccess } from '@/lib/clinical/policy';
import { validateIndependentReview } from '@/lib/clinical/safety';
import { ClinicalBoundaryError } from '@/lib/clinical/types';

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    requireSameOrigin(request);
    const actor = await requireClinicalActor(request.headers.get('x-practice-id'));
    requireRole(actor, ['THERAPIST']);
    const { id } = await context.params;
    const body = await limitedJson(request) as { decision?: 'APPROVE' | 'REJECT' | 'RETURN_FOR_CHANGES'; rationale?: string; safetyAttested?: boolean };
    if (!body.decision || (body.rationale?.trim().length ?? 0) < 20 || body.safetyAttested !== true) {
      throw new ClinicalBoundaryError('Decision, safety attestation, and 20-character rationale are required', 422, 'REVIEW_INVALID');
    }
    const decision = body.decision;
    const rationale = body.rationale!;
    const outcome = await prisma.$transaction(async (tx) => {
      const artifact = await tx.clinicalArtifact.findFirst({ where: { id, practiceId: actor.practiceId } });
      if (!artifact) throw new ClinicalBoundaryError('Artifact not found', 404, 'ARTIFACT_NOT_FOUND');
      await requireCareTeamAccess(tx, actor, artifact.patientId);
      const boundary = validateIndependentReview({ creatorUserId: artifact.createdByUserId, reviewerUserId: actor.userId, status: artifact.status, safetyFlags: artifact.safetyFlags, missingData: artifact.missingData, decision });
      if (!boundary.allowed) throw new ClinicalBoundaryError('Independent safety review requirements are not satisfied', 409, boundary.code!);
      const review = await tx.clinicalReview.create({ data: { artifactId: id, reviewerUserId: actor.userId, decision, rationale, safetyAttested: true } });
      const status = decision === 'APPROVE' ? 'APPROVED' : decision === 'REJECT' ? 'REJECTED' : 'ESCALATED';
      const updated = await tx.clinicalArtifact.update({ where: { id }, data: { status, approvedByUserId: status === 'APPROVED' ? actor.userId : null, approvedAt: status === 'APPROVED' ? new Date() : null } });
      await appendAudit(tx, actor, { action: `CLINICAL_REVIEW_${decision}`, resourceType: 'ClinicalArtifact', resourceId: id, patientId: artifact.patientId, purposeOfUse: 'TREATMENT', outcome: 'SUCCESS', metadata: { reviewId: review.id, status } });
      return updated;
    }, { isolationLevel: 'Serializable' });
    return NextResponse.json({ id: outcome.id, status: outcome.status, authoritative: outcome.status === 'APPROVED' });
  } catch (error) { return clinicalError(error); }
}
