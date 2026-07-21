import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import test from 'node:test';
import { canAccessPatient, projectPatientFields } from '../lib/clinical/authorization';
import { decryptJson, encryptJson, hashIdentifier } from '../lib/clinical/crypto';
import { requireSameOrigin } from '../lib/clinical/http';

test.beforeEach(() => {
  process.env.PHI_ENCRYPTION_KEY = randomBytes(32).toString('base64');
  process.env.PHI_ENCRYPTION_KEY_ID = 'test-v1';
  process.env.IDENTITY_HASH_KEY = 'test-only-identity-key-that-is-long-enough';
});

test('AES-256-GCM round trip binds ciphertext to tenant and record AAD', () => {
  const encrypted = encryptJson({ name: 'Sensitive Example' }, 'practice-a:patient-a:demographics');
  assert.equal(decryptJson<{ name: string }>(encrypted.ciphertext, 'practice-a:patient-a:demographics').name, 'Sensitive Example');
  assert.throws(() => decryptJson(encrypted.ciphertext, 'practice-b:patient-a:demographics'));
  assert.equal(encrypted.ciphertext.includes('Sensitive Example'), false);
});

test('identifier hashing is deterministic but does not retain plaintext', () => {
  const hash = hashIdentifier('urn:mrn', 'MRN-1234');
  assert.equal(hash, hashIdentifier('urn:mrn', 'MRN-1234'));
  assert.equal(hash.includes('MRN-1234'), false);
});

test('therapists and portal users are limited to assigned patients', () => {
  const therapist = { userId: 't-1', practiceId: 'practice-a', role: 'THERAPIST' as const, portalPatientId: null };
  const portal = { userId: 'u-1', practiceId: 'practice-a', role: 'PATIENT_PORTAL' as const, portalPatientId: 'p-1' };
  assert.equal(canAccessPatient(therapist, 'p-1', ['t-1']), true);
  assert.equal(canAccessPatient(therapist, 'p-2', ['t-2']), false);
  assert.equal(canAccessPatient(portal, 'p-1', []), true);
  assert.equal(canAccessPatient(portal, 'p-2', []), false);
});

test('staff projection excludes clinical artifacts and full demographics', () => {
  const actor = { userId: 's-1', practiceId: 'practice-a', role: 'STAFF' as const, portalPatientId: null };
  const projected = projectPatientFields(actor, { name: 'Pat', birthDate: '1980-01-01', telecom: [], address: 'secret', diagnosis: 'secret' }, [{ id: 'artifact' }]);
  assert.deepEqual(projected, { name: 'Pat', birthDate: '1980-01-01', telecom: [] });
});

test('state-changing workflow requests require the configured same origin', () => {
  process.env.NEXTAUTH_URL = 'https://care.example.test';
  assert.doesNotThrow(() => requireSameOrigin(new Request('https://care.example.test/api/clinical', { headers: { origin: 'https://care.example.test' } })));
  assert.throws(() => requireSameOrigin(new Request('https://care.example.test/api/clinical', { headers: { origin: 'https://evil.example' } })), /origin is not allowed/);
  assert.throws(() => requireSameOrigin(new Request('https://care.example.test/api/clinical')), /origin is not allowed/);
});
