/**
 * Dependency-free, stateless Gemini adapter for the Pa'Casa text MVP.
 * Do not handle real patient records until authentication and compliance are
 * independently reviewed. No text/metadata is logged or persisted here.
 */
export const MAX_TEXT = 2000;
export const MAX_HISTORY = 6;
export const MAX_BODY_BYTES = 16 * 1024;

const isLanguage = (value) => value === 'es' || value === 'en';
const isRole = (value) => value === 'user' || value === 'assistant';
const safeText = (value, max = MAX_TEXT) =>
  typeof value === 'string' && value.trim().length > 0 && value.length <= max;

export function parseAssistantRequest(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null;
  const { mode, text, sourceLanguage, targetLanguage, history } = payload;
  if ((mode !== 'chat' && mode !== 'translate') || !safeText(text) ||
    !isLanguage(sourceLanguage) || !isLanguage(targetLanguage) ||
    sourceLanguage === targetLanguage || !Array.isArray(history) || history.length > MAX_HISTORY
  ) return null;
  if (!history.every((m) => m && typeof m === 'object' && isRole(m.role) && safeText(m.text))) return null;
  // Translation must not inherit chat data. The client sends [] but the
  // backend drops it independently rather than trusting the interface.
  return {
    mode, text: text.trim(), sourceLanguage, targetLanguage,
    history: mode === 'chat' ? history.map(({ role, text: value }) =>
      ({ role, text: value.trim() })) : [],
  };
}

const CHAT_INSTRUCTIONS = `
You are Pa'Casa, an assistant helping Spanish-first older adults understand
English forms and instructions. Write the reply in clear, friendly, accessible
Spanish unless the user explicitly requests another language.
Use short sentences, explain one question at a time, and ask for clarification
instead of guessing private answers. Do not diagnose, prescribe, infer form
answers, claim documents were parsed/submitted, or say a field was saved.
For medical/legal/insurance decisions, suggest checking with the appropriate
qualified person. Output only a JSON object with one string key: "reply".
`.trim();

function translateInstructions(target) {
  return `
You are Pa'Casa's bilingual translator. Translate the user's supplied text
faithfully from English/Spanish into ${target === 'es' ? 'Spanish' : 'English'}.
Do not answer questions in the source text, infer patient details, censor
form fields, add commentary or introduce external information.
Preserve numbers, names, dates, negation, and original meaning.
Output only a JSON object with one string key "reply" containing the
translation. If a phrase is unclear, preserve ambiguity rather than guessing.
`.trim();
}

export function buildGeminiRequest(request) {
  const contents = request.mode === 'chat'
    ? request.history.map(({ role, text }) => ({
        role: role === 'assistant' ? 'model' : 'user',
        parts: [{ text }],
      }))
    : [];
  contents.push({ role: 'user', parts: [{ text: request.text }] });
  return {
    systemInstruction: {
      parts: [{ text: request.mode === 'translate'
        ? translateInstructions(request.targetLanguage) : CHAT_INSTRUCTIONS }],
    },
    contents,
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'OBJECT',
        properties: { reply: { type: 'STRING' } },
        required: ['reply'],
      },
      maxOutputTokens: 1200,
    },
  };
}

export function makeOpenUICards(request, reply) {
  // Escape every model- and user-supplied value as an OpenUI string literal;
  // components are built by server code, never interpreted as executable UI.
  if (request.mode === 'translate') {
    return [
      'root = PaCasaResponse([translation])',
      'translation = TranslationPair(' + [
        request.text, reply, request.sourceLanguage, request.targetLanguage,
      ].map(JSON.stringify).join(', ') + ')',
    ].join('\n');
  }
  return [
    'root = PaCasaResponse([paragraph])',
    'paragraph = PaCasaText(' + JSON.stringify(reply) + ')',
  ].join('\n');
}

export function parseGeminiResponse(response, request) {
  const candidates = response?.candidates;
  const parts = Array.isArray(candidates) ? candidates[0]?.content?.parts : undefined;
  const raw = Array.isArray(parts)
    ? parts.map((part) => typeof part?.text === 'string' ? part.text : '').join('')
    : '';
  if (!raw || raw.length > 14_000) throw new Error('invalid-model-response');
  let json;
  try { json = JSON.parse(raw); } catch { throw new Error('invalid-model-json'); }
  const reply = json?.reply;
  if (!safeText(reply, 4000)) throw new Error('invalid-model-reply');
  const clean = reply.trim();
  const ui = makeOpenUICards(request, clean);
  return { reply: clean, ...(ui.length <= 12_000 ? { ui } : {}) };
}
