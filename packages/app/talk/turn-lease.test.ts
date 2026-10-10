import test from 'node:test';
import assert from 'node:assert/strict';
import { createTurnLease } from './turn-lease.ts';

test('duplicate permission or translation starts cannot acquire the same turn', () => {
  const lease = createTurnLease();
  const first = lease.begin();
  assert.notEqual(first, null);
  assert.equal(lease.begin(), null);
});
test('revoking consent invalidates an outstanding permission response', async () => {
  const lease = createTurnLease();
  const token = lease.begin();
  assert.notEqual(token, null);
  let startMic = false;
  const permission = Promise.resolve(true).then(() => { if (token !== null && lease.current(token)) startMic = true; });
  lease.invalidate();
  await permission;
  assert.equal(startMic, false);
});
test('old finally callback cannot unlock a newer request', () => {
  const lease = createTurnLease();
  const old = lease.begin()!;
  lease.invalidate();
  const current = lease.begin()!;
  lease.release(old);
  assert.equal(lease.begin(), null);
  assert.equal(lease.current(old), false);
  assert.equal(lease.current(current), true);
});
test('a newer turn invalidates old TTS callbacks after a completed request', () => {
  const lease = createTurnLease();
  const first = lease.begin()!;
  lease.release(first);
  const second = lease.begin()!;
  assert.equal(lease.current(first), false);
  assert.equal(lease.current(second), true);
});
