import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toOcrImageBuffer } from './normalize.ts';

test('converts Android RGBA and iOS BGRA to the same RGB pixels', () => {
  const rgba = toOcrImageBuffer({
    buffer: new Uint8Array([30, 60, 90, 255]).buffer, width: 1, height: 1, pixelFormat: 'RGBA',
  });
  const bgra = toOcrImageBuffer({
    buffer: new Uint8Array([90, 60, 30, 255]).buffer, width: 1, height: 1, pixelFormat: 'BGRA',
  });
  assert.deepEqual([...rgba.data], [30, 60, 90]);
  assert.deepEqual([...bgra.data], [30, 60, 90]);
});

test('rejects unsupported channel ordering or corrupted frames', () => {
  assert.throws(() => toOcrImageBuffer({
    buffer: new Uint8Array(4).buffer, width: 1, height: 1, pixelFormat: 'unknown',
  }));
  assert.throws(() => toOcrImageBuffer({
    buffer: new Uint8Array(3).buffer, width: 2, height: 1, pixelFormat: 'RGB',
  }));
});
