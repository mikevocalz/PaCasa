import { create } from 'zustand';
import type { TalkPhase, TalkSpeaker, TalkTurn } from './model';

export interface TalkState {
  speaker: TalkSpeaker;
  phase: TalkPhase;
  partial: string;
  typedText: string;
  consent: boolean;
  muted: boolean;
  error: string | null;
  turns: readonly TalkTurn[];
  setSpeaker: (speaker: TalkSpeaker) => void;
  setPhase: (phase: TalkPhase) => void;
  setPartial: (partial: string) => void;
  setTypedText: (value: string) => void;
  setConsent: (value: boolean) => void;
  setMuted: (value: boolean) => void;
  setError: (error: string | null) => void;
  appendTurn: (speaker: TalkSpeaker, original: string, translation: string) => void;
  reset: () => void;
}
const empty: Pick<TalkState, 'speaker' | 'phase' | 'partial' | 'typedText' |
  'consent' | 'muted' | 'error' | 'turns'> = {
    speaker: 'doctor', phase: 'idle', partial: '', typedText: '',
    consent: false, muted: false, error: null, turns: [],
  };

/** Live translation is ephemeral. Neither transcripts nor raw audio are persisted. */
export const useTalkStore = create<TalkState>((set) => ({
  ...empty,
  setSpeaker: (speaker) => set({ speaker, error: null, partial: '', typedText: '' }),
  setPhase: (phase) => set({ phase }),
  setPartial: (partial) => set({ partial: partial.slice(0, 2000) }),
  setTypedText: (typedText) => set({ typedText: typedText.slice(0, 2000) }),
  setConsent: (consent) => set({ consent }),
  setMuted: (muted) => set({ muted }),
  setError: (error) => set({ error, phase: error ? 'error' : 'idle' }),
  appendTurn: (speaker, original, translation) => set((state) => ({
    turns: [...state.turns.slice(-11), {
      id: (state.turns.at(-1)?.id ?? 0) + 1, speaker, original, translation,
    }],
    partial: '', typedText: '', error: null,
  })),
  reset: () => set(empty),
}));
