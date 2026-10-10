import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseDocumentRequest, documentTextFromGemini } from '../document.mjs';

test('web camera document requests need explicit consent and bounded image bytes', () => {
  const image = { imageBase64: 'QUJD', mimeType: 'image/jpeg', consent: true };
  assert.deepEqual(parseDocumentRequest(image), { imageBase64: 'QUJD', mimeType: 'image/jpeg' });
  assert.equal(parseDocumentRequest({ ...image, consent: false }), null);
  assert.equal(parseDocumentRequest({ ...image, imageBase64: '<svg/>' }), null);
  assert.equal(parseDocumentRequest({ ...image, mimeType: 'image/svg+xml' }), null);
});

test('Gemini Vision document extraction returns only bounded text', async () => {
  const doc = await documentTextFromGemini(
    { mimeType: 'image/jpeg', imageBase64: 'QUJD' }, 'fake-key', 'gemini-test',
    async (_url, options) => {
      const payload = JSON.parse(options.body);
      assert.equal(payload.contents[0].parts[1].inlineData.data, 'QUJD');
      assert.equal(options.headers['x-goog-api-key'], 'fake-key');
      return { ok: true, async json() {
        return { candidates: [{ content: { parts: [{ text: '{"text":"Date of birth"}' }] } }] };
      } };
    },
  );
  assert.deepEqual(doc, { text: 'Date of birth', engine: 'gemini-vision-demo' });
});
