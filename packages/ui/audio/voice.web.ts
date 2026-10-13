import type { UtterancePlayback } from './voice.types';

export type { UtterancePlayback } from './voice.types';

/**
 * Play spoken audio bytes (mp3) in the browser. Uses an HTMLAudioElement on a
 * blob URL: decode and output routing are handled for us, and playback started
 * inside a user-driven talk session is allowed by autoplay policy.
 */
export function playUtterance(bytes: ArrayBuffer): UtterancePlayback {
  const url = URL.createObjectURL(new Blob([bytes], { type: 'audio/mpeg' }));
  const audio = new Audio(url);
  const done = new Promise<boolean>((resolve) => {
    audio.onended = () => resolve(true);
    audio.onerror = () => resolve(false);
  });
  let stopped = false;
  const playback: UtterancePlayback = {
    done,
    stop: () => {
      if (stopped) return;
      stopped = true;
      audio.pause();
      URL.revokeObjectURL(url);
    },
  };
  void done.finally(() => URL.revokeObjectURL(url));
  void audio.play().catch(() => {
    // Autoplay blocked or decode failed — report via done, callers fall back.
    audio.onerror?.(new Event('error'));
  });
  return playback;
}
