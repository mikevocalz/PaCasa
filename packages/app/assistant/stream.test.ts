import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseStreamFrame, readAssistantStream } from './stream.ts';

test('supports fragmented web/native SSE chunks', async () => {
  const chunks = ['event: delta\ndata: {"text":"Ho', 'la"}\n\nevent: done\ndata: {"reply":"Hola"}\n\n'];
  const encoder = new TextEncoder();
  const response = new Response(new ReadableStream({
    start(controller) { chunks.forEach((chunk) => controller.enqueue(encoder.encode(chunk))); controller.close(); },
  }), { headers: { 'Content-Type': 'text/event-stream' } });
  const seen: string[] = [];
  assert.equal((await readAssistantStream(response, (value) => seen.push(value))).reply, 'Hola');
  assert.deepEqual(seen, ['Hola']);
});

test('rejects invalid frames and missing done', async () => {
  assert.equal(parseStreamFrame('event: done\ndata: {"reply":""}'), null);
  const response = new Response('event: delta\ndata: {"text":"partial"}\n\n', { headers: { 'Content-Type': 'text/event-stream' } });
  await assert.rejects(readAssistantStream(response, () => {}), /interrumpió/);
});
