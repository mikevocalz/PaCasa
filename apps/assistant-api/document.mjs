export const MAX_DOCUMENT_REQUEST_BYTES = 2_400_000;
export const MAX_IMAGE_BASE64 = 2_200_000;

/** Demo only. Strip EXIF client-side; never log or persist patient images. */
export async function readDocumentJson(req) {
  const pieces = [];
  let bytes = 0;
  for await (const piece of req) {
    bytes += piece.length;
    if (bytes > MAX_DOCUMENT_REQUEST_BYTES) throw new Error('request-too-large');
    pieces.push(piece);
  }
  try { return JSON.parse(Buffer.concat(pieces).toString('utf8')); }
  catch { throw new Error('invalid-json'); }
}
export function parseDocumentRequest(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data) ||
      data.consent !== true || !['image/jpeg', 'image/png', 'application/pdf'].includes(data.mimeType) ||
      typeof data.imageBase64 !== 'string' || data.imageBase64.length === 0 ||
      data.imageBase64.length > MAX_IMAGE_BASE64 ||
      !/^[A-Za-z0-9+/]+={0,2}$/.test(data.imageBase64)) return null;
  return { mimeType: data.mimeType, imageBase64: data.imageBase64 };
}

/** Explicitly consented, disabled-by-default demo OCR on browser captures. */
export async function documentTextFromGemini(input, key, model, fetcher = fetch) {
  const response = await fetcher(
    'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent',
    {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text:
          'Extract ONLY the visible words from this document as plain text, keeping reading order. ' +
          'Do not infer missing names, dates, identifiers or answers. Do not diagnose. ' +
          'If unreadable, return an empty string. Return JSON with a text key.' }] },
        contents: [{ role: 'user', parts: [
          { text: 'Transcribe visible text faithfully. No explanation or form filling.' },
          { inlineData: { mimeType: input.mimeType, data: input.imageBase64 } },
        ] }],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: { type: 'OBJECT', properties: { text: { type: 'STRING' } }, required: ['text'] },
          maxOutputTokens: 2600,
        },
      }),
      signal: AbortSignal.timeout(15_000),
    },
  );
  if (!response.ok) throw new Error('document-model-error');
  const result = await response.json();
  const raw = result?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof raw !== 'string') throw new Error('missing-model-text');
  let parsed;
  try { parsed = JSON.parse(raw); } catch { throw new Error('invalid-model-text'); }
  if (typeof parsed?.text !== 'string' || parsed.text.length > 9000) throw new Error('oversized-document-text');
  return { text: parsed.text.trim(), engine: 'gemini-vision-demo' };
}
