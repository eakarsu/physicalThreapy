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
    const { diagnosis, procedures, sessionNotes } = body;

    const systemPrompt = `You are a medical billing specialist with expertise in physical therapy CPT and ICD-10 codes.

Guidelines:
- Suggest appropriate ICD-10 diagnosis codes
- Suggest appropriate CPT procedure codes for physical therapy
- Provide brief justification for each code
- Consider medical necessity and documentation requirements
- Follow current coding guidelines
- Be conservative - only suggest codes supported by documentation
- Include primary and secondary codes when appropriate
- Do NOT suggest codes without clinical justification`;

    const userPrompt = `Suggest appropriate medical billing codes for:

Diagnosis/Condition:
${diagnosis}

Procedures/Services Performed:
${procedures}

${sessionNotes ? `Session Documentation:\n${sessionNotes}` : ''}

Please provide:
1. Recommended ICD-10 codes (with descriptions)
2. Recommended CPT codes (with descriptions)
3. Brief justification for each code
4. Any documentation tips for medical necessity`;

    const result = await callAI({
      systemPrompt,
      userPrompt,
      temperature: 0.3, // Lower temperature for more consistent coding
      maxTokens: 1500,
    });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    // Parse the response to extract codes
    const text = result.text;
    const icdCodes = extractCodes(text, /\b[A-Z]\d{2}\.?\d*\b/g);
    const cptCodes = extractCodes(text, /\b9[0-9]{4}\b/g);

    return NextResponse.json({
      icdCodes,
      cptCodes,
      fullText: text,
    });
  } catch (error) {
    console.error('Error generating code suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to generate code suggestions' },
      { status: 500 }
    );
  }
}

function extractCodes(text: string, regex: RegExp): string[] {
  const matches = text.match(regex);
  if (!matches) return [];

  // Remove duplicates and return
  return [...new Set(matches)];
}
