import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { issueRuntimeToken } from '@/lib/runtime-auth';
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const email = String(body.email || '').trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(String(body.password || ''), user.hashedPassword))) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  return NextResponse.json({ token: issueRuntimeToken(user), user: { id: user.id, email: user.email, name: user.name, role: user.role } });
}
