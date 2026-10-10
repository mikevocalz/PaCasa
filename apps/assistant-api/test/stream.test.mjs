import { test } from 'node:test';
import assert from 'node:assert/strict';
import { decodeGeminiPacket, sse } from '../stream.mjs';

test('Google SSE decoding consumes only text parts', () => {
  assert.equal(decodeGeminiPacket(JSON.stringify({ candidates: [{ content: { parts: [{ text: 'Hola' }] } }] })), 'Hola');
  assert.equal(decodeGeminiPacket('not json'), '');
  assert.match(sse('delta', { text: 'Hola' }), /event: delta/);
});
