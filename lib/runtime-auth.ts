import { createHmac, timingSafeEqual } from 'node:crypto';
import { prisma } from './prisma';
type RuntimeClaims = { sub: string; email: string; exp: number };
const signature = (body: string) => createHmac('sha256', process.env.NEXTAUTH_SECRET || '').update(body).digest('base64url');
export function issueRuntimeToken(user: { id: string; email: string }) {
  const body = Buffer.from(JSON.stringify({ sub: user.id, email: user.email, exp: Date.now() + 8 * 60 * 60 * 1000 })).toString('base64url');
  return `${body}.${signature(body)}`;
}
export async function runtimeUser(authorization: string | null) {
  const [body, supplied] = String(authorization || '').replace(/^Bearer\s+/i, '').split('.');
  if (!body || !supplied) return null;
  const expected = Buffer.from(signature(body)); const actual = Buffer.from(supplied);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  const claims = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as RuntimeClaims;
  if (!claims.sub || claims.exp <= Date.now()) return null;
  const user = await prisma.user.findUnique({ where: { id: claims.sub }, select: { id: true, email: true, name: true, role: true } });
  return user && user.email === claims.email ? user : null;
}
