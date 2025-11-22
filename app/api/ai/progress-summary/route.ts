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
    const { patient, metrics } = body;

    if (!patient || !metrics || metrics.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Group metrics by type
    const metricsByType: Record<string, any[]> = {};
    metrics.forEach((metric: any) => {
      const key = `${metric.type}: ${metric.label}`;
      if (!metricsByType[key]) {
        metricsByType[key] = [];
      }
      metricsByType[key].push(metric);
    });

    // Build context
    const metricsText = Object.entries(metricsByType)
      .map(([label, values]) => {
        const sorted = values.sort(
          (a, b) =>
            new Date(a.measuredAt).getTime() - new Date(b.measuredAt).getTime()
        );
        const dataPoints = sorted.map(
          (m) =>
            `${new Date(m.measuredAt).toLocaleDateString()}: ${m.valueNumeric} ${m.unit}`
        );
        return `${label}:\n${dataPoints.join('\n')}`;
      })
      .join('\n\n');

    const userPrompt = `Analyze the progress for this patient:

Patient: ${patient.firstName} ${patient.lastName}
Diagnosis: ${patient.primaryDiagnosis}

Progress Data:
${metricsText}

Provide a patient-friendly summary (2-3 paragraphs) that:
1. Highlights key trends and improvements
2. Explains what the data means for their recovery
3. Is encouraging while being honest about progress`;

    const result = await callAI({
      systemPrompt: AI_PROMPTS.progressSummary,
      userPrompt,
      maxTokens: 1000,
    });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      progressSummary: result.text,
    });
  } catch (error) {
    console.error('Progress summary error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
