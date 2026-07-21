import bcrypt from 'bcryptjs';
import { PrismaClient, UserRole } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

async function main() {
  if (process.env.BOOTSTRAP_ACKNOWLEDGEMENT !== 'create-initial-admin') {
    throw new Error('Set BOOTSTRAP_ACKNOWLEDGEMENT=create-initial-admin for this one-time operation');
  }

  const databaseUrl = process.env.DATABASE_URL;
  const email = (process.env.PROVISION_ADMIN_EMAIL || process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.PROVISION_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || '';
  const name = (process.env.PROVISION_ADMIN_NAME || 'Administrator').trim();
  if (!databaseUrl || !email || !/^\S+@\S+\.\S+$/.test(email)) throw new Error('DATABASE_URL and a valid administrator email are required');
  if (password.length < 12 || Buffer.byteLength(password) > 72) throw new Error('Administrator password must be 12 to 72 bytes');
  if (!name) throw new Error('Administrator name is required');

  const pool = new Pool({ connectionString: databaseUrl });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
  try {
    if (await prisma.user.findUnique({ where: { email } })) throw new Error('Administrator already exists; refusing to overwrite it');
    const user = await prisma.user.create({
      data: {
        email,
        hashedPassword: await bcrypt.hash(password, 12),
        name,
        role: UserRole.ADMIN,
      },
    });
    console.log(`Provisioned administrator ${user.id}`);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Administrator provisioning failed');
  process.exitCode = 1;
});
