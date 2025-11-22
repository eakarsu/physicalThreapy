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
    console.log('Progress analysis request body:', JSON.stringify(body, null, 2));
    const { patientName, diagnosis, sessionHistory, initialEval, currentStatus } = body;

    const systemPrompt = `You are a physical therapist analyzing patient progress data to provide insights.

Guidelines:
- Identify meaningful trends in ROM, strength, pain, and function
- Highlight areas of improvement and areas needing attention
- Compare current status to baseline/initial evaluation
- Use objective data to support observations
- Be encouraging about progress while being realistic
- Suggest what trends may indicate about recovery trajectory
- Use language appropriate for sharing with patients and families
- Include specific metrics when available
- Keep analysis to 3-4 paragraphs
- Do NOT provide medical advice or change treatment plans
- Focus on data interpretation, not new recommendations`;

    const userPrompt = `Analyze progress for:

Patient: ${patientName}
Diagnosis: ${diagnosis}

Initial Evaluation Findings:
${initialEval}

Current Status:
${currentStatus}

Session History Data:
${sessionHistory}

Please provide:
1. Overall progress summary
2. Key improvements noted
3. Areas requiring continued focus
4. Trends in measurable outcomes
5. Functional gains achieved`;

    console.log('Calling AI with prompts...');
    const result = await callAI({
      systemPrompt,
      userPrompt,
      temperature: 0.6,
      maxTokens: 1500,
    });

    console.log('AI result:', result);

    if (result.error) {
      console.error('AI returned error:', result.error);
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ analysis: result.text });
  } catch (error) {
    console.error('Error generating progress analysis:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { error: 'Failed to generate progress analysis', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
