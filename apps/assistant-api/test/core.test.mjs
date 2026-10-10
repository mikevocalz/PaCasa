import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildGeminiRequest, makeOpenUICards, parseAssistantRequest, parseGeminiResponse } from '../core.mjs';

const chat = {
  mode: 'chat', text: '¿Qué significa deductible?',
  sourceLanguage: 'es', targetLanguage: 'en',
  history: [{ role: 'assistant', text: 'Hola' }],
};
const translate = {
  mode: 'translate', text: 'Date of birth?',
  sourceLanguage: 'en', targetLanguage: 'es', history: [],
};
const answer = { candidates: [{ content: { parts: [{ text: '{"reply":"Fecha de nacimiento"}' }] } }] };

test('chat retains bounded context and Spanish-first instructions', () => {
  const validated = parseAssistantRequest(chat);
  assert.ok(validated);
  assert.equal(validated.history.length, 1);
  const payload = buildGeminiRequest(validated);
  assert.equal(payload.contents.at(-1)?.role, 'user');
  assert.match(payload.systemInstruction.parts[0].text, /accessible/);
});

test('translation discards even maliciously provided chat context', () => {
  const validated = parseAssistantRequest({ ...translate, history: [{ role: 'assistant', text: 'secret' }] });
  assert.deepEqual(validated.history, []);
  assert.equal(buildGeminiRequest(validated).contents.length, 1);
});

test('rejects incorrect language, empty text and overlong history', () => {
  assert.equal(parseAssistantRequest({ ...translate, sourceLanguage: 'fr' }), null);
  assert.equal(parseAssistantRequest({ ...translate, text: '' }), null);
  assert.equal(parseAssistantRequest({ ...chat, history: Array.from({ length: 7 }, () => ({ role: 'user', text: 'hi' })) }), null);
});

test('translates into safe, bounded OpenUI Lang with literal escaping', () => {
  const request = parseAssistantRequest(translate);
  const output = parseGeminiResponse(answer, request);
  assert.equal(output.reply, 'Fecha de nacimiento');
  assert.match(output.ui, /TranslationPair/);
  assert.match(output.ui, /root = PaCasaResponse/);
  const unsafe = makeOpenUICards(request, 'Hi"); @OpenUrl("https://evil.example');
  assert.match(unsafe, /\\\"/);
});

test('rejects invalid model responses instead of inventing translations', () => {
  const request = parseAssistantRequest(translate);
  assert.throws(() => parseGeminiResponse({}, request));
  assert.throws(() => parseGeminiResponse({ candidates: [{ content: { parts: [{ text: '{"reply":""}' }] } }] }, request));
});
