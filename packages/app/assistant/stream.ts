/** SSE vocabulary is strictly bounded: model messages never run arbitrary UI actions. */
export type AssistantStreamFrame =
  | { kind: 'delta'; text: string }
  | { kind: 'done'; reply: string; ui?: string }
  | { kind: 'error'; message: string };

export function parseStreamFrame(raw: string): AssistantStreamFrame | null {
  const lines = raw.replaceAll('\r', '').split('\n');
  const kind = lines.find((line) => line.startsWith('event:'))?.slice(6).trim();
  const rawData = lines.filter((line) => line.startsWith('data:')).map((line) => line.slice(5).trim()).join('\n');
  if (!kind || rawData.length > 16000) return null;
  let decoded: unknown;
  try { decoded = JSON.parse(rawData); } catch { return null; }
  if (!decoded || typeof decoded !== 'object') return null;
  const data = decoded as { text?: unknown; reply?: unknown; ui?: unknown; message?: unknown };
  if (kind === 'delta' && typeof data.text === 'string' && data.text.length <= 4000) {
    return { kind: 'delta', text: data.text };
  }
  if (kind === 'done' && typeof data.reply === 'string' && data.reply.trim() && data.reply.length <= 4000) {
    return { kind: 'done', reply: data.reply, ...(typeof data.ui === 'string' && data.ui.length <= 12000 ? { ui: data.ui } : {}) };
  }
  if (kind === 'error' && typeof data.message === 'string' && data.message.length <= 200) {
    return { kind: 'error', message: data.message };
  }
  return null;
}

export async function readAssistantStream(
  response: Response,
  onDelta: (text: string) => void,
): Promise<{ reply: string; ui?: string }> {
  if (!response.ok) throw new Error('El servidor no respondió.');
  if (!response.headers.get('content-type')?.includes('text/event-stream')) {
    throw new Error('El servidor no habilitó la transmisión en tiempo real.');
  }
  const reader = response.body?.getReader();
  if (!reader) throw new Error('Este dispositivo no pudo transmitir la respuesta.');
  const decoder = new TextDecoder();
  let pending = '';
  let text = '';
  let completed: { reply: string; ui?: string } | null = null;
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      pending += decoder.decode(value, { stream: true });
      pending = pending.replaceAll('\r\n', '\n');
      if (pending.length > 24000) throw new Error('La respuesta fue demasiado larga.');
      let split;
      while ((split = pending.indexOf('\n\n')) >= 0) {
        const frame = parseStreamFrame(pending.slice(0, split));
        pending = pending.slice(split + 2);
        if (frame?.kind === 'delta') {
          text += frame.text;
          if (text.length > 4000) throw new Error('La respuesta fue demasiado larga.');
          onDelta(text);
        } else if (frame?.kind === 'done') {
          completed = { reply: frame.reply, ui: frame.ui };
        } else if (frame?.kind === 'error') {
          throw new Error(frame.message);
        }
      }
    }
    if (!completed) throw new Error('La respuesta se interrumpió antes de terminar.');
    return completed;
  } finally { reader.releaseLock(); }
}
