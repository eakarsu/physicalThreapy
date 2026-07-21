import type { Prisma } from '@prisma/client';
import { ClinicalBoundaryError, type ClinicalActor } from './types';

export async function assignedUserIds(tx: Prisma.TransactionClient, practiceId: string, patientId: string) {
  const assignments = await tx.careTeamAssignment.findMany({
    where: {
      practiceId,
      patientId,
      startsAt: { lte: new Date() },
      OR: [{ endsAt: null }, { endsAt: { gt: new Date() } }],
    },
    select: { userId: true },
  });
  return assignments.map((assignment) => assignment.userId);
}

export async function requireCareTeamAccess(tx: Prisma.TransactionClient, actor: ClinicalActor, patientId: string) {
  if (actor.role === 'ADMIN' || actor.role === 'STAFF') return;
  if (actor.role === 'PATIENT_PORTAL') {
    if (actor.portalPatientId === patientId) return;
    throw new ClinicalBoundaryError('Patient access denied', 403, 'PATIENT_FORBIDDEN');
  }
  const assignment = await tx.careTeamAssignment.findFirst({
    where: {
      practiceId: actor.practiceId,
      patientId,
      userId: actor.userId,
      startsAt: { lte: new Date() },
      OR: [{ endsAt: null }, { endsAt: { gt: new Date() } }],
    },
  });
  if (!assignment) throw new ClinicalBoundaryError('Care-team assignment required', 403, 'CARE_TEAM_REQUIRED');
}

export async function requireConsent(
  tx: Prisma.TransactionClient,
  practiceId: string,
  patientId: string,
  scopes: Array<'TREATMENT' | 'DATA_USE' | 'EXTERNAL_AI' | 'EXTERNAL_DISCLOSURE'>,
) {
  const now = new Date();
  const consent = await tx.consentRecord.findFirst({
    where: {
      practiceId,
      patientId,
      status: 'ACTIVE',
      verified: true,
      scopes: { hasEvery: scopes },
      effectiveFrom: { lte: now },
      OR: [{ effectiveUntil: null }, { effectiveUntil: { gt: now } }],
    },
    orderBy: { effectiveFrom: 'desc' },
  });
  if (!consent) throw new ClinicalBoundaryError('Active verified consent does not cover this purpose', 403, 'CONSENT_REQUIRED');
  return consent;
}
