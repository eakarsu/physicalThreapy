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
    console.log('Claim justification request:', JSON.stringify(body, null, 2));

    // Support both old format (claim, patient) and new format (diagnosis, cptCodes, etc)
    let diagnosis, cptCodes, icdCodes, functionalLimitations, sessionNotes;

    if (body.claim && body.patient) {
      // Old format
      const { claim, patient } = body;
      diagnosis = patient.primaryDiagnosis;
      cptCodes = Array.isArray(claim.cptCodes) ? claim.cptCodes.join(', ') : claim.cptCodes;
      icdCodes = Array.isArray(claim.icdCodes) ? claim.icdCodes.join(', ') : claim.icdCodes;
      functionalLimitations = patient.medicalHistory || 'Not specified';
      sessionNotes = body.sessionNotes;
    } else {
      // New format
      diagnosis = body.diagnosis;
      cptCodes = body.cptCodes;
      icdCodes = body.icdCodes;
      functionalLimitations = body.functionalLimitations || 'Not specified';
      sessionNotes = body.sessionNotes || '';
    }

    console.log('Extracted values:', { diagnosis, cptCodes, icdCodes, functionalLimitations });

    if (!diagnosis || !cptCodes || !icdCodes) {
      console.error('Missing required fields:', { diagnosis, cptCodes, icdCodes });
      return NextResponse.json(
        { error: 'Missing required fields: diagnosis, cptCodes, icdCodes', received: { diagnosis, cptCodes, icdCodes } },
        { status: 400 }
      );
    }

    const userPrompt = `Create a medical necessity justification for this insurance claim:

Diagnosis: ${diagnosis}
CPT Codes: ${cptCodes}
ICD-10 Codes: ${icdCodes}
Functional Limitations: ${functionalLimitations}

${sessionNotes ? `Session Documentation:\n${sessionNotes}` : ''}

Write a professional 2-3 paragraph justification explaining:
1. Medical necessity of skilled PT services
2. Functional limitations requiring intervention
3. Expected outcomes from treatment

Use professional billing language suitable for insurance review.`;

    const result = await callAI({
      systemPrompt: AI_PROMPTS.claimJustification,
      userPrompt,
      maxTokens: 800,
      temperature: 0.5, // Lower temperature for more consistent professional output
    });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      justification: result.text,
    });
  } catch (error) {
    console.error('Claim justification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
