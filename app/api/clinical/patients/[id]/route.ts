import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { appendAudit } from '@/lib/clinical/audit';
import { projectPatientFields, requireClinicalActor } from '@/lib/clinical/authorization';
import { decryptJson } from '@/lib/clinical/crypto';
import { clinicalError } from '@/lib/clinical/http';
import { requireCareTeamAccess } from '@/lib/clinical/policy';
import { ClinicalBoundaryError } from '@/lib/clinical/types';

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireClinicalActor(request.headers.get('x-practice-id'));
    const { id } = await context.params;
    const result = await prisma.$transaction(async (tx) => {
      const patient = await tx.clinicalPatient.findFirst({
        where: { id, practiceId: actor.practiceId },
        include: {
          careTeam: { where: { OR: [{ endsAt: null }, { endsAt: { gt: new Date() } }] }, select: { userId: true } },
          consents: { select: { status: true, scopes: true, effectiveUntil: true } },
          artifacts: { where: { status: 'APPROVED' }, select: { id: true, artifactType: true, approvedAt: true } },
        },
      });
      if (!patient) throw new ClinicalBoundaryError('Patient not found', 404, 'PATIENT_NOT_FOUND');
      await requireCareTeamAccess(tx, actor, id);
      const demographics = decryptJson<Record<string, unknown>>(patient.encryptedDemographics, `${actor.practiceId}:${id}:demographics`);
      const fields = projectPatientFields(actor, demographics, patient.artifacts);
      await appendAudit(tx, actor, { action: 'PATIENT_READ', resourceType: 'ClinicalPatient', resourceId: id, patientId: id, purposeOfUse: request.headers.get('x-purpose-of-use') ?? 'TREATMENT', outcome: 'SUCCESS', metadata: { projectionRole: actor.role } });
      return { id, identityState: patient.identityState, ...fields };
    }, { isolationLevel: 'Serializable' });
    return NextResponse.json(result);
  } catch (error) { return clinicalError(error); }
}
