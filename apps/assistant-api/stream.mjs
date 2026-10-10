import { makeOpenUICards } from './core.mjs';

export function decodeGeminiPacket(raw) {
  try {
    const parts = JSON.parse(raw)?.candidates?.[0]?.content?.parts;
    return Array.isArray(parts) ? parts.map((part) => typeof part.text === 'string' ? part.text : '').join('') : '';
  } catch { return ''; }
}
export const sse = (event, payload) => 'event: ' + event + '\ndata: ' + JSON.stringify(payload) + '\n\n';

/** Server controls the only allowed events/UI. Upstream fragments are never rendered as executable UI. */
export async function streamGeminiAnswer(response, res, request, origin, allowedOrigins) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-store, no-cache, private',
    'X-Accel-Buffering': 'no',
    'X-Content-Type-Options': 'nosniff',
    ...(origin && allowedOrigins.has(origin) ? { Vary: 'Origin', 'Access-Control-Allow-Origin': origin } : {}),
  });
  let buffer = '';
  let text = '';
  const decoder = new TextDecoder();
  const consume = (raw) => {
    const data = raw.replaceAll('\r', '').split('\n')
      .filter((line) => line.startsWith('data:'))
      .map((line) => line.slice(5).trim()).join('\n');
    if (!data || data === '[DONE]') return;
    const delta = decodeGeminiPacket(data);
    if (!delta) return;
    text += delta;
    if (text.length > 4000) throw new Error('response-too-long');
    if (!res.destroyed) res.write(sse('delta', { text: delta }));
  };
  try {
    if (!response.body) throw new Error('stream-unavailable');
    for await (const bytes of response.body) {
      if (res.destroyed) return;
      buffer += decoder.decode(bytes, { stream: true });
      buffer = buffer.replaceAll('\r\n', '\n');
      if (buffer.length > 24000) throw new Error('upstream-packet-too-long');
      let idx;
      while ((idx = buffer.indexOf('\n\n')) >= 0) {
        consume(buffer.slice(0, idx));
        buffer = buffer.slice(idx + 2);
      }
    }
    buffer += decoder.decode();
    if (buffer.trim()) consume(buffer);
    if (!text.trim()) throw new Error('empty-response');
    res.write(sse('done', { reply: text.trim(), ui: makeOpenUICards(request, text.trim()) }));
  } catch {
    if (!res.destroyed) res.write(sse('error', { message: 'La respuesta fue interrumpida. Inténtalo de nuevo.' }));
  } finally { if (!res.destroyed) res.end(); }
}
