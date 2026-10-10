/**
 * Voice and audio on web: the browser's own speech synthesis for reading
 * questions back, and its speech recognition for dictating an answer. Both are
 * reported honestly — when the browser has no engine, the screens say so and
 * offer the keyboard instead of pretending to listen.
 */

export type VoiceSupport = 'available' | 'unsupported';

const SPANISH = 'es-MX';

export const canSpeak = (): boolean => typeof window !== 'undefined' && 'speechSynthesis' in window;

/** Read text aloud. False when this browser has no speech engine. */
export function speak(text: string, lang: string = SPANISH): boolean {
  if (!canSpeak() || text.trim().length === 0) return false;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
  return true;
}

export function stopSpeaking(): void {
  if (canSpeak()) window.speechSynthesis.cancel();
}

interface RecognitionAlternative {
  transcript: string;
}

interface RecognitionResult {
  length: number;
  [index: number]: RecognitionAlternative;
}

interface RecognitionResultList {
  length: number;
  [index: number]: RecognitionResult;
}

interface RecognitionResultEvent {
  results: RecognitionResultList;
}

interface RecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: RecognitionResultEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
}

type RecognitionCtor = new () => RecognitionLike;

interface SpeechWindow {
  SpeechRecognition?: RecognitionCtor;
  webkitSpeechRecognition?: RecognitionCtor;
}

const recognitionCtor = (): RecognitionCtor | null => {
  if (typeof window === 'undefined') return null;
  const scope = window as unknown as SpeechWindow;
  return scope.SpeechRecognition ?? scope.webkitSpeechRecognition ?? null;
};

export const canListen = (): boolean => recognitionCtor() !== null;

/**
 * Listen for one Spanish answer. Calls back with the transcript, then `onEnd`.
 * Returns a cancel function, or null when the browser cannot listen.
 */
export function listen(onResult: (transcript: string) => void, onEnd?: () => void): (() => void) | null {
  const Ctor = recognitionCtor();
  if (!Ctor) return null;
  const recognition = new Ctor();
  recognition.lang = SPANISH;
  recognition.interimResults = false;
  recognition.continuous = false;
  recognition.maxAlternatives = 1;
  recognition.onresult = (event) => {
    const transcript = event.results[0]?.[0]?.transcript ?? '';
    if (transcript.trim()) onResult(transcript.trim());
  };
  recognition.onend = () => onEnd?.();
  recognition.onerror = () => onEnd?.();
  recognition.start();
  return () => {
    try {
      recognition.abort();
    } catch {
      // The engine already stopped on its own.
    }
  };
}

export const microphoneAvailable = (): boolean =>
  typeof navigator !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia);

export const voiceInputStatus = (): VoiceSupport => (canListen() ? 'available' : 'unsupported');

export const speechOutputStatus = (): VoiceSupport => (canSpeak() ? 'available' : 'unsupported');