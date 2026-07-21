import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { appendAudit } from '@/lib/clinical/audit';
import { requireClinicalActor } from '@/lib/clinical/authorization';
import { clinicalError, limitedJson, requireSameOrigin } from '@/lib/clinical/http';
import { ClinicalBoundaryError } from '@/lib/clinical/types';

export async function POST(request: NextRequest) {
  try {
    requireSameOrigin(request);
    const actor = await requireClinicalActor(request.headers.get('x-practice-id'));
    const body = await limitedJson(request) as { severity?: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL'; summary?: string; affectedResources?: string[] };
    if (!body.severity || (body.summary?.trim().length ?? 0) < 20 || !Array.isArray(body.affectedResources)) throw new ClinicalBoundaryError('Severity, summary, and affected resource IDs are required', 422, 'INCIDENT_INVALID');
    const incident = await prisma.$transaction(async (tx) => {
      const record = await tx.securityIncident.create({ data: { practiceId: actor.practiceId, severity: body.severity!, summary: body.summary!, affectedResources: body.affectedResources!, detectedByUserId: actor.userId } });
      await appendAudit(tx, actor, { action: 'SECURITY_INCIDENT_REPORTED', resourceType: 'SecurityIncident', resourceId: record.id, purposeOfUse: 'SECURITY', outcome: 'SUCCESS', metadata: { severity: body.severity } });
      return record;
    }, { isolationLevel: 'Serializable' });
    return NextResponse.json({ id: incident.id, status: incident.status }, { status: 201 });
  } catch (error) { return clinicalError(error); }
}
