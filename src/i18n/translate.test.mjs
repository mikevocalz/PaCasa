import { test } from 'node:test';
import assert from 'node:assert/strict';
import { translateForRecipient } from './translate.mjs';

const base = { text: 'Do you have an appointment?', sourceLanguage: 'en', targetLanguage: 'es' };
test('offline front desk phrases translate in both directions', async () => {
  const enEs = await translateForRecipient(base);
  assert.equal(enEs.text, '¿Tiene una cita?');
  assert.equal(enEs.method, 'phrasebook');
  const esEn = await translateForRecipient({ text: enEs.text, sourceLanguage: 'es', targetLanguage: 'en' });
  assert.equal(esEn.text, base.text);
});
test('never mislabels an untranslated phrase', async () => {
  const unknown = await translateForRecipient({ ...base, text: 'My knee has hurt for four days.' });
  assert.deepEqual(unknown, { status: 'unavailable', text: '' });
  const same = await translateForRecipient({ ...base, targetLanguage: 'en' });
  assert.deepEqual(same, { status: 'identity', text: base.text });
});
test('server adapter posts language metadata and never embeds a provider key', async () => {
  let request;
  const translated = await translateForRecipient({
    ...base,
    text: 'Please bring your prescription bottles.',
    endpoint: '/api/translate',
    fetcher: async (url, options) => {
      request = { url, options };
      return { ok: true, json: async () => ({ translation: 'Traiga sus frascos de medicamentos.' }) };
    },
  });
  assert.equal(translated.method, 'service');
  assert.equal(request.options.credentials, 'include');
  assert.equal(JSON.parse(request.options.body).targetLanguage, 'es');
  assert.equal(request.options.headers.Authorization, undefined);
});
test('server errors reject rather than returning the English original', async () => {
  await assert.rejects(translateForRecipient({
    ...base, text: 'Unsupported message', endpoint: 'https://example.org/translate',
    fetcher: async () => ({ ok: false }),
  }));
});
