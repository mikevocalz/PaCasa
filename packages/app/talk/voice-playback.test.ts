import assert from 'node:assert/strict';
import test from 'node:test';
import { createVoicePlayback } from './voice-playback.ts';

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}

function fixture() {
  const voice = createVoicePlayback();
  const calls = { play: 0, stop: 0, fallback: 0, finish: 0 };
  const done = deferred<boolean>();
  const options = {
    request: async (_signal: AbortSignal) => new Response(new Uint8Array([1])),
    play: (_audio: ArrayBuffer) => {
      calls.play += 1;
      return { stop: () => { calls.stop += 1; done.resolve(false); }, done: done.promise };
    },
    current: () => true,
    fallback: () => { calls.fallback += 1; },
    finish: () => { calls.finish += 1; },
  };
  return { voice, calls, done, options };
}

test('closing aborts an in-flight voice request without device fallback', async () => {
  const { voice, calls, options } = fixture();
  const response = deferred<Response>();
  let signal: AbortSignal | undefined;
  const speaking = voice.speak({ ...options, request: (input) => { signal = input; return response.promise; } });
  voice.stop();
  assert.equal(signal?.aborted, true);
  response.resolve(new Response(new Uint8Array([1])));
  await speaking;
  assert.deepEqual(calls, { play: 0, stop: 0, fallback: 0, finish: 0 });
});

test('cancelling while the response body loads never starts playback', async () => {
  const { voice, calls, options } = fixture();
  const body = deferred<ArrayBuffer>();
  const reading = deferred<void>();
  const response = new Response();
  response.arrayBuffer = () => { reading.resolve(); return body.promise; };
  const speaking = voice.speak({ ...options, request: async () => response });
  await reading.promise;
  voice.stop();
  body.resolve(new ArrayBuffer(1));
  await speaking;
  assert.equal(calls.play, 0);
  assert.equal(calls.fallback, 0);
});

test('muting stops active playback without restarting device speech', async () => {
  const { voice, calls, options } = fixture();
  const started = deferred<void>();
  const speaking = voice.speak({ ...options, play: (audio) => { started.resolve(); return options.play(audio); } });
  await started.promise;
  voice.stop();
  await speaking;
  assert.deepEqual(calls, { play: 1, stop: 1, fallback: 0, finish: 0 });
});

test('an old completion cannot lose ownership of a newer playback', async () => {
  const { voice, calls, options } = fixture();
  const firstDone = deferred<boolean>();
  const firstStarted = deferred<void>();
  const first = voice.speak({ ...options, play: () => {
    firstStarted.resolve();
    return { stop: () => {}, done: firstDone.promise };
  } });
  await firstStarted.promise;
  const nextStarted = deferred<void>();
  const next = voice.speak({ ...options, play: (audio) => { nextStarted.resolve(); return options.play(audio); } });
  await nextStarted.promise;
  firstDone.resolve(true);
  await first;
  voice.stop();
  await next;
  assert.deepEqual(calls, { play: 1, stop: 1, fallback: 0, finish: 0 });
});

test('revoked ownership after downloading the body suppresses playback', async () => {
  const { voice, calls, options } = fixture();
  let current = true;
  const response = new Response();
  response.arrayBuffer = async () => { current = false; return new ArrayBuffer(1); };
  await voice.speak({ ...options, current: () => current, request: async () => response });
  assert.equal(calls.play, 0);
});

test('request failure uses the device fallback once', async () => {
  const { voice, calls, options } = fixture();
  await voice.speak({ ...options, request: async () => { throw new Error('offline'); } });
  assert.deepEqual(calls, { play: 0, stop: 0, fallback: 1, finish: 0 });
});

test('successful audio resets the phase without fallback', async () => {
  const { voice, calls, done, options } = fixture();
  done.resolve(true);
  await voice.speak(options);
  assert.deepEqual(calls, { play: 1, stop: 0, fallback: 0, finish: 1 });
});

test('HTTP failure uses device speech without attempting audio playback', async () => {
  const { voice, calls, options } = fixture();
  await voice.speak({ ...options, request: async () => new Response(null, { status: 503 }) });
  assert.deepEqual(calls, { play: 0, stop: 0, fallback: 1, finish: 0 });
});

test('failed audio playback falls back while the turn is still current', async () => {
  const { voice, calls, done, options } = fixture();
  done.resolve(false);
  await voice.speak(options);
  assert.deepEqual(calls, { play: 1, stop: 0, fallback: 1, finish: 0 });
});
