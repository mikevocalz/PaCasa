'use client';

import { ChatOrb } from '../assistant/ChatOrb';
import type { TalkPhase } from './model';

/** Website uses the already-owned cross-platform Three.js/WebGPU orb.
 * Native uses MatthewSRC's Metal/OpenGL OrbOverlay. */
export function TalkOrb({ phase }: { phase: TalkPhase }) {
  return <ChatOrb busy={phase === 'listening' || phase === 'translating' || phase === 'speaking'} />;
}
