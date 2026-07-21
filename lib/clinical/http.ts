import { NextResponse } from 'next/server';
import { ClinicalBoundaryError } from './types';

export function clinicalError(error: unknown) {
  if (error instanceof ClinicalBoundaryError) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
  }
  console.error('Controlled clinical workflow error', error instanceof Error ? error.name : 'unknown');
  return NextResponse.json({ error: 'Controlled workflow failed', code: 'INTERNAL_ERROR' }, { status: 500 });
}

export async function limitedJson(request: Request, limit = 256_000): Promise<unknown> {
  const declaredLength = Number(request.headers.get('content-length') ?? '0');
  if (declaredLength > limit) throw new ClinicalBoundaryError('Request body is too large', 413, 'BODY_TOO_LARGE');
  const raw = await request.text();
  if (Buffer.byteLength(raw) > limit) throw new ClinicalBoundaryError('Request body is too large', 413, 'BODY_TOO_LARGE');
  try {
    return JSON.parse(raw);
  } catch {
    throw new ClinicalBoundaryError('Request body must be valid JSON', 400, 'INVALID_JSON');
  }
}

export function requireSameOrigin(request: Request): void {
  const configured = process.env.NEXTAUTH_URL;
  if (!configured) throw new ClinicalBoundaryError('Application origin is not configured', 503, 'ORIGIN_NOT_CONFIGURED');
  const expected = new URL(configured).origin;
  if (request.headers.get('origin') !== expected) {
    throw new ClinicalBoundaryError('Mutation origin is not allowed', 403, 'ORIGIN_FORBIDDEN');
  }
}
