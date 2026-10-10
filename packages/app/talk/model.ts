export type TalkSpeaker = 'doctor' | 'patient';
export type TalkPhase = 'idle' | 'listening' | 'translating' | 'speaking' | 'error';
export interface TalkTurn {
  readonly id: number;
  readonly speaker: TalkSpeaker;
  readonly original: string;
  readonly translation: string;
}
export function spokenLanguageForSpeaker(speaker: TalkSpeaker): 'en' | 'es' {
  return speaker === 'doctor' ? 'en' : 'es';
}
export function speechLocaleForSpeaker(speaker: TalkSpeaker): 'en-US' | 'es-US' {
  return speaker === 'doctor' ? 'en-US' : 'es-US';
}
export function spokenTranslationLocale(speaker: TalkSpeaker): 'en-US' | 'es-ES' {
  return speaker === 'doctor' ? 'es-ES' : 'en-US';
}
export function talkPhaseLabel(phase: TalkPhase): string {
  switch (phase) {
    case 'idle': return 'Listo para escuchar';
    case 'listening': return 'Escuchando…';
    case 'translating': return 'Traduciendo…';
    case 'speaking': return 'Reproduciendo traducción…';
    case 'error': return 'Necesita atención';
  }
}

/** The Talk screen NEVER uses chat history for translation: physician words must be
 * faithfully translated without supplying the model with patient backstory. */
export function boundedUtterance(text: string): string | null {
  const result = text.trim();
  return result.length > 0 && result.length <= 2000 ? result : null;
}
