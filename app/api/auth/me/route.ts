import { NextRequest, NextResponse } from 'next/server';
import { runtimeUser } from '@/lib/runtime-auth';
export async function GET(request: NextRequest) {
  const user = await runtimeUser(request.headers.get('authorization'));
  return user ? NextResponse.json(user) : NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
