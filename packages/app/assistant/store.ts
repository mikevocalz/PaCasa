import { create } from 'zustand';
import type { AssistantLanguage, AssistantMessage, AssistantMode, AssistantRole } from './contract.ts';
import type { AssistantSurfaceMode } from './modes.ts';

/** Ephemeral assistant session. Never persisted, shared with no analytics SDK. */
export const useAssistantStore = create<{
  open: boolean;
  mode: AssistantSurfaceMode;
  sourceLanguage: AssistantLanguage;
  draft: string;
  messages: readonly AssistantMessage[];
  busy: boolean;
  streamingText: string;
  consent: boolean;
  error: string | null;
  voiceNotice: string | null;
  openAssistant: (mode?: AssistantSurfaceMode) => void;
  closeAssistant: () => void;
  setMode: (mode: AssistantSurfaceMode) => void;
  setSourceLanguage: (language: AssistantLanguage) => void;
  setDraft: (text: string) => void;
  setConsent: (consent: boolean) => void;
  setBusy: (busy: boolean) => void;
  setStreamingText: (text: string) => void;
  setError: (error: string | null) => void;
  setVoiceNotice: (notice: string | null) => void;
  appendMessage: (mode: AssistantMode, role: AssistantRole, text: string, ui?: string) => void;
}>((set) => ({
  open: false,
  mode: 'chat',
  sourceLanguage: 'en',
  draft: '',
  messages: [],
  busy: false,
  streamingText: '',
  consent: false,
  error: null,
  voiceNotice: null,
  openAssistant: (mode = 'chat') => set({ open: true, mode, error: null, voiceNotice: null }),
  // Consent survives open/close: it is a session grant, not per-message UI
  // state. The transcript still clears on close.
  closeAssistant: () => set({
    open: false, mode: 'chat', sourceLanguage: 'en', draft: '',
    messages: [], busy: false, streamingText: '', error: null, voiceNotice: null,
  }),
  setMode: (mode) => set({ mode, draft: '', streamingText: '', error: null, voiceNotice: null }),
  setSourceLanguage: (sourceLanguage) => set({ sourceLanguage, error: null }),
  setDraft: (draft) => set({ draft }),
  setConsent: (consent) => set({ consent }),
  setBusy: (busy) => set({ busy }),
  setStreamingText: (streamingText) => set({ streamingText }),
  setError: (error) => set({ error }),
  setVoiceNotice: (voiceNotice) => set({ voiceNotice }),
  appendMessage: (mode, role, text, ui) => set((s) => ({
    messages: [...s.messages, { id: (s.messages.at(-1)?.id ?? 0) + 1, mode, role, text, ui }],
  })),
}));
