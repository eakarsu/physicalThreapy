import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { callAI, AI_PROMPTS } from '@/lib/ai';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { diagnosis, bodyRegion, goals, equipment } = body;

    if (!diagnosis || !bodyRegion) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const userPrompt = `Create a home exercise program for a patient with the following:

Diagnosis: ${diagnosis}
Body Region: ${bodyRegion}
Goals: ${goals || 'Improve strength, ROM, and function'}
Available Equipment: ${equipment || 'Minimal equipment (resistance bands, household items)'}

Provide 5-7 exercises with:
- Exercise name
- Clear instructions
- Sets and reps
- Frequency (days per week)
- Any safety precautions

Format as a structured list.`;

    const result = await callAI({
      systemPrompt: AI_PROMPTS.exercisePlan,
      userPrompt,
      maxTokens: 1500,
    });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      exercisePlan: result.text,
    });
  } catch (error) {
    console.error('Home plan error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
