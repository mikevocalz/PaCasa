// Smoke/integration tests with mock Gemini transport. No external API calls.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createServer } from 'node:http';

process.env.GEMINI_API_KEY = 'local-test-only';
process.env.PACASA_ALLOWED_ORIGINS = 'http://localhost:3000';
const { handleAssistantRequest } = await import('../server.mjs');

async function withServer(fn) {
  const mock = async (_url, options) => {
    assert.equal(options.headers['x-goog-api-key'], 'local-test-only');
    return { ok: true, async json() {
      return { candidates: [{ content: { parts: [{ text: JSON.stringify({ reply: 'Fecha de nacimiento' }) }] } }] };
    } };
  };
  const server = createServer((req, res) => { void handleAssistantRequest(req, res, mock); });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const addr = server.address();
  try { await fn('http://127.0.0.1:' + addr.port); }
  finally { await new Promise((resolve) => server.close(resolve)); }
}

test('real HTTP endpoint validates translated text and serves safe OpenUI Lang', async () => {
  await withServer(async (base) => {
    const response = await fetch(base + '/assistant', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:3000' },
      body: JSON.stringify({ mode: 'translate', text: 'Date of birth',
        sourceLanguage: 'en', targetLanguage: 'es', history: [] }),
    });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('access-control-allow-origin'), 'http://localhost:3000');
    assert.equal(response.headers.get('cache-control'), 'no-store, no-cache, private');
    const data = await response.json();
    assert.equal(data.reply, 'Fecha de nacimiento');
    assert.match(data.ui, /TranslationPair/);
  });
});

test('rejects unknown web origins and malformed requests', async () => {
  await withServer(async (base) => {
    const evil = await fetch(base + '/assistant', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://evil.example' },
      body: '{}',
    });
    assert.equal(evil.status, 403);
    const bad = await fetch(base + '/assistant', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:3000' },
      body: JSON.stringify({ mode: 'translate', text: '', sourceLanguage: 'es', targetLanguage: 'en', history: [] }),
    });
    assert.equal(bad.status, 400);
    const invalidJson = await fetch(base + '/assistant', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: '{',
    });
    assert.equal(invalidJson.status, 400);
  });
});
