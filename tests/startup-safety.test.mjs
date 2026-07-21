import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const start = await readFile(new URL('../start.sh', import.meta.url), 'utf8');
const seed = await readFile(new URL('../prisma/seed.ts', import.meta.url), 'utf8');
const login = await readFile(new URL('../app/login/page.tsx', import.meta.url), 'utf8');
const provision = await readFile(new URL('../scripts/provision-practice.ts', import.meta.url), 'utf8');

test('launcher does not mutate dependencies, databases, caches, or unrelated processes', () => {
  for (const forbidden of ['npm install', 'yarn install', 'db push', 'accept-data-loss', 'kill -9', 'rm -rf', 'brew services']) {
    assert.equal(start.includes(forbidden), false, `start.sh contains ${forbidden}`);
  }
  assert.match(start, /Port .* is already in use; no process was terminated/);
});

test('seed is explicitly disposable and has no fixed shared password', () => {
  assert.match(seed, /ALLOW_DISPOSABLE_SEED/);
  assert.match(seed, /SEED_USER_PASSWORD/);
  assert.equal(seed.includes("bcrypt.hash('password123'"), false);
});

test('login page does not publish credentials', () => {
  assert.equal(login.includes('password123'), false);
  assert.equal(login.includes('Demo Credentials'), false);
});

test('practice bootstrap is explicit and never creates or logs credentials', () => {
  assert.match(provision, /ALLOW_PRACTICE_PROVISION/);
  assert.match(provision, /existing ADMIN user/);
  assert.equal(provision.includes('hashedPassword'), false);
  assert.equal(provision.includes('PROVISION_ADMIN_PASSWORD'), false);
});
