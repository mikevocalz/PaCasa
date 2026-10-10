import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  assistantReplyFromResponse, makeAssistantRequest, MAX_HISTORY,
  MAX_MESSAGE_CHARS, PRODUCT_PATHS, type AssistantMessage,
} from './contract.ts';

test('four persistent destinations, with the assistant outside the tab stack', () => {
  assert.deepEqual(PRODUCT_PATHS, ['/', '/mi-plan', '/citas', '/apoyo']);
  assert.equal(new Set(PRODUCT_PATHS).size, 4);
});

test('chat trims text and retains only the last six chat messages', () => {
  const messages: AssistantMessage[] = Array.from({ length: 11 }, (_, index) => ({
    id: index + 1,
    mode: index === 2 ? 'translate' : 'chat',
    role: index % 2 === 0 ? 'user' : 'assistant',
    text: 'Message ' + index,
  }));
  const request = makeAssistantRequest({ mode: 'chat', draft: ' ¿Me ayudas? ', sourceLanguage: 'es', messages });
  assert.equal(request?.text, '¿Me ayudas?');
  assert.equal(request?.targetLanguage, 'en');
  assert.equal(request?.history.length, MAX_HISTORY);
  assert.equal(request?.history.some((m) => m.text === 'Message 2'), false);
});

test('translation sends no conversation history and flips language', () => {
  const request = makeAssistantRequest({
    mode: 'translate', draft: 'Insurance', sourceLanguage: 'en',
    messages: [{ id: 1, role: 'assistant', mode: 'chat', text: 'Private note' }],
  });
  assert.deepEqual(request?.history, []);
  assert.equal(request?.targetLanguage, 'es');
});

test('never submits an empty or oversized input', () => {
  assert.equal(makeAssistantRequest({ mode: 'chat', draft: '  ', sourceLanguage: 'es', messages: [] }), null);
  assert.equal(makeAssistantRequest({ mode: 'chat', draft: 'x'.repeat(MAX_MESSAGE_CHARS + 1), sourceLanguage: 'es', messages: [] }), null);
});

test('backend replies must be non-empty bounded plain text', () => {
  assert.equal(assistantReplyFromResponse({ reply: ' Hola ' }), 'Hola');
  assert.equal(assistantReplyFromResponse({ reply: '' }), null);
  assert.equal(assistantReplyFromResponse({ html: '<script />' }), null);
  assert.equal(assistantReplyFromResponse({ reply: 'x'.repeat(10001) }), null);
});
