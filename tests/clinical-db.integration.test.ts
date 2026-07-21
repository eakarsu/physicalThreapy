import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import test from 'node:test';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { appendAudit } from '../lib/clinical/audit';
import { encryptJson } from '../lib/clinical/crypto';
import { requireConsent } from '../lib/clinical/policy';

const databaseUrl = process.env.TEST_DATABASE_URL;

test('database enforces tenant boundaries, consent, and immutable chained evidence', { skip: !databaseUrl }, async () => {
  process.env.PHI_ENCRYPTION_KEY = randomBytes(32).toString('base64');
  process.env.PHI_ENCRYPTION_KEY_ID = 'integration-v1';
  const pool = new Pool({ connectionString: databaseUrl });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
  const suffix = randomUUID();
  const practiceA = await prisma.practice.create({ data: { name: `Integration A ${suffix}` } });
  const practiceB = await prisma.practice.create({ data: { name: `Integration B ${suffix}` } });
  const patientId = randomUUID();
  const encrypted = encryptJson({ name: 'Synthetic only' }, `${practiceA.id}:${patientId}:demographics`);
  await prisma.clinicalPatient.create({
    data: { id: patientId, practiceId: practiceA.id, identityState: 'VERIFIED', encryptedDemographics: encrypted.ciphertext, encryptionKeyId: encrypted.keyId, payloadHash: encrypted.hash, sourceSystem: 'urn:test' },
  });

  await assert.rejects(
    prisma.patientIdentifier.create({ data: { practiceId: practiceB.id, patientId, system: 'urn:test:mrn', valueHash: 'hash', lastFour: '0001' } }),
    /cross-practice clinical reference rejected/,
  );

  await prisma.consentRecord.create({
    data: { practiceId: practiceA.id, patientId, status: 'ACTIVE', scopes: ['TREATMENT', 'DATA_USE'], policyUri: 'urn:test:policy', sourceSystem: 'urn:test', sourceHash: 'source-hash', effectiveFrom: new Date(Date.now() - 60_000), effectiveUntil: new Date(Date.now() + 60_000), verified: true },
  });
  await prisma.$transaction(async (tx) => {
    const consent = await requireConsent(tx, practiceA.id, patientId, ['TREATMENT', 'DATA_USE']);
    assert.equal(consent.verified, true);
    const actor = { userId: `actor-${suffix}`, practiceId: practiceA.id, role: 'THERAPIST' as const, portalPatientId: null };
    await appendAudit(tx, actor, { action: 'INTEGRATION_ONE', resourceType: 'ClinicalPatient', resourceId: patientId, patientId, purposeOfUse: 'TREATMENT', outcome: 'SUCCESS' });
    await appendAudit(tx, actor, { action: 'INTEGRATION_TWO', resourceType: 'ClinicalPatient', resourceId: patientId, patientId, purposeOfUse: 'TREATMENT', outcome: 'SUCCESS' });
  }, { isolationLevel: 'Serializable' });
  const events = await prisma.auditEvent.findMany({ where: { practiceId: practiceA.id }, orderBy: { sequence: 'asc' } });
  assert.deepEqual(events.map((event) => event.sequence), [1n, 2n]);
  assert.equal(events[1].previousHash, events[0].eventHash);
  await assert.rejects(prisma.auditEvent.update({ where: { id: events[0].id }, data: { outcome: 'ALTERED' } }), /immutable evidence table/);
  await prisma.$disconnect();
  await pool.end();
});
