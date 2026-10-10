import { createServer } from 'node:http';
import { parseAssistantRequest, buildGeminiRequest, parseGeminiResponse, MAX_BODY_BYTES } from './core.mjs';
import { streamGeminiAnswer } from './stream.mjs';
import { resolveDirectionPlace } from './directions.mjs';
import { serveStaticMap } from './map.mjs';
import { readDocumentJson, parseDocumentRequest, documentTextFromGemini } from './document.mjs';
import { parseSpeakRequest, speakWithElevenLabs } from './voice.mjs';

const PORT = Number.parseInt(process.env.PORT ?? '8787', 10);
const HOST = process.env.HOST ?? '127.0.0.1';
const MODEL = process.env.GEMINI_MODEL ?? 'gemini-3.8-flash';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_GEMINI;
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID;
// Verified geocoding + static maps: Google server key first, else the public
// Mapbox pk.* token (safe to expose; the repo keeps it server-side anyway).
const MAP_KEYS = {
  googleKey: process.env.GOOGLE_MAPS_API_KEY,
  mapboxToken: process.env.MAPBOX_ACCESS_TOKEN ?? process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ??
    process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN ?? process.env.VITE_MAPBOX_ACCESS_TOKEN,
};
const ALLOWED_ORIGINS = new Set(
  (process.env.PACASA_ALLOWED_ORIGINS ?? 'http://localhost:3000')
    .split(',').map((s) => s.trim()).filter(Boolean),
);

/** In-memory anonymous rate limiting only; no requests, conversations, or IPs
 * are written to disk or logs. Production requires an authorization layer. */
const buckets = new Map();
function mayProceed(address, now = Date.now()) {
  if (buckets.size > 5000) buckets.clear();
  const current = buckets.get(address);
  if (!current || current.reset <= now) {
    buckets.set(address, { reset: now + 5 * 60_000, count: 1 });
    return true;
  }
  if (current.count >= 20) return false;
  current.count += 1;
  return true;
}

function respond(res, status, body, origin) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store, no-cache, private',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    ...(origin && ALLOWED_ORIGINS.has(origin)
      ? { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Credentials': 'true', Vary: 'Origin' }
      : {}),
  });
  res.end(JSON.stringify(body));
}

async function readJson(req) {
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw new Error('request-too-large');
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  try { return JSON.parse(raw); } catch { throw new Error('invalid-json'); }
}

export async function handleAssistantRequest(req, res, fetchModel = fetch) {
  const origin = req.headers.origin;
  // CORS is not authentication; native calls generally omit Origin. The
  // separate service is development-only until production auth is added.
  if (origin && !ALLOWED_ORIGINS.has(origin)) {
    respond(res, 403, { error: 'Origen no autorizado.' });
    return;
  }
  if (req.url === '/healthz' && req.method === 'GET') {
    respond(res, 200, { status: 'ok', configured: Boolean(GEMINI_API_KEY), voice: Boolean(ELEVENLABS_API_KEY && ELEVENLABS_VOICE_ID) }, origin);
    return;
  }
  if (req.url?.startsWith('/assistant/map?')) {
    if (req.method !== 'GET') { respond(res, 405, { error: 'Método no permitido.' }, origin); return; }
    if (!mayProceed(req.socket.remoteAddress ?? 'unknown')) { respond(res, 429, { error: 'Inténtalo más tarde.' }, origin); return; }
    await serveStaticMap(req, res, MAP_KEYS);
    return;
  }
  if (req.url !== '/assistant' && req.url !== '/assistant/stream' && req.url !== '/assistant/document' && req.url !== '/assistant/speak') {
    respond(res, 404, { error: 'No encontrado.' }, origin);
    return;
  }
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      ...(origin ? { 'Access-Control-Allow-Origin': origin } : {}),
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'content-type, x-pacasa-request',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '3600',
      Vary: 'Origin',
    });
    res.end();
    return;
  }
  if (req.method !== 'POST') {
    respond(res, 405, { error: 'Método no permitido.' }, origin);
    return;
  }
  if (!req.headers['content-type']?.startsWith('application/json')) {
    respond(res, 415, { error: 'Se requiere JSON.' }, origin);
    return;
  }
  if (!mayProceed(req.socket.remoteAddress ?? 'unknown')) {
    respond(res, 429, { error: 'Demasiadas solicitudes. Inténtalo más tarde.' }, origin);
    return;
  }
  if (req.url === '/assistant/speak') {
    if (!ELEVENLABS_API_KEY || !ELEVENLABS_VOICE_ID) {
      respond(res, 503, { error: 'La voz no está configurada.' }, origin);
      return;
    }
    try {
      const speak = parseSpeakRequest(await readJson(req));
      if (!speak) { respond(res, 400, { error: 'Solicitud de voz inválida o sin consentimiento.' }, origin); return; }
      const upstream = await speakWithElevenLabs(speak.text, ELEVENLABS_API_KEY, ELEVENLABS_VOICE_ID);
      res.writeHead(200, {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-store, no-cache, private',
        'X-Content-Type-Options': 'nosniff',
        ...(origin && ALLOWED_ORIGINS.has(origin)
          ? { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Credentials': 'true', Vary: 'Origin' }
          : {}),
      });
      for await (const chunk of upstream.body) res.write(chunk);
      res.end();
      return;
    } catch {
      respond(res, 502, { error: 'La voz no está disponible. Inténtalo otra vez.' }, origin);
      return;
    }
  }
  if (!GEMINI_API_KEY || !/^gemini-[a-z0-9.-]+$/.test(MODEL)) {
    respond(res, 503, { error: 'El servicio de IA no está configurado.' }, origin);
    return;
  }
  try {
    if (req.url === '/assistant/document') {
      if (process.env.PACASA_ENABLE_DEMO_DOC_OCR !== '1') {
        respond(res, 503, { error: 'El lector de documentos de demostración está deshabilitado.' }, origin);
        return;
      }
      const document = parseDocumentRequest(await readDocumentJson(req));
      if (!document) { respond(res, 400, { error: 'Documento inválido o sin consentimiento.' }, origin); return; }
      const extracted = await documentTextFromGemini(document, GEMINI_API_KEY, MODEL, fetchModel);
      respond(res, 200, extracted, origin);
      return;
    }
    const parsed = parseAssistantRequest(await readJson(req));
    if (!parsed) {
      respond(res, 400, { error: 'La solicitud no es válida.' }, origin);
      return;
    }
    const streaming = req.url === '/assistant/stream';
    if (streaming && parsed.mode !== 'chat') {
      respond(res, 400, { error: 'El modo de transmisión es para el chat.' }, origin);
      return;
    }
    const modelRequest = buildGeminiRequest(parsed);
    if (streaming) {
      // Streaming cannot use the JSON output constraint — swap the
      // JSON-reply sentence in CHAT_INSTRUCTIONS for a plain-text one
      // instead of appending a contradictory note the model may ignore.
      modelRequest.systemInstruction.parts[0].text =
        modelRequest.systemInstruction.parts[0].text.replace(
          'Output only a JSON object with one string key: "reply".',
          'Output plain conversational text only — no JSON, no markdown code fences.',
        );
      modelRequest.generationConfig = { maxOutputTokens: 1200 };
    }
    const response = await fetchModel(
      'https://generativelanguage.googleapis.com/v1beta/models/' + MODEL +
        (streaming ? ':streamGenerateContent?alt=sse' : ':generateContent'),
      {
        method: 'POST',
        headers: {
          'x-goog-api-key': GEMINI_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(modelRequest),
        signal: AbortSignal.timeout(15_000),
      },
    );
    if (!response.ok) throw new Error('model-unavailable');
    if (streaming) {
      let place = null;
      try { place = await resolveDirectionPlace(parsed.text, MAP_KEYS); }
      catch { /* Optional location lookup must not break chat. */ }
      await streamGeminiAnswer(response, res, parsed, origin, ALLOWED_ORIGINS, place);
      return;
    }
    const payload = await response.json();
    respond(res, 200, parseGeminiResponse(payload, parsed), origin);
  } catch (error) {
    const status = error instanceof Error && error.message === 'request-too-large' ? 413 :
      error instanceof Error && error.message === 'invalid-json' ? 400 : 502;
    respond(res, status,
      { error: 'Pa’Casa no pudo completar la solicitud. Inténtalo otra vez.' }, origin);
  }
}

if (process.argv[1] && import.meta.url === new URL('file://' + process.argv[1]).href) {
  createServer((req, res) => { void handleAssistantRequest(req, res); })
    .listen(PORT, HOST, () => {
      // Only report bind address; never print requests, credentials or contents.
      console.log('Pa\'Casa assistant API listening on ' + HOST + ':' + PORT);
    });
}
