import test from 'node:test';
import assert from 'node:assert/strict';
import { authOptions, createGateway, readConfig } from '../base44/functions/pacasaAuth/gateway.js';
const values = { DATABASE_URL: 'postgres://test@localhost/test', BETTER_AUTH_SECRET: 'test-only-secret-at-least-thirty-two-characters', BETTER_AUTH_URL: 'https://demo.example.test' };
const getSecret = (key) => values[key];
const request = (path, body, headers = {}) => new Request(`https://demo.example.test/functions/pacasaAuth?path=${encodeURIComponent(path)}`, {
  method: body === undefined ? 'GET' : 'POST', headers: { Origin: values.BETTER_AUTH_URL, 'Content-Type': 'application/json', 'X-PaCasa-Request': '1', ...headers },
  ...(body === undefined ? {} : { body: typeof body === 'string' ? body : JSON.stringify(body) }),
});
function gateway(overrides = {}) {
  return createGateway({ getSecret, runtimeFactory: () => { throw new Error('DB_PASSWORD must never leak'); }, ...overrides });
}
test('configuration fails closed without all private settings', () => {
  assert.equal(readConfig(() => undefined), null);
  assert.equal(readConfig((key) => key === 'BETTER_AUTH_SECRET' ? 'short' : values[key]), null);
  assert.equal(readConfig((key) => key === 'BETTER_AUTH_URL' ? 'http://demo.example.test' : values[key]), null);
  assert.equal(readConfig((key) => key === 'BETTER_AUTH_TRUSTED_ORIGINS' ? '*' : values[key]), null);
  assert.equal(readConfig((key) => key === 'BETTER_AUTH_URL' ? 'https://bad:secret@demo.example.test' : values[key]), null);
});
test('configuration preserves pacasa native scheme and exact browser origins', () => {
  const config = readConfig(getSecret);
  assert.deepEqual(config.trustedOrigins, ['https://demo.example.test', 'pacasa://']);
  const options = authOptions(config, {});
  assert.equal(options.rateLimit.storage, 'database');
  assert.equal(options.session.cookieCache.enabled, false);
  assert.deepEqual(options.advanced.defaultCookieAttributes, { httpOnly: true, secure: true, sameSite: 'lax', path: '/' });
});
test('not configured returns 503 without initializing database', async () => {
  const response = await gateway({ getSecret: () => undefined })(request('/api/auth/get-session'));
  assert.equal(response.status, 503);
  assert.equal(response.headers.get('cache-control'), 'no-store');
});
test('health endpoint labels configuration, not a successful database check', async () => {
  const response = await gateway()(request('/healthz'));
  assert.deepEqual(await response.json(), { status: 'configured', hosting: 'base44', databaseVerified: false });
});
test('foreign, null and malformed origins denied before DB access', async () => {
  for (const origin of ['https://evil.test', 'null', 'https://demo.example.test.evil.test']) {
    assert.equal((await gateway()(request('/api/auth/sign-in/email', {}, { Origin: origin }))).status, 403);
  }
});
test('preflight names exact credentialed origin; never a wildcard', async () => {
  const response = await gateway()(new Request('https://demo.example.test/functions/pacasaAuth?path=/api/auth/sign-in/email', { method: 'OPTIONS', headers: { Origin: values.BETTER_AUTH_URL } }));
  assert.equal(response.status, 204);
  assert.equal(response.headers.get('access-control-allow-origin'), values.BETTER_AUTH_URL);
});
test('unknown, duplicate, URL and traversal paths rejected', async () => {
  for (const path of ['/api/admin', 'https://evil.test/', '/api/auth/../admin']) assert.equal((await gateway()(request(path))).status, 404);
  const req = new Request('https://demo.example.test/functions/pacasaAuth?path=/healthz&path=/api/admin');
  assert.equal((await gateway()(req)).status, 404);
});
test('auth writes require custom request header and JSON', async () => {
  assert.equal((await gateway()(request('/api/auth/sign-in/email', {}, { 'X-PaCasa-Request': '' }))).status, 403);
  assert.equal((await gateway()(request('/api/auth/sign-in/email', {}, { 'Content-Type': 'text/plain' }))).status, 415);
  assert.equal((await gateway()(request('/api/auth/sign-in/email', 'null'))).status, 400);
});
test('actual body size is bounded even without Content-Length', async () => {
  assert.equal((await gateway()(request('/api/auth/sign-in/email', { text: 'x'.repeat(20_000) }))).status, 413);
});
test('auth proxy rewrites only an approved route and preserves multiple cookies', async () => {
  const handler = gateway({ runtimeFactory: () => ({ auth: { handler: async (req) => {
    assert.equal(req.url, 'https://demo.example.test/api/auth/sign-in/email');
    assert.equal(req.headers.get('origin'), values.BETTER_AUTH_URL);
    assert.deepEqual(await req.json(), { email: 'test@example.test' });
    const headers = new Headers();
    headers.append('Set-Cookie', 'one=1; Path=/; HttpOnly; Secure');
    headers.append('Set-Cookie', 'two=2; Path=/; HttpOnly; Secure');
    return new Response('{}', { headers });
  } } }) });
  const response = await handler(request('/api/auth/sign-in/email', { email: 'test@example.test' }));
  assert.equal(response.status, 200);
  assert.equal(response.headers.getSetCookie().length, 2);
});
test('unauthenticated portal access rejected', async () => {
  const handler = gateway({ runtimeFactory: () => ({ auth: { api: { getSession: async () => null } } }) });
  assert.equal((await handler(request('/api/portal/me'))).status, 401);
});
test('unexpected errors never disclose credentials', async () => {
  const response = await gateway()(request('/api/auth/get-session'));
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { error: 'service_unavailable' });
});
