import assert from 'node:assert/strict';
import test from 'node:test';
import { parseR4Consent, parseR4Patient, resourcesFromR4 } from '../lib/clinical/fhir';
import { ClinicalBoundaryError } from '../lib/clinical/types';

const patient = {
  resourceType: 'Patient', id: 'p-1',
  identifier: [{ system: 'urn:mrn', value: 'MRN-1001' }, { system: 'urn:portal', value: 'PORTAL-8821' }],
  name: [{ family: 'Example', given: ['Pat'] }], birthDate: '1980-01-01', gender: 'unknown',
};

test('accepts an R4 Patient with two independent identity systems', () => {
  const parsed = parseR4Patient(patient);
  assert.equal(parsed.resourceId, 'p-1');
  assert.equal(parsed.identifiers.length, 2);
});

test('rejects insufficient identity evidence', () => {
  assert.throws(() => parseR4Patient({ ...patient, identifier: [patient.identifier[0]] }), (error) => error instanceof ClinicalBoundaryError && error.code === 'IDENTITY_EVIDENCE_INSUFFICIENT');
});

test('rejects two identifiers issued by the same system', () => {
  assert.throws(() => parseR4Patient({ ...patient, identifier: [{ system: 'urn:mrn', value: '1' }, { system: 'urn:mrn', value: '2' }] }), /two identifiers/);
});

test('maps verified active FHIR R4 treatment/data-use consent', () => {
  const parsed = parseR4Consent({
    resourceType: 'Consent', id: 'c-1', status: 'active', patient: { reference: 'Patient/p-1' },
    scope: { coding: [{ code: 'patient-privacy' }] }, category: [{ coding: [{ code: 'treatment' }] }],
    policy: [{ uri: 'urn:policy:care-v1' }], dateTime: '2026-07-20T10:00:00Z',
    verification: [{ verified: true }], provision: { purpose: [{ code: 'TREAT' }, { code: 'HOPERAT' }], period: { start: '2026-07-20T10:00:00Z' } },
  });
  assert.deepEqual(parsed.scopes.sort(), ['DATA_USE', 'TREATMENT']);
  assert.equal(parsed.verified, true);
});

test('rejects unsupported resources and oversized bundles', () => {
  assert.throws(() => parseR4Consent({ resourceType: 'Observation' }), /Consent/);
  assert.throws(() => resourcesFromR4({ resourceType: 'Bundle', type: 'history', entry: [{ resource: patient }] }), /batch/);
  assert.throws(() => resourcesFromR4({ resourceType: 'Bundle', type: 'batch', entry: [] }), /between 1 and 100/);
});
