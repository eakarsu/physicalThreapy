import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes } from 'node:crypto';
import { ClinicalBoundaryError } from './types';

type CipherEnvelope = { v: 1; kid: string; iv: string; tag: string; data: string };

function keyFromEnvironment(): { id: string; value: Buffer } {
  const encoded = process.env.PHI_ENCRYPTION_KEY;
  const id = process.env.PHI_ENCRYPTION_KEY_ID;
  if (!encoded || !id) {
    throw new ClinicalBoundaryError('PHI encryption is not configured', 503, 'ENCRYPTION_NOT_CONFIGURED');
  }
  const value = Buffer.from(encoded, 'base64');
  if (value.length !== 32 || !/^[A-Za-z0-9._-]{3,64}$/.test(id)) {
    throw new ClinicalBoundaryError('PHI encryption configuration is invalid', 503, 'ENCRYPTION_INVALID');
  }
  return { id, value };
}

export function encryptJson(value: unknown, aad: string): { ciphertext: string; keyId: string; hash: string } {
  const key = keyFromEnvironment();
  const plaintext = Buffer.from(JSON.stringify(value), 'utf8');
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key.value, iv);
  cipher.setAAD(Buffer.from(aad));
  const data = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const envelope: CipherEnvelope = {
    v: 1,
    kid: key.id,
    iv: iv.toString('base64'),
    tag: cipher.getAuthTag().toString('base64'),
    data: data.toString('base64'),
  };
  return {
    ciphertext: Buffer.from(JSON.stringify(envelope)).toString('base64'),
    keyId: key.id,
    hash: createHash('sha256').update(plaintext).digest('hex'),
  };
}

export function decryptJson<T>(encoded: string, aad: string): T {
  const key = keyFromEnvironment();
  const envelope = JSON.parse(Buffer.from(encoded, 'base64').toString('utf8')) as CipherEnvelope;
  if (envelope.v !== 1 || envelope.kid !== key.id) {
    throw new ClinicalBoundaryError('No configured key can decrypt this record', 503, 'ENCRYPTION_KEY_UNAVAILABLE');
  }
  const decipher = createDecipheriv('aes-256-gcm', key.value, Buffer.from(envelope.iv, 'base64'));
  decipher.setAAD(Buffer.from(aad));
  decipher.setAuthTag(Buffer.from(envelope.tag, 'base64'));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(envelope.data, 'base64')),
    decipher.final(),
  ]);
  return JSON.parse(plaintext.toString('utf8')) as T;
}

export function hashIdentifier(system: string, value: string): string {
  const secret = process.env.IDENTITY_HASH_KEY;
  if (!secret || Buffer.byteLength(secret) < 32) {
    throw new ClinicalBoundaryError('Identity matching key is not configured', 503, 'IDENTITY_KEY_INVALID');
  }
  return createHmac('sha256', secret)
    .update(`${system.trim().toLowerCase()}\u0000${value.trim()}`)
    .digest('hex');
}

export function stableHash(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}
