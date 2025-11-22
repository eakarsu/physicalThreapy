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
    const { patientInfo, chiefComplaint, observations, previousNotes } = body;

    const systemPrompt = `You are an expert physical therapist assistant helping to generate SOAP notes (Subjective, Objective, Assessment, Plan).

Guidelines:
- Generate professional, clinically accurate SOAP notes
- Use appropriate medical terminology
- Be concise but comprehensive
- Follow standard SOAP note format
- Include measurable objectives when possible
- Maintain HIPAA-compliant language
- Do NOT provide diagnoses - only document observations
- Base recommendations on evidence-based practice`;

    const userPrompt = `Generate a SOAP note for the following patient session:

Patient Information:
${patientInfo}

Chief Complaint/Reason for Visit:
${chiefComplaint}

Observations/Findings:
${observations}

${previousNotes ? `Previous Session Notes:\n${previousNotes}` : ''}

Please generate a complete SOAP note with the following sections:
1. Subjective (S): Patient's reported symptoms, complaints, and functional limitations
2. Objective (O): Measurable findings, ROM, strength, pain levels, functional tests
3. Assessment (A): Clinical interpretation of progress and current status
4. Plan (P): Treatment plan, home exercise program, next session goals`;

    const result = await callAI({
      systemPrompt,
      userPrompt,
      temperature: 0.7,
      maxTokens: 2000,
    });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    // Parse the SOAP note into sections
    const text = result.text;
    const sections = {
      subjective: extractSection(text, 'Subjective', ['S:', 'Subjective:']),
      objective: extractSection(text, 'Objective', ['O:', 'Objective:']),
      assessment: extractSection(text, 'Assessment', ['A:', 'Assessment:']),
      plan: extractSection(text, 'Plan', ['P:', 'Plan:']),
      fullText: text,
    };

    return NextResponse.json(sections);
  } catch (error) {
    console.error('Error generating SOAP note:', error);
    return NextResponse.json(
      { error: 'Failed to generate SOAP note' },
      { status: 500 }
    );
  }
}

function extractSection(text: string, sectionName: string, markers: string[]): string {
  for (const marker of markers) {
    const regex = new RegExp(`${marker}\\s*([\\s\\S]*?)(?=\\n\\s*[SOAP]:|$)`, 'i');
    const match = text.match(regex);
    if (match) {
      return match[1].trim();
    }
  }

  // Fallback: try to find section by name
  const lines = text.split('\n');
  let capturing = false;
  let result = '';

  for (const line of lines) {
    if (line.toLowerCase().includes(sectionName.toLowerCase())) {
      capturing = true;
      continue;
    }
    if (capturing && /^[SOAP]:/i.test(line)) {
      break;
    }
    if (capturing) {
      result += line + '\n';
    }
  }

  return result.trim() || `[Generated ${sectionName} section]`;
}
