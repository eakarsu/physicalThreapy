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
    const { patientMessage, patientContext, messageHistory, responseType } = body;

    const systemPrompt = `You are a helpful physical therapy office assistant drafting patient message responses.

Guidelines:
- Be professional, empathetic, and clear
- Use patient-friendly language (avoid complex medical jargon)
- Be concise - keep responses brief and to the point
- Maintain appropriate boundaries (do NOT provide medical advice)
- Suggest scheduling appointments when appropriate
- Include relevant contact information or next steps
- Be encouraging and supportive
- Reference clinic policies when relevant
- Always remind patients to contact their provider for urgent concerns`;

    const responseTypes = {
      general: 'a general informational response',
      appointment: 'a response regarding appointment scheduling or changes',
      billing: 'a response regarding billing or insurance questions',
      clinical: 'a response that acknowledges their concern and suggests contacting their therapist',
    };

    const userPrompt = `Draft ${responseTypes[responseType as keyof typeof responseTypes] || 'a response'} to the following patient message:

Patient Name/Context:
${patientContext}

Patient Message:
${patientMessage}

${messageHistory ? `Previous Message History:\n${messageHistory}` : ''}

Please provide 2-3 response options with different tones:
1. Professional and brief
2. Warm and detailed
3. Concise with action items

Format each response clearly labeled.`;

    const result = await callAI({
      systemPrompt,
      userPrompt,
      temperature: 0.8,
      maxTokens: 1200,
    });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ suggestions: result.text });
  } catch (error) {
    console.error('Error generating message response:', error);
    return NextResponse.json(
      { error: 'Failed to generate message response' },
      { status: 500 }
    );
  }
}
