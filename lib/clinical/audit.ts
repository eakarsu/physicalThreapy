import { createHash } from 'node:crypto';
import type { Prisma } from '@prisma/client';
import type { ClinicalActor } from './types';

function hashEvent(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

export async function appendAudit(
  tx: Prisma.TransactionClient,
  actor: ClinicalActor,
  event: {
    action: string;
    resourceType: string;
    resourceId: string;
    patientId?: string;
    purposeOfUse: string;
    outcome: 'SUCCESS' | 'DENIED' | 'ERROR';
    metadata?: Record<string, unknown>;
  },
) {
  const previous = await tx.auditEvent.findFirst({
    where: { practiceId: actor.practiceId },
    orderBy: { sequence: 'desc' },
    select: { sequence: true, eventHash: true },
  });
  const sequence = (previous?.sequence ?? 0n) + 1n;
  const previousHash = previous?.eventHash ?? 'GENESIS';
  const createdAt = new Date();
  const material = {
    practiceId: actor.practiceId,
    sequence: sequence.toString(),
    actorUserId: actor.userId,
    ...event,
    patientId: event.patientId ?? null,
    metadata: (event.metadata ?? {}) as Prisma.InputJsonValue,
    previousHash,
    createdAt: createdAt.toISOString(),
  };
  return tx.auditEvent.create({
    data: { ...material, sequence, createdAt, eventHash: hashEvent(material) },
  });
}
