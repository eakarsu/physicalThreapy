import assert from 'node:assert/strict';
import test from 'node:test';
import { screenClinicalDraft, validateIndependentReview } from '../lib/clinical/safety';

const complete = { content: 'Continue the clinician-authored gait assessment.', sourceResourceIds: ['Observation/o-1'], authorAttestation: true, indications: ['gait impairment'], contraindications: ['none documented after evaluation'], confidence: 0.94 };

test('complete non-red-flag draft waits for clinician review', () => {
  assert.deepEqual(screenClinicalDraft(complete), { missingData: [], safetyFlags: [], risk: 'MODERATE', status: 'PENDING_REVIEW' });
});

test('high-risk cardiopulmonary language always escalates', () => {
  const result = screenClinicalDraft({ ...complete, content: 'Patient reports chest pain and shortness of breath at rest.' });
  assert.equal(result.status, 'ESCALATED');
  assert.equal(result.risk, 'CRITICAL');
  assert.ok(result.safetyFlags.includes('CARDIOPULMONARY_EMERGENCY'));
});

test('cauda equina and post-operative infection language escalates', () => {
  assert.ok(screenClinicalDraft({ ...complete, content: 'New saddle anesthesia and loss of bladder control.' }).safetyFlags.includes('CAUDA_EQUINA_CONCERN'));
  assert.ok(screenClinicalDraft({ ...complete, content: 'Post-op wound has fever and red streak.' }).safetyFlags.includes('POST_OPERATIVE_INFECTION'));
});

test('missing-data and low-confidence scenarios cannot silently proceed', () => {
  const result = screenClinicalDraft({ content: 'Handoff note', confidence: 0.4 });
  assert.equal(result.status, 'ESCALATED');
  assert.ok(result.missingData.includes('sourceResourceIds'));
  assert.ok(result.safetyFlags.includes('LOW_CONFIDENCE'));
});

test('creator self-review and unresolved escalation approval are denied', () => {
  assert.equal(validateIndependentReview({ creatorUserId: 'a', reviewerUserId: 'a', status: 'PENDING_REVIEW', safetyFlags: [], missingData: [], decision: 'APPROVE' }).code, 'INDEPENDENT_REVIEW_REQUIRED');
  assert.equal(validateIndependentReview({ creatorUserId: 'a', reviewerUserId: 'b', status: 'ESCALATED', safetyFlags: ['LOW_CONFIDENCE'], missingData: [], decision: 'APPROVE' }).code, 'SAFETY_ESCALATION_UNRESOLVED');
  assert.equal(validateIndependentReview({ creatorUserId: 'a', reviewerUserId: 'b', status: 'PENDING_REVIEW', safetyFlags: [], missingData: [], decision: 'APPROVE' }).allowed, true);
});
