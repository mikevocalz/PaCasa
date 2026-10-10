import test from 'node:test';
import assert from 'node:assert/strict';
import { base44AuthEndpoint } from '../src/lib/authEndpoint.mjs';
const origin = 'https://pacasa.example.test';
test('relative Base44 function keeps the session on this site', () => {
  const result = new URL(base44AuthEndpoint('/functions/pacasaAuth', '/api/auth/sign-in/email', origin));
  assert.equal(result.origin, origin);
  assert.equal(result.pathname, '/functions/pacasaAuth');
  assert.equal(result.searchParams.get('path'), '/api/auth/sign-in/email');
});
test('an explicit same-site origin expands to the Base44 function', () => {
  assert.equal(base44AuthEndpoint(origin, '/api/portal/me', origin), base44AuthEndpoint('/functions/pacasaAuth/', '/api/portal/me', origin));
});
test('cross-origin, userinfo, query pollution and arbitrary handlers rejected', () => {
  for (const endpoint of ['https://evil.test', '//evil.test/functions/pacasaAuth', 'https://user:password@pacasa.example.test',
    '/functions/pacasaAuth?path=/admin', '/functions/pacasaAuth#fragment', '/api/auth', '/functions/other']) {
    assert.throws(() => base44AuthEndpoint(endpoint, '/api/portal/me', origin));
  }
});
test('unknown routes and missing configuration never become network requests', () => {
  for (const route of ['/admin', 'https://evil.test', '/api/auth/../admin']) assert.throws(() => base44AuthEndpoint('/functions/pacasaAuth', route, origin));
  assert.throws(() => base44AuthEndpoint('', '/api/portal/me', origin));
});
test('HTTP is allowed only for an explicit local developer origin', () => {
  assert.match(base44AuthEndpoint('/functions/pacasaAuth', '/api/portal/me', 'http://localhost:5173'), /^http:\/\/localhost:5173\//);
  assert.throws(() => base44AuthEndpoint('/functions/pacasaAuth', '/api/portal/me', 'http://pacasa.example.test'));
});
