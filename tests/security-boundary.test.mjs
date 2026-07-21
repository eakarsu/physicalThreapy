import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const proxy = await readFile(new URL('../proxy.ts', import.meta.url), 'utf8');
const ai = await readFile(new URL('../lib/ai.ts', import.meta.url), 'utf8');
const migration = await readFile(new URL('../prisma/migrations/20260720170000_controlled_clinical_workflow/migration.sql', import.meta.url), 'utf8');

test('legacy unscoped pages and APIs are blocked by the runtime boundary', () => {
  for (const path of ['/patients', '/sessions', '/billing', '/messages', '/api/ai/', '/api/patients/']) assert.ok(proxy.includes(path));
  assert.match(proxy, /status: 410/);
});

test('compatibility AI client has no outbound fetch or provider key', () => {
  assert.equal(ai.includes('fetch('), false);
  assert.equal(ai.includes('OPENROUTER_API_KEY'), false);
  assert.match(ai, /disabled by the controlled clinical-data boundary/);
});

test('migration enforces immutable evidence and rejects cross-practice references', () => {
  assert.match(migration, /audit_events_immutable/);
  assert.match(migration, /clinical_reviews_immutable/);
  assert.match(migration, /cross-practice clinical reference rejected/);
});
