'use client';

import { OrbOverlay } from '@native-springs/shaders';
import type { ConversationState } from '@native-springs/shaders';
import { View } from '@acme/ui/tw';
import type { TalkPhase } from './model';

/** MattewSRC's native OpenGL/Metal orb. The render state mirrors the actual
 * speech lifecycle; no dummy visualizer timer and no nested HTML. */
export function TalkOrb({ phase }: { phase: TalkPhase }) {
  const state: ConversationState = phase === 'translating' ? 'thinking'
    : phase === 'listening' ? 'listening'
    : phase === 'speaking' ? 'speaking'
    : phase === 'error' ? 'error' : 'idle';
  return (
    <View accessible accessibilityLabel={'Indicador visual de traducción: ' + phase}
      className="mx-auto h-56 w-full max-w-xs overflow-hidden rounded-3xl bg-ink-950">
      <OrbOverlay
        state={state}
        mode={phase === 'listening' ? 'focused' : phase === 'translating' ? 'prismatic' : 'balanced'}
        confidence={1}
        parameters={{
          color: '#73D9F7',
          secondaryColor: '#CE86FF',
          intensity: 1,
          renderScale: 0.75,
          transitionDuration: 0.5,
        }}
        style={{ width: '100%', height: 224 }}
      />
    </View>
  );
}
