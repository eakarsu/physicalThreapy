import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { appendAudit } from '../lib/clinical/audit';

async function main() {
  if (process.env.ALLOW_PRACTICE_PROVISION !== 'YES') throw new Error('Set ALLOW_PRACTICE_PROVISION=YES for this one-time operation');
  const databaseUrl = process.env.DATABASE_URL;
  const name = process.env.PROVISION_PRACTICE_NAME?.trim();
  const email = process.env.PROVISION_ADMIN_EMAIL?.trim().toLowerCase();
  const retainDays = Number(process.env.PROVISION_ARTIFACT_RETENTION_DAYS);
  if (!databaseUrl || !name || !email || !Number.isInteger(retainDays) || retainDays < 1 || retainDays > 36_500) {
    throw new Error('DATABASE_URL, practice/admin values, and retention days (1-36500) are required');
  }
  const pool = new Pool({ connectionString: databaseUrl });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
  try {
    const admin = await prisma.user.findUnique({ where: { email } });
    if (!admin || admin.role !== 'ADMIN') throw new Error('An existing ADMIN user with the exact email is required');
    const practice = await prisma.$transaction(async (tx) => {
      const record = await tx.practice.create({ data: { name } });
      await tx.practiceMembership.create({ data: { practiceId: record.id, userId: admin.id, role: 'ADMIN' } });
      await tx.retentionPolicy.create({ data: { practiceId: record.id, recordType: 'ClinicalArtifact', retainDays, approvedBy: admin.id } });
      await appendAudit(tx, { userId: admin.id, practiceId: record.id, role: 'ADMIN', portalPatientId: null }, { action: 'PRACTICE_PROVISIONED', resourceType: 'Practice', resourceId: record.id, purposeOfUse: 'HEALTHCARE_OPERATIONS', outcome: 'SUCCESS', metadata: { retentionDays: retainDays } });
      return record;
    }, { isolationLevel: 'Serializable' });
    console.log(`Provisioned practice ${practice.id} for admin ${admin.id}; store the practice ID securely.`);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Practice provisioning failed');
  process.exitCode = 1;
});
