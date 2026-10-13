interface Playback {
  stop: () => void;
  done: Promise<boolean>;
}

interface VoiceRequest {
  request: (signal: AbortSignal) => Promise<Response>;
  play: (audio: ArrayBuffer) => Playback;
  current: () => boolean;
  fallback: () => void;
  finish: () => void;
}

/** Owns a single voice download and playback, including cancellation during decoding. */
export function createVoicePlayback() {
  let generation = 0;
  let controller: AbortController | null = null;
  let playback: Playback | null = null;

  const stop = () => {
    generation += 1;
    controller?.abort();
    controller = null;
    playback?.stop();
    playback = null;
  };

  return {
    stop,
    async speak(options: VoiceRequest) {
      stop();
      const token = generation;
      const request = new AbortController();
      controller = request;
      const timeout = setTimeout(() => request.abort(), 20_000);
      const current = () => token === generation && options.current();
      try {
        const response = await options.request(request.signal);
        if (!current()) return;
        if (!response.ok) { options.fallback(); return; }
        const audio = await response.arrayBuffer();
        clearTimeout(timeout);
        if (!current()) return;
        const spoken = options.play(audio);
        playback = spoken;
        const played = await spoken.done;
        if (playback === spoken) playback = null;
        if (current()) {
          if (played) options.finish();
          else options.fallback();
        }
      } catch {
        if (current()) options.fallback();
      } finally {
        clearTimeout(timeout);
        if (controller === request) controller = null;
      }
    },
  };
}
