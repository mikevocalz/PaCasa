/** One decoded spoken utterance in flight. */
export interface UtterancePlayback {
  /** Stops playback; safe to call more than once. Resolves done as cancelled. */
  stop: () => void;
  /**
   * Resolves true when the utterance played to the end, false when it was
   * stopped or failed to decode/play. Callers use this to reset UI phase.
   */
  done: Promise<boolean>;
}
