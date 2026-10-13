import { AudioContext, decodeAudioData } from 'react-native-audio-api';
import type { UtterancePlayback } from './voice.types';

export type { UtterancePlayback } from './voice.types';

/**
 * Play spoken audio bytes (mp3) through react-native-audio-api, the same Web
 * Audio surface AudioPlayer uses for voice notes. Each utterance owns a fresh
 * context — they are short and sequential, so sharing is not worth the
 * lifecycle bookkeeping.
 */
export function playUtterance(bytes: ArrayBuffer): UtterancePlayback {
  const context = new AudioContext();
  let resolveDone: (played: boolean) => void = () => {};
  const done = new Promise<boolean>((resolve) => { resolveDone = resolve; });
  let stopped = false;
  let source: ReturnType<AudioContext['createBufferSource']> | null = null;

  void decodeAudioData(bytes)
    .then((buffer) => {
      if (stopped) { resolveDone(false); return; }
      const node = context.createBufferSource();
      node.buffer = buffer;
      node.connect(context.destination);
      node.onended = () => { resolveDone(!stopped); };
      node.start(0);
      source = node;
    })
    .catch(() => resolveDone(false));

  return {
    done,
    stop: () => {
      if (stopped) return;
      stopped = true;
      try { source?.stop(); } catch { /* already ended */ }
      resolveDone(false);
      void context.close();
    },
  };
}
