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
    const { sessionNote, patient, exercises } = body;

    if (!sessionNote || !patient) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Build context for AI
    const context = `
Patient: ${patient.firstName} ${patient.lastName}, ${patient.primaryDiagnosis}

SOAP Note:
Subjective: ${sessionNote.subjective}
Objective: ${sessionNote.objective}
Assessment: ${sessionNote.assessment}
Plan: ${sessionNote.plan}

Exercises Performed:
${exercises?.map((ex: any) => `- ${ex.exercise.name}: ${ex.sets} sets x ${ex.reps} reps, Pain: ${ex.painScore}/10${ex.comments ? ` (${ex.comments})` : ''}`).join('\n') || 'None documented'}
`;

    // Generate clinical summary
    const clinicalResult = await callAI({
      systemPrompt: AI_PROMPTS.sessionSummary,
      userPrompt: `Summarize this PT session in 2-3 concise paragraphs for clinical documentation:\n\n${context}`,
    });

    if (clinicalResult.error) {
      return NextResponse.json(
        { error: clinicalResult.error },
        { status: 500 }
      );
    }

    // Generate patient-friendly summary
    const patientResult = await callAI({
      systemPrompt: AI_PROMPTS.sessionSummaryPatientFriendly,
      userPrompt: `Explain this PT session in simple language for the patient:\n\n${context}`,
    });

    return NextResponse.json({
      clinicalSummary: clinicalResult.text,
      patientFriendlySummary: patientResult.text,
    });
  } catch (error) {
    console.error('Session summary error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
