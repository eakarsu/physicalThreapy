/**
 * OpenRouter AI Client
 * Provides a unified interface for AI-powered features in PT Flow AI
 */

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-haiku';
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

if (!OPENROUTER_API_KEY) {
  console.warn('⚠️  OPENROUTER_API_KEY is not set. AI features will not work.');
}

export interface AIRequest {
  systemPrompt: string;
  userPrompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AIResponse {
  text: string;
  error?: string;
}

/**
 * Call OpenRouter API with system and user prompts
 */
export async function callAI({
  systemPrompt,
  userPrompt,
  model = OPENROUTER_MODEL,
  temperature = 0.7,
  maxTokens = 2000,
}: AIRequest): Promise<AIResponse> {
  if (!OPENROUTER_API_KEY) {
    return {
      text: '',
      error: 'OpenRouter API key not configured',
    };
  }

  try {
    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': process.env.NEXTAUTH_URL || 'http://localhost:3000',
        'X-Title': 'PT Flow AI',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature,
        max_tokens: maxTokens,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API error:', errorText);

      // Check for specific error messages
      if (errorText.includes('All providers have been ignored')) {
        return {
          text: '',
          error: 'OpenRouter account configuration error: All AI providers are disabled. Please visit https://openrouter.ai/settings/preferences to enable at least one provider (e.g., Anthropic/Claude).',
        };
      }

      return {
        text: '',
        error: `API request failed: ${response.status} ${response.statusText}`,
      };
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '';

    return { text };
  } catch (error) {
    console.error('AI call error:', error);
    return {
      text: '',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * System prompts for different AI features
 */
export const AI_PROMPTS = {
  sessionSummary: `You are a physical therapy documentation assistant. Your role is to analyze session notes and create clear, professional summaries.

Guidelines:
- Be concise and clinically accurate
- Use appropriate medical terminology
- Highlight key findings and progress
- Do NOT provide medical advice or diagnosis
- Maintain HIPAA-compliant language
- Focus on objective observations`,

  sessionSummaryPatientFriendly: `You are a physical therapy assistant helping patients understand their treatment.

Guidelines:
- Use simple, everyday language (avoid medical jargon)
- Be encouraging and positive while being honest
- Explain what exercises do and why they help
- Keep it brief (2-3 short paragraphs)
- Do NOT provide medical advice
- Focus on progress and next steps`,

  exercisePlan: `You are a licensed physical therapist creating home exercise programs.

Guidelines:
- Recommend evidence-based exercises appropriate for the condition
- Specify sets, reps, frequency clearly
- Progress from easier to harder exercises
- Include safety precautions and contraindications
- Consider available equipment
- Format as a structured list with clear instructions
- Do NOT diagnose or replace professional evaluation`,

  progressSummary: `You are a physical therapy assistant analyzing patient progress data.

Guidelines:
- Identify trends in ROM, strength, pain, and function
- Highlight improvements and areas needing attention
- Use simple language patients can understand
- Be objective about data while being encouraging
- Suggest what trends mean for recovery
- Keep summary to 2-3 paragraphs
- Do NOT provide medical advice or change treatment plans`,

  claimJustification: `You are a medical billing specialist creating insurance claim justifications.

Guidelines:
- Use professional, clinical language
- Clearly state medical necessity
- Reference objective findings and functional limitations
- Cite CPT and ICD codes appropriately
- Be specific about skilled services provided
- Follow Medicare documentation standards
- Keep to 2-3 paragraphs
- Do NOT fabricate or exaggerate findings`,
};
