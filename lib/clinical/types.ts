import type { UserRole } from '@prisma/client';

export type ClinicalActor = {
  userId: string;
  practiceId: string;
  role: UserRole;
  portalPatientId: string | null;
};

export class ClinicalBoundaryError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'ClinicalBoundaryError';
  }
}

export type FhirIdentifier = { system: string; value: string };

export type ParsedFhirPatient = {
  resourceId: string | null;
  identifiers: FhirIdentifier[];
  demographics: {
    name: Array<{ family?: string; given?: string[] }>;
    birthDate?: string;
    gender?: string;
    telecom: Array<{ system?: string; value?: string }>;
    address: unknown[];
  };
};

export type ParsedFhirConsent = {
  resourceId: string | null;
  patientReference: string;
  status: 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'REJECTED' | 'ENTERED_IN_ERROR';
  scopes: Array<'TREATMENT' | 'DATA_USE' | 'EXTERNAL_DISCLOSURE' | 'EXTERNAL_AI'>;
  policyUri: string;
  effectiveFrom: Date;
  effectiveUntil: Date | null;
  verified: boolean;
};
