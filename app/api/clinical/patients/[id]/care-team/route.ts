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
    const body = await limitedJson(request) as { userId?: string; relationship?: string; endsAt?: string };
    if (!body.userId || !body.relationship || body.relationship.length > 80) throw new ClinicalBoundaryError('Valid userId and relationship are required', 422, 'ASSIGNMENT_INVALID');
    const assignment = await prisma.$transaction(async (tx) => {
      const patient = await tx.clinicalPatient.findFirst({ where: { id: patientId, practiceId: actor.practiceId } });
      const member = await tx.practiceMembership.findUnique({ where: { practiceId_userId: { practiceId: actor.practiceId, userId: body.userId! } } });
      if (!patient || !member || member.status !== 'ACTIVE' || member.role !== 'THERAPIST') throw new ClinicalBoundaryError('Active therapist and patient must belong to this practice', 422, 'ASSIGNMENT_SCOPE_INVALID');
      const record = await tx.careTeamAssignment.upsert({
        where: { practiceId_patientId_userId_relationship: { practiceId: actor.practiceId, patientId, userId: body.userId!, relationship: body.relationship! } },
        create: { practiceId: actor.practiceId, patientId, userId: body.userId!, relationship: body.relationship!, endsAt: body.endsAt ? new Date(body.endsAt) : null },
        update: { endsAt: body.endsAt ? new Date(body.endsAt) : null },
      });
      await appendAudit(tx, actor, { action: 'CARE_TEAM_ASSIGNED', resourceType: 'CareTeamAssignment', resourceId: record.id, patientId, purposeOfUse: 'TREATMENT', outcome: 'SUCCESS', metadata: { assignedUserId: body.userId, relationship: body.relationship } });
      return record;
    }, { isolationLevel: 'Serializable' });
    return NextResponse.json({ id: assignment.id }, { status: 201 });
  } catch (error) { return clinicalError(error); }
}
