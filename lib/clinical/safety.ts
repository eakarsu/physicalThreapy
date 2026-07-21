export type SafetyInput = {
  content: string;
  sourceResourceIds?: string[];
  authorAttestation?: boolean;
  indications?: string[];
  contraindications?: string[];
  confidence?: number;
};

const RED_FLAGS: Array<[string, RegExp]> = [
  ['CARDIOPULMONARY_EMERGENCY', /\b(chest pain|difficulty breathing|shortness of breath at rest|fainted|syncope)\b/i],
  ['NEUROLOGIC_EMERGENCY', /\b(new|sudden|worsening)\s+(weakness|numbness|paralysis)\b/i],
  ['CAUDA_EQUINA_CONCERN', /\b(saddle anesthesia|loss of bowel|loss of bladder|bowel or bladder dysfunction)\b/i],
  ['POST_OPERATIVE_INFECTION', /\b(fever|pus|drainage|red streak)\b.*\b(surgery|incision|wound|post-?op)\b|\b(surgery|incision|wound|post-?op)\b.*\b(fever|pus|drainage|red streak)\b/i],
  ['TRAUMA_HEAD_INJURY', /\b(fall|collision|trauma)\b.*\b(head injury|loss of consciousness|confusion|vomiting)\b/i],
];

export function screenClinicalDraft(input: SafetyInput) {
  const missingData: string[] = [];
  if (!input.content?.trim()) missingData.push('content');
  if (!input.sourceResourceIds?.length) missingData.push('sourceResourceIds');
  if (!input.authorAttestation) missingData.push('authorAttestation');
  if (!input.indications?.length) missingData.push('indications');
  if (!input.contraindications?.length) missingData.push('contraindications');
  if (typeof input.confidence !== 'number' || input.confidence < 0 || input.confidence > 1) missingData.push('confidence');

  const safetyFlags = RED_FLAGS.filter(([, pattern]) => pattern.test(input.content ?? '')).map(([code]) => code);
  const uncertain = typeof input.confidence === 'number' && input.confidence < 0.8;
  if (uncertain) safetyFlags.push('LOW_CONFIDENCE');

  const risk = safetyFlags.some((flag) => flag !== 'LOW_CONFIDENCE')
    ? 'CRITICAL'
    : missingData.length || uncertain
      ? 'HIGH'
      : 'MODERATE';
  return {
    missingData,
    safetyFlags,
    risk: risk as 'MODERATE' | 'HIGH' | 'CRITICAL',
    status: risk === 'MODERATE' ? 'PENDING_REVIEW' as const : 'ESCALATED' as const,
  };
}

export function validateIndependentReview(input: {
  creatorUserId: string;
  reviewerUserId: string;
  status: string;
  safetyFlags: string[];
  missingData: string[];
  decision: string;
}): { allowed: boolean; code?: string } {
  if (input.creatorUserId === input.reviewerUserId) return { allowed: false, code: 'INDEPENDENT_REVIEW_REQUIRED' };
  if (!['PENDING_REVIEW', 'ESCALATED'].includes(input.status)) return { allowed: false, code: 'ARTIFACT_NOT_REVIEWABLE' };
  if (input.decision === 'APPROVE' && (input.status === 'ESCALATED' || input.safetyFlags.length || input.missingData.length)) {
    return { allowed: false, code: 'SAFETY_ESCALATION_UNRESOLVED' };
  }
  return { allowed: true };
}
