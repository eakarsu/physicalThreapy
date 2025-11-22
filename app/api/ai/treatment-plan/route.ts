import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { callAI } from '@/lib/ai';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { diagnosis, currentStatus, goals, limitations, sessionHistory } = body;

    const systemPrompt = `You are an expert physical therapist creating evidence-based treatment plans.

Guidelines:
- Recommend specific, evidence-based interventions
- Consider patient's functional goals and limitations
- Progress exercises appropriately
- Include frequency, sets, reps, and progressions
- Suggest manual therapy techniques when appropriate
- Include patient education topics
- Consider home exercise program
- Reference clinical guidelines when applicable
- Do NOT diagnose - work within provided diagnosis
- Ensure recommendations are safe and appropriate`;

    const userPrompt = `Create a treatment plan recommendation for:

Diagnosis/Primary Condition:
${diagnosis}

Current Status:
${currentStatus}

Patient Goals:
${goals}

Limitations/Precautions:
${limitations}

${sessionHistory ? `Recent Session History:\n${sessionHistory}` : ''}

Please provide:
1. Short-term goals (2-4 weeks)
2. Long-term goals (6-12 weeks)
3. Recommended interventions and exercises
4. Home exercise program
5. Frequency and duration of treatment
6. Special considerations or precautions`;

    const result = await callAI({
      systemPrompt,
      userPrompt,
      temperature: 0.7,
      maxTokens: 2500,
    });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ recommendation: result.text });
  } catch (error) {
    console.error('Error generating treatment plan:', error);
    return NextResponse.json(
      { error: 'Failed to generate treatment plan' },
      { status: 500 }
    );
  }
}
