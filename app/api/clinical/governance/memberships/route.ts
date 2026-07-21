import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { appendAudit } from '@/lib/clinical/audit';
import { requireClinicalActor, requireRole } from '@/lib/clinical/authorization';
import { clinicalError, limitedJson, requireSameOrigin } from '@/lib/clinical/http';
import { ClinicalBoundaryError } from '@/lib/clinical/types';

export async function POST(request: NextRequest) {
  try {
    requireSameOrigin(request);
    const actor = await requireClinicalActor(request.headers.get('x-practice-id'));
    requireRole(actor, ['ADMIN']);
    const body = await limitedJson(request) as { userId?: string; role?: 'ADMIN' | 'THERAPIST' | 'STAFF' | 'PATIENT_PORTAL'; portalPatientId?: string | null };
    if (!body.userId || !body.role || (body.role === 'PATIENT_PORTAL') !== Boolean(body.portalPatientId)) {
      throw new ClinicalBoundaryError('User, role, and role-appropriate portal patient are required', 422, 'MEMBERSHIP_INVALID');
    }
    const membership = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: body.userId } });
      if (!user || user.role !== body.role) throw new ClinicalBoundaryError('User account role does not match requested membership role', 422, 'MEMBERSHIP_ROLE_MISMATCH');
      if (body.portalPatientId) {
        const patient = await tx.clinicalPatient.findFirst({ where: { id: body.portalPatientId, practiceId: actor.practiceId, identityState: 'VERIFIED' } });
        if (!patient) throw new ClinicalBoundaryError('Verified portal patient was not found in this practice', 422, 'PORTAL_PATIENT_INVALID');
      }
      const record = await tx.practiceMembership.upsert({
        where: { practiceId_userId: { practiceId: actor.practiceId, userId: body.userId! } },
        create: { practiceId: actor.practiceId, userId: body.userId!, role: body.role!, portalPatientId: body.portalPatientId ?? null },
        update: { role: body.role!, portalPatientId: body.portalPatientId ?? null, status: 'ACTIVE' },
      });
      await appendAudit(tx, actor, { action: 'PRACTICE_MEMBERSHIP_SET', resourceType: 'PracticeMembership', resourceId: record.id, purposeOfUse: 'HEALTHCARE_OPERATIONS', outcome: 'SUCCESS', metadata: { memberUserId: body.userId, role: body.role } });
      return record;
    }, { isolationLevel: 'Serializable' });
    return NextResponse.json({ id: membership.id, role: membership.role }, { status: 201 });
  } catch (error) { return clinicalError(error); }
}
