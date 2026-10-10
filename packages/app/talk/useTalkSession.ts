'use client';

import { useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import * as Speech from 'expo-speech';
import { assistantReplyFromResponse, makeAssistantRequest } from '../assistant/contract';
import { boundedUtterance, spokenLanguageForSpeaker, spokenTranslationLocale, speechLocaleForSpeaker, type TalkSpeaker } from './model';
import { createTurnLease } from './turn-lease';
import { useTalkStore } from './store';

const ENDPOINT = Platform.OS === 'web' ? process.env.NEXT_PUBLIC_PACASA_ASSISTANT_URL : process.env.EXPO_PUBLIC_PACASA_ASSISTANT_URL;
export const talkEndpointAvailable = Boolean(ENDPOINT && (/^https:\/\//.test(ENDPOINT) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//.test(ENDPOINT)));

/** Zustand owns visible state; refs exclusively own permissions, recognition and request resources. */
export function useTalkSession(active: boolean) {
  const state = useTalkStore();
  const activeRef = useRef(active);
  const lease = useRef(createTurnLease()).current;
  const requestRef = useRef<AbortController | null>(null);
  const recognition = useRef<{ live: boolean; token: number | null; end: (() => void) | null }>({ live: false, token: null, end: null });
  const closing = useRef<Promise<void> | null>(null);
  const valid = (token: number) => activeRef.current && lease.current(token) && useTalkStore.getState().consent;

  const haltRecognition = (): Promise<void> => {
    if (closing.current) return closing.current;
    if (!recognition.current.live) return Promise.resolve();
    const shutdown = new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        recognition.current.end = null;
        reject(new Error('El micrófono no confirmó su cierre. Vuelve a abrir Hablar antes de continuar.'));
      }, 2500);
      recognition.current.end = () => { clearTimeout(timeout); resolve(); };
      try { ExpoSpeechRecognitionModule.abort(); }
      catch { clearTimeout(timeout); recognition.current.end = null; reject(new Error('No se pudo detener el micrófono.')); }
    });
    closing.current = shutdown;
    void shutdown.then(() => { if (closing.current === shutdown) closing.current = null; },
      () => { if (closing.current === shutdown) closing.current = null; });
    return shutdown;
  };
  const cancel = () => {
    lease.invalidate();
    requestRef.current?.abort();
    requestRef.current = null;
    recognition.current.token = null;
    useTalkStore.getState().reset();
    void haltRecognition().catch(() => {});
    void Speech.stop().catch(() => {});
  };
  useEffect(() => {
    activeRef.current = active;
    if (!active) cancel();
    const subscription = AppState.addEventListener('change', (next) => {
      if (next !== 'active') cancel();
    });
    return () => { subscription.remove(); activeRef.current = false; cancel(); };
    // Resources are terminated when leaving this screen, not on each store update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const speak = (text: string, speaker: TalkSpeaker, token: number) => {
    if (!valid(token)) return;
    const store = useTalkStore.getState();
    if (store.muted) { store.setPhase('idle'); return; }
    store.setPhase('speaking');
    Speech.speak(text, { language: spokenTranslationLocale(speaker), rate: 0.88,
      onDone: () => { if (valid(token)) useTalkStore.getState().setPhase('idle'); },
      onStopped: () => { if (valid(token)) useTalkStore.getState().setPhase('idle'); },
      onError: () => { if (valid(token)) useTalkStore.getState().setError('No se pudo reproducir. Puedes leer el texto.'); } });
  };
  const translate = async (raw: string) => {
    const store = useTalkStore.getState();
    if (!activeRef.current || !store.consent) return;
    const text = boundedUtterance(raw);
    if (!text || !ENDPOINT || !talkEndpointAvailable) { store.setError('Revisa la frase, el consentimiento y la conexión.'); return; }
    const token = lease.begin();
    if (token === null) return;
    const speaker = store.speaker;
    const request = makeAssistantRequest({ mode: 'translate', sourceLanguage: spokenLanguageForSpeaker(speaker), draft: text, messages: [] });
    if (!request) { lease.release(token); return; }
    const controller = new AbortController();
    requestRef.current = controller;
    let timedOut = false;
    const timeout = setTimeout(() => { timedOut = true; controller.abort(); }, 25_000);
    store.setPhase('translating');
    try {
      await haltRecognition();
      await Speech.stop();
      if (!valid(token)) return;
      const response = await fetch(ENDPOINT, { method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-PaCasa-Request': '1' },
        body: JSON.stringify({ ...request, consent: true }), signal: controller.signal });
      if (!response.ok) throw new Error(response.status === 401 ? 'Inicia sesión para usar el traductor.' : 'No se pudo contactar al traductor.');
      const translated = assistantReplyFromResponse(await response.json());
      if (!translated || translated.length > 4000) throw new Error('El resultado no es válido.');
      if (!controller.signal.aborted && valid(token)) {
        useTalkStore.getState().appendTurn(speaker, text, translated);
        speak(translated, speaker, token);
      }
    } catch (error) {
      if (valid(token)) useTalkStore.getState().setError(timedOut ? 'La traducción tardó demasiado. Intenta de nuevo.' : error instanceof Error ? error.message : 'Traducción no disponible.');
    } finally {
      clearTimeout(timeout);
      if (requestRef.current === controller) requestRef.current = null;
      lease.release(token);
    }
  };

  useSpeechRecognitionEvent('result', (event) => {
    const token = recognition.current.token;
    if (token === null || !valid(token) || useTalkStore.getState().phase !== 'listening') return;
    const transcript = event.results[0]?.transcript?.trim() ?? '';
    if (transcript) useTalkStore.getState().setPartial(transcript.slice(0, 2000));
    if (event.isFinal && transcript) void translate(transcript);
  });
  useSpeechRecognitionEvent('error', (event) => {
    if (event.error === 'aborted') return;
    const token = recognition.current.token;
    if (token === null || !valid(token) || useTalkStore.getState().phase !== 'listening') return;
    useTalkStore.getState().setError('No se reconoció la voz. Puedes escribir la frase.');
  });
  useSpeechRecognitionEvent('end', () => {
    recognition.current.live = false;
    const done = recognition.current.end;
    recognition.current.end = null;
    done?.();
    const token = recognition.current.token;
    recognition.current.token = null;
    if (token === null || !valid(token) || useTalkStore.getState().phase !== 'listening') return;
    const store = useTalkStore.getState();
    store.setPhase('idle');
    if (store.partial.trim()) store.setTypedText(store.partial);
  });

  const listenTo = async (speaker: TalkSpeaker) => {
    const store = useTalkStore.getState();
    if (!activeRef.current || store.phase === 'listening') return;
    if (!store.consent || !talkEndpointAvailable) { store.setError('Acepta el consentimiento y configura el servidor.'); return; }
    const token = lease.begin();
    if (token === null) return;
    try {
      await haltRecognition();
      await Speech.stop();
      if (!valid(token)) return;
      const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!valid(token)) return;
      if (!permission.granted) { useTalkStore.getState().setError('Sin permiso de micrófono. Puedes escribir la frase.'); return; }
      useTalkStore.getState().setSpeaker(speaker);
      useTalkStore.getState().setPartial('');
      useTalkStore.getState().setPhase('listening');
      recognition.current = { live: true, token, end: null };
      try { ExpoSpeechRecognitionModule.start({ lang: speechLocaleForSpeaker(speaker), interimResults: true, continuous: false, maxAlternatives: 1 }); }
      catch (error) { recognition.current.live = false; recognition.current.token = null; throw error; }
    } catch (error) {
      if (valid(token)) useTalkStore.getState().setError(error instanceof Error ? error.message : 'No se pudo iniciar el micrófono.');
    } finally { lease.release(token); }
  };
  const stopListening = () => {
    if (!activeRef.current || !useTalkStore.getState().consent || !recognition.current.live) return;
    // Await the recognizer's final result. An unfinished partial is never auto-sent as a final phrase.
    try { ExpoSpeechRecognitionModule.stop(); }
    catch { useTalkStore.getState().setError('No se pudo terminar la frase. Cancela y vuelve a intentar.'); }
  };
  const repeat = async () => {
    const store = useTalkStore.getState();
    const last = store.turns.at(-1);
    if (!last || !activeRef.current || !store.consent || store.phase === 'listening') return;
    const token = lease.begin();
    if (token === null) return;
    try { await haltRecognition(); await Speech.stop(); if (valid(token)) speak(last.translation, last.speaker, token); }
    catch { if (valid(token)) store.setError('No se pudo reproducir.'); }
    finally { lease.release(token); }
  };
  const toggleConsent = () => {
    if (useTalkStore.getState().consent) cancel();
    else if (activeRef.current) useTalkStore.getState().setConsent(true);
  };
  const toggleMuted = () => {
    const store = useTalkStore.getState();
    const muted = !store.muted;
    store.setMuted(muted);
    if (muted) { void Speech.stop().catch(() => {}); if (store.phase === 'speaking') store.setPhase('idle'); }
  };
  return { state, translate, listenTo, stopListening, repeat, toggleConsent, toggleMuted, cancel };
}
