/**
 * Voice and audio on native. The device has a microphone, but this build ships
 * no on-device speech engine, so dictation and read-aloud report as
 * unavailable rather than pretending (the Camera Lab rule: an honest fallback,
 * never a substitute).
 */

export type VoiceSupport = 'available' | 'unsupported';

export const canSpeak = (): boolean => false;

export const speak = (_text: string, _lang?: string): boolean => false;

export function stopSpeaking(): void {
  // Nothing to stop: no speech engine is mounted on this platform.
}

export const canListen = (): boolean => false;

export const listen = (_onResult: (transcript: string) => void, _onEnd?: () => void): (() => void) | null => null;

export const microphoneAvailable = (): boolean => true;

export const voiceInputStatus = (): VoiceSupport => 'unsupported';

export const speechOutputStatus = (): VoiceSupport => 'unsupported';