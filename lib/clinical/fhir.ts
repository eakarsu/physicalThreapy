import { ClinicalBoundaryError, type ParsedFhirConsent, type ParsedFhirPatient } from './types';

type Json = Record<string, unknown>;

function object(value: unknown, label: string): Json {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new ClinicalBoundaryError(`${label} must be an object`, 400, 'FHIR_INVALID');
  }
  return value as Json;
}

function text(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function objects(value: unknown): Json[] {
  return Array.isArray(value) ? value.filter((item): item is Json => Boolean(item) && typeof item === 'object' && !Array.isArray(item)) : [];
}

export function resourcesFromR4(input: unknown): Json[] {
  const resource = object(input, 'FHIR payload');
  if (resource.resourceType === 'Bundle') {
    if (!['batch', 'transaction', 'collection'].includes(String(resource.type))) {
      throw new ClinicalBoundaryError('Only FHIR R4 batch, transaction, or collection Bundles are accepted', 400, 'FHIR_BUNDLE_TYPE');
    }
    const entries = objects(resource.entry).map((entry) => object(entry.resource, 'Bundle.entry.resource'));
    if (entries.length === 0 || entries.length > 100) {
      throw new ClinicalBoundaryError('FHIR Bundle must contain between 1 and 100 resources', 400, 'FHIR_BUNDLE_SIZE');
    }
    return entries;
  }
  return [resource];
}

export function parseR4Patient(resource: unknown): ParsedFhirPatient {
  const patient = object(resource, 'Patient');
  if (patient.resourceType !== 'Patient') {
    throw new ClinicalBoundaryError('Expected a FHIR R4 Patient resource', 400, 'FHIR_RESOURCE_TYPE');
  }
  const identifiers = objects(patient.identifier)
    .map((identifier) => ({ system: text(identifier.system), value: text(identifier.value) }))
    .filter((identifier): identifier is { system: string; value: string } => Boolean(identifier.system && identifier.value));
  const distinctSystems = new Set(identifiers.map((identifier) => identifier.system.toLowerCase()));
  if (identifiers.length < 2 || distinctSystems.size < 2) {
    throw new ClinicalBoundaryError('Patient identity requires two identifiers from distinct systems', 422, 'IDENTITY_EVIDENCE_INSUFFICIENT');
  }
  const names = objects(patient.name).map((name) => ({
    family: text(name.family),
    given: Array.isArray(name.given) ? name.given.filter((part): part is string => typeof part === 'string') : undefined,
  }));
  return {
    resourceId: text(patient.id) ?? null,
    identifiers,
    demographics: {
      name: names,
      birthDate: text(patient.birthDate),
      gender: text(patient.gender),
      telecom: objects(patient.telecom).map((item) => ({ system: text(item.system), value: text(item.value) })),
      address: Array.isArray(patient.address) ? patient.address : [],
    },
  };
}

function codingCodes(value: unknown): string[] {
  const concept = value && typeof value === 'object' ? value as Json : {};
  return objects(concept.coding).map((coding) => text(coding.code)).filter((code): code is string => Boolean(code));
}

export function parseR4Consent(resource: unknown): ParsedFhirConsent {
  const consent = object(resource, 'Consent');
  if (consent.resourceType !== 'Consent') {
    throw new ClinicalBoundaryError('Expected a FHIR R4 Consent resource', 400, 'FHIR_RESOURCE_TYPE');
  }
  const statusMap = {
    draft: 'DRAFT', active: 'ACTIVE', inactive: 'INACTIVE', rejected: 'REJECTED', 'entered-in-error': 'ENTERED_IN_ERROR',
  } as const;
  const status = statusMap[String(consent.status) as keyof typeof statusMap];
  if (!status) throw new ClinicalBoundaryError('Unsupported FHIR Consent.status', 422, 'CONSENT_STATUS_INVALID');
  const patientReference = text(object(consent.patient, 'Consent.patient').reference);
  if (!patientReference) throw new ClinicalBoundaryError('Consent.patient.reference is required', 422, 'CONSENT_PATIENT_REQUIRED');
  const scopeCodes = codingCodes(consent.scope);
  const categoryCodes = objects(consent.category).flatMap(codingCodes);
  const scopes = new Set<ParsedFhirConsent['scopes'][number]>();
  if (scopeCodes.includes('treatment') || categoryCodes.includes('treatment')) scopes.add('TREATMENT');
  if (scopeCodes.includes('patient-privacy') || categoryCodes.includes('idscl') || categoryCodes.includes('59284-0')) scopes.add('DATA_USE');
  const provision = consent.provision && typeof consent.provision === 'object' ? consent.provision as Json : {};
  for (const code of objects(provision.purpose).map((item) => text(item.code)).filter(Boolean)) {
    if (code === 'TREAT') scopes.add('TREATMENT');
    if (code === 'HOPERAT') scopes.add('DATA_USE');
  }
  if (scopes.size === 0) throw new ClinicalBoundaryError('Consent does not grant a supported purpose', 422, 'CONSENT_SCOPE_UNSUPPORTED');
  const policies = objects(consent.policy);
  const policyUri = policies.map((policy) => text(policy.uri)).find(Boolean) ?? text((consent.policyRule as Json | undefined)?.text);
  if (!policyUri) throw new ClinicalBoundaryError('Consent policy URI is required', 422, 'CONSENT_POLICY_REQUIRED');
  const period = provision.period && typeof provision.period === 'object' ? provision.period as Json : {};
  const start = text(period.start) ?? text(consent.dateTime);
  if (!start || Number.isNaN(Date.parse(start))) throw new ClinicalBoundaryError('Consent effective start is required', 422, 'CONSENT_PERIOD_REQUIRED');
  const end = text(period.end);
  const verification = objects(consent.verification);
  return {
    resourceId: text(consent.id) ?? null,
    patientReference,
    status,
    scopes: [...scopes],
    policyUri,
    effectiveFrom: new Date(start),
    effectiveUntil: end && !Number.isNaN(Date.parse(end)) ? new Date(end) : null,
    verified: verification.some((item) => item.verified === true),
  };
}
