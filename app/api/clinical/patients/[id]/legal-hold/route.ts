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
    requireRole(actor, ['ADMIN']);
    const { id: patientId } = await context.params;
    const body = await limitedJson(request) as { reason?: string };
    if ((body.reason?.trim().length ?? 0) < 20) throw new ClinicalBoundaryError('A 20-character legal-hold reason is required', 422, 'LEGAL_HOLD_INVALID');
    const hold = await prisma.$transaction(async (tx) => {
      const patient = await tx.clinicalPatient.findFirst({ where: { id: patientId, practiceId: actor.practiceId } });
      if (!patient) throw new ClinicalBoundaryError('Patient not found', 404, 'PATIENT_NOT_FOUND');
      const record = await tx.legalHold.create({ data: { practiceId: actor.practiceId, patientId, reason: body.reason!, openedBy: actor.userId } });
      await appendAudit(tx, actor, { action: 'LEGAL_HOLD_OPENED', resourceType: 'LegalHold', resourceId: record.id, patientId, purposeOfUse: 'HEALTHCARE_OPERATIONS', outcome: 'SUCCESS' });
      return record;
    }, { isolationLevel: 'Serializable' });
    return NextResponse.json({ id: hold.id }, { status: 201 });
  } catch (error) { return clinicalError(error); }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    requireSameOrigin(request);
    const actor = await requireClinicalActor(request.headers.get('x-practice-id'));
    requireRole(actor, ['ADMIN']);
    const { id: patientId } = await context.params;
    const body = await limitedJson(request) as { holdId?: string; rationale?: string };
    if (!body.holdId || (body.rationale?.trim().length ?? 0) < 20) throw new ClinicalBoundaryError('Hold ID and 20-character release rationale are required', 422, 'LEGAL_HOLD_RELEASE_INVALID');
    await prisma.$transaction(async (tx) => {
      const hold = await tx.legalHold.findFirst({ where: { id: body.holdId, patientId, practiceId: actor.practiceId, releasedAt: null } });
      if (!hold) throw new ClinicalBoundaryError('Active legal hold not found', 404, 'LEGAL_HOLD_NOT_FOUND');
      await tx.legalHold.update({ where: { id: hold.id }, data: { releasedAt: new Date(), releasedBy: actor.userId } });
      await appendAudit(tx, actor, { action: 'LEGAL_HOLD_RELEASED', resourceType: 'LegalHold', resourceId: hold.id, patientId, purposeOfUse: 'HEALTHCARE_OPERATIONS', outcome: 'SUCCESS', metadata: { rationale: body.rationale } });
    }, { isolationLevel: 'Serializable' });
    return NextResponse.json({ released: true });
  } catch (error) { return clinicalError(error); }
}
