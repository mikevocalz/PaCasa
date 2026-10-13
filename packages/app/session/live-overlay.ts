import { create } from 'zustand';
import type { Grounding } from './grounding';
import type { Direction, Translation } from './phrasebook';

/**
 * Pa'Casa Live overlay state. The overlay is a modal command surface, not a
 * route: opening records the pathname it came from (`returnTo`) and closing
 * only clears `open`, so the underlying tab selection never moves.
 *
 * All of the overlay's UI state lives here — Zustand is the only app-state
 * authority (repo rule: no React useState). Speech engine handles stay
 * imperative (refs in the component), as they are not serialisable state.
 */

export type LiveMode = 'hablar' | 'traducir' | 'preguntar';

/** A Preguntar exchange: what the patient asked and the grounded answer. */
export interface LiveGroundedAnswer {
  asked: string;
  grounding: Grounding;
}

/** A Traducir result plus the input that produced it (the UI echoes both). */
export interface LiveTranslation extends Translation {
  asked: string;
}

interface LiveOverlayState {
  open: boolean;
  mode: LiveMode;
  /** The screen Pa'Casa Live was opened from; closing returns to it. */
  returnTo: string;
  // Hablar: the typed answer, the proposed answer awaiting "Sí, correcto",
  // and whether the dictation engine is hearing right now.
  draft: string;
  proposal: string | null;
  listening: boolean;
  // Traducir: direction, the free-text input and the last result.
  direction: Direction;
  phraseInput: string;
  translation: LiveTranslation | null;
  // Preguntar: the free-text input and the last grounded answer.
  questionInput: string;
  groundedAnswer: LiveGroundedAnswer | null;
  openLive: (returnTo: string, mode?: LiveMode) => void;
  closeLive: () => void;
  setMode: (mode: LiveMode) => void;
  setDraft: (draft: string) => void;
  setProposal: (proposal: string | null) => void;
  setListening: (listening: boolean) => void;
  setDirection: (direction: Direction) => void;
  setPhraseInput: (phraseInput: string) => void;
  setTranslation: (translation: LiveTranslation | null) => void;
  setQuestionInput: (questionInput: string) => void;
  setGroundedAnswer: (groundedAnswer: LiveGroundedAnswer | null) => void;
}

export const useLiveOverlay = create<LiveOverlayState>((set) => ({
  open: false,
  mode: 'hablar',
  returnTo: '/',
  draft: '',
  proposal: null,
  listening: false,
  direction: 'en-es',
  phraseInput: '',
  translation: null,
  questionInput: '',
  groundedAnswer: null,
  openLive: (returnTo, mode) => set({ open: true, returnTo, mode: mode ?? 'hablar' }),
  // A pending proposal dies with the surface it was spoken on: the patient
  // must see "Así lo entendí" and say yes, it may never confirm in absentia.
  closeLive: () => set({ open: false, proposal: null, listening: false }),
  setMode: (mode) => set({ mode }),
  setDraft: (draft) => set({ draft }),
  setProposal: (proposal) => set({ proposal }),
  setListening: (listening) => set({ listening }),
  setDirection: (direction) => set({ direction }),
  setPhraseInput: (phraseInput) => set({ phraseInput }),
  setTranslation: (translation) => set({ translation }),
  setQuestionInput: (questionInput) => set({ questionInput }),
  setGroundedAnswer: (groundedAnswer) => set({ groundedAnswer }),
}));
