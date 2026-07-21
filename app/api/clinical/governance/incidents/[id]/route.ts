import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { appendAudit } from '@/lib/clinical/audit';
import { requireClinicalActor, requireRole } from '@/lib/clinical/authorization';
import { clinicalError, limitedJson, requireSameOrigin } from '@/lib/clinical/http';
import { ClinicalBoundaryError } from '@/lib/clinical/types';

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    requireSameOrigin(request);
    const actor = await requireClinicalActor(request.headers.get('x-practice-id'));
    requireRole(actor, ['ADMIN']);
    const { id } = await context.params;
    const body = await limitedJson(request) as { status?: 'CONTAINED' | 'INVESTIGATING' | 'RESOLVED'; containmentNotes?: string; outcome?: string; notificationDueAt?: string | null };
    if (!body.status || (body.containmentNotes?.trim().length ?? 0) < 20 || (body.status === 'RESOLVED' && (body.outcome?.trim().length ?? 0) < 20)) {
      throw new ClinicalBoundaryError('Status and documented containment/outcome are required', 422, 'INCIDENT_UPDATE_INVALID');
    }
    const incident = await prisma.$transaction(async (tx) => {
      const current = await tx.securityIncident.findFirst({ where: { id, practiceId: actor.practiceId } });
      if (!current) throw new ClinicalBoundaryError('Incident not found', 404, 'INCIDENT_NOT_FOUND');
      if (current.status === 'RESOLVED') throw new ClinicalBoundaryError('Resolved incidents are immutable; open a linked follow-up', 409, 'INCIDENT_ALREADY_RESOLVED');
      const updated = await tx.securityIncident.update({ where: { id }, data: { status: body.status, containmentNotes: body.containmentNotes, outcome: body.outcome ?? null, notificationDueAt: body.notificationDueAt ? new Date(body.notificationDueAt) : null, resolvedAt: body.status === 'RESOLVED' ? new Date() : null } });
      await appendAudit(tx, actor, { action: `SECURITY_INCIDENT_${body.status}`, resourceType: 'SecurityIncident', resourceId: id, purposeOfUse: 'SECURITY', outcome: 'SUCCESS', metadata: { notificationDueAt: body.notificationDueAt ?? null } });
      return updated;
    }, { isolationLevel: 'Serializable' });
    return NextResponse.json({ id: incident.id, status: incident.status });
  } catch (error) { return clinicalError(error); }
}
