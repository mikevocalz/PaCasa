import test from 'node:test';
import assert from 'node:assert/strict';
import { configuredBase44Origin, createBase44AuthFetch } from '../apps/mobile/src/auth/base44-fetch.ts';
const origin = 'https://pacasa.example.test';
test('native configuration rejects insecure, credential-bearing and arbitrary function URLs', () => {
  for (const value of [undefined, 'http://pacasa.example.test', 'https://u:p@pacasa.example.test', origin + '/other', origin + '?token=x']) assert.equal(configuredBase44Origin(value), null);
  assert.equal(configuredBase44Origin(origin + '/functions/pacasaAuth'), origin);
});
test('unconfigured native transport does not make an HTTP request', async () => {
  const transport = createBase44AuthFetch(null, async () => { throw new Error('network must not run'); });
  await assert.rejects(transport(origin + '/api/auth/get-session'), /must be the HTTPS Base44/);
});
test('native auth routing preserves method, JSON, cancellation and secure-store cookie header', async () => {
  const transport = createBase44AuthFetch(origin, async (input) => {
    const req = new Request(input);
    const url = new URL(req.url);
    assert.equal(url.origin, origin);
    assert.equal(url.pathname, '/functions/pacasaAuth');
    assert.equal(url.searchParams.get('path'), '/api/auth/sign-in/email');
    assert.equal(req.headers.get('cookie'), 'better-auth.session_token=synthetic-test-token');
    assert.equal(req.headers.get('expo-origin'), 'pacasa://');
    assert.equal(req.headers.get('x-pacasa-request'), '1');
    assert.equal(req.credentials, 'omit');
    assert.deepEqual(await req.json(), { email: 'synthetic@example.test' });
    return Response.json({ ok: true });
  });
  const response = await transport(origin + '/api/auth/sign-in/email', { method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: 'better-auth.session_token=synthetic-test-token' },
    body: JSON.stringify({ email: 'synthetic@example.test' }) });
  assert.equal(response.status, 200);
});
test('native transport rejects a foreign host and non-auth routes before fetch', async () => {
  const transport = createBase44AuthFetch(origin, async () => { throw new Error('network must not run'); });
  await assert.rejects(transport('https://evil.test/api/auth/get-session'), /Unsupported/);
  await assert.rejects(transport(origin + '/api/admin'), /Unsupported/);
});
