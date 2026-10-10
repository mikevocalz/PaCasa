import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ASSISTANT_STAGES, isAssistantSurfaceMode } from './modes.ts';

test('center assistant has exactly three mutually exclusive stages', () => {
  assert.deepEqual(ASSISTANT_STAGES.map((s) => s.mode), ['chat', 'scan', 'talk']);
  assert.equal(new Set(ASSISTANT_STAGES.map((s) => s.label)).size, 3);
  assert.equal(isAssistantSurfaceMode('translate'), false);
  assert.equal(isAssistantSurfaceMode('talk'), true);
});
