import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { appendAudit } from '@/lib/clinical/audit';
import { requireClinicalActor, requireRole } from '@/lib/clinical/authorization';
import { clinicalError, limitedJson, requireSameOrigin } from '@/lib/clinical/http';
import { ClinicalBoundaryError } from '@/lib/clinical/types';

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    requireSameOrigin(request);
    const actor = await requireClinicalActor(request.headers.get('x-practice-id'));
    requireRole(actor, ['ADMIN', 'THERAPIST']);
    const { id } = await context.params;
    const body = await limitedJson(request) as { decision?: string; rationale?: string };
    if (!['VERIFIED', 'REJECTED'].includes(body.decision ?? '') || (body.rationale?.trim().length ?? 0) < 20) {
      throw new ClinicalBoundaryError('A decision and 20-character rationale are required', 422, 'IDENTITY_REVIEW_INVALID');
    }
    const patient = await prisma.$transaction(async (tx) => {
      const current = await tx.clinicalPatient.findFirst({ where: { id, practiceId: actor.practiceId }, include: { identifiers: true } });
      if (!current) throw new ClinicalBoundaryError('Patient not found', 404, 'PATIENT_NOT_FOUND');
      if (current.identifiers.length < 2) throw new ClinicalBoundaryError('Two identifiers are required before verification', 422, 'IDENTITY_EVIDENCE_INSUFFICIENT');
      const updated = await tx.clinicalPatient.update({ where: { id }, data: { identityState: body.decision as 'VERIFIED' | 'REJECTED', verifiedByUserId: actor.userId, verifiedAt: new Date() } });
      await appendAudit(tx, actor, { action: `IDENTITY_${body.decision}`, resourceType: 'ClinicalPatient', resourceId: id, patientId: id, purposeOfUse: 'TREATMENT', outcome: 'SUCCESS', metadata: { rationale: body.rationale } });
      return updated;
    }, { isolationLevel: 'Serializable' });
    return NextResponse.json({ id: patient.id, identityState: patient.identityState });
  } catch (error) { return clinicalError(error); }
}
