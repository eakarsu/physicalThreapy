import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { runtimeUser } from '@/lib/runtime-auth';

function setting(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const bearerUser = await runtimeUser(request.headers.get('authorization'));
  const userId = session?.user?.id || bearerUser?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const prompt = typeof body?.prompt === 'string' ? body.prompt.trim() : '';
    if (!prompt || prompt.length > 4000) {
      return NextResponse.json({ error: 'prompt must contain 1 to 4000 characters' }, { status: 400 });
    }

    const apiKey = setting('OPENROUTER_API_KEY');
    const model = setting('OPENROUTER_MODEL');
    const baseUrl = setting('OPENROUTER_BASE_URL').replace(/\/$/, '');
    const upstream = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXTAUTH_URL || '',
        'X-Title': 'PT Flow Runtime Verification',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: 'Give one concise operational recommendation. Do not provide diagnosis or medical advice.' },
          { role: 'user', content: prompt },
        ],
        max_tokens: 160,
      }),
    });
    if (!upstream.ok) {
      console.error('Runtime AI provider failure', { status: upstream.status });
      return NextResponse.json({ error: 'AI provider unavailable' }, { status: 502 });
    }
    const payload = await upstream.json();
    const content = payload.choices?.[0]?.message?.content?.trim();
    const providerRequestId = typeof payload.id === 'string' ? payload.id.trim() : '';
    const resolvedModel = typeof payload.model === 'string' && payload.model.trim() ? payload.model.trim() : model;
    if (!content || !providerRequestId) {
      return NextResponse.json({ error: 'AI provider returned an incomplete response' }, { status: 502 });
    }

    const receipt = await prisma.aiProviderReceipt.create({
      data: {
        userId,
        prompt,
        content,
        provider: 'openrouter',
        providerRequestId,
        model: resolvedModel,
      },
      select: { id: true, provider: true, providerRequestId: true, model: true, createdAt: true },
    });
    return NextResponse.json({ content, model: resolvedModel, receipt, providerReceipt: receipt });
  } catch (error) {
    console.error('Runtime AI request failed', { name: error instanceof Error ? error.name : 'unknown' });
    return NextResponse.json({ error: 'Runtime AI request failed' }, { status: 500 });
  }
}
