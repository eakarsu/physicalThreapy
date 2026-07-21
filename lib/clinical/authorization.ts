import type { UserRole } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ClinicalBoundaryError, type ClinicalActor } from './types';

export const PATIENT_FIELD_PROJECTIONS: Record<UserRole, readonly string[]> = {
  ADMIN: ['id', 'identityState', 'sourceSystem', 'createdAt'],
  THERAPIST: ['id', 'identityState', 'demographics', 'sourceSystem', 'consentStatus', 'careArtifacts'],
  STAFF: ['id', 'identityState', 'demographics.name', 'demographics.birthDate', 'demographics.telecom'],
  PATIENT_PORTAL: ['id', 'demographics', 'approvedCareArtifacts'],
};

export async function requireClinicalActor(practiceId: string | null): Promise<ClinicalActor> {
  const session = await getServerSession(authOptions);
  if (!session) throw new ClinicalBoundaryError('Authentication required', 401, 'UNAUTHENTICATED');
  if (!practiceId) throw new ClinicalBoundaryError('X-Practice-ID is required', 400, 'PRACTICE_REQUIRED');
  const membership = await prisma.practiceMembership.findUnique({
    where: { practiceId_userId: { practiceId, userId: session.user.id } },
  });
  if (!membership || membership.status !== 'ACTIVE') {
    throw new ClinicalBoundaryError('Practice access denied', 403, 'PRACTICE_FORBIDDEN');
  }
  return { userId: session.user.id, practiceId, role: membership.role, portalPatientId: membership.portalPatientId };
}

export function requireRole(actor: ClinicalActor, allowed: UserRole[]): void {
  if (!allowed.includes(actor.role)) throw new ClinicalBoundaryError('Role is not permitted', 403, 'ROLE_FORBIDDEN');
}

export function canAccessPatient(actor: ClinicalActor, patientId: string, assignedUserIds: string[]): boolean {
  if (actor.role === 'ADMIN' || actor.role === 'STAFF') return true;
  if (actor.role === 'PATIENT_PORTAL') return actor.portalPatientId === patientId;
  return assignedUserIds.includes(actor.userId);
}

export function projectPatientFields(actor: ClinicalActor, demographics: Record<string, unknown>, approvedArtifacts: unknown[]) {
  if (actor.role === 'ADMIN') return {};
  if (actor.role === 'STAFF') {
    return { name: demographics.name, birthDate: demographics.birthDate, telecom: demographics.telecom };
  }
  if (actor.role === 'PATIENT_PORTAL') return { demographics, approvedArtifacts };
  return { demographics, approvedArtifacts };
}
