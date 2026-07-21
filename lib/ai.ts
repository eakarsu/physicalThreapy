/**
 * OpenRouter AI Client
 * Provides a unified interface for AI-powered features in PT Flow AI
 */


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
  systemPrompt: _systemPrompt,
  userPrompt: _userPrompt,
  model: _model,
  temperature: _temperature,
  maxTokens: _maxTokens,
}: AIRequest): Promise<AIResponse> {
  // Kept as a compatibility boundary for the legacy UI. No clinical or billing
  // content is sent to an external model. Any future provider integration must
  // enforce tenant access, explicit EXTERNAL_AI consent, a BAA/DPA, provenance,
  // safety screening, and independent clinician approval before this changes.
  return {
    text: '',
    error: 'Legacy AI generation is disabled by the controlled clinical-data boundary',
  };
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
