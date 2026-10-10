'use client';

import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import * as Speech from 'expo-speech';
import { Pressable, Text, TextInput, View } from '@acme/ui/tw';
import { Mic, Play, Square, Volume2, VolumeX } from '@acme/ui/icons';
import { assistantReplyFromResponse, makeAssistantRequest } from '../assistant/contract';
import {
  boundedUtterance, spokenLanguageForSpeaker, spokenTranslationLocale,
  speechLocaleForSpeaker, talkPhaseLabel, type TalkSpeaker,
} from './model';
import { useTalkStore } from './store';
import { TalkOrb } from './TalkOrb';

const ENDPOINT = Platform.OS === 'web'
  ? process.env.NEXT_PUBLIC_PACASA_ASSISTANT_URL
  : process.env.EXPO_PUBLIC_PACASA_ASSISTANT_URL;
const endpointAvailable = Boolean(ENDPOINT &&
  (/^https:\/\//.test(ENDPOINT) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//.test(ENDPOINT)));

/**
 * Patient-to-doctor voice interpretation, one utterance at a time.
 * 1. User explicitly taps who's speaking; on-device/browser speech recognition
 *    provides partial captions and then a final transcript.
 * 2. The existing Gemini translation endpoint receives ONLY that text.
 * 3. The opposite language is displayed and spoken through Expo Speech.
 *
 * No simultaneous two-mic recording, no voice cloning, and no persisted audio.
 * Stop input BEFORE TTS so the device never retranscribes its own speaker.
 */
export function TalkWorkspace({ active }: { active: boolean }) {
  const state = useTalkStore();
  const activeRef = useRef(active);
  const requestRef = useRef<AbortController | null>(null);
  const finalizingRef = useRef(false);

  const cancel = () => {
    requestRef.current?.abort();
    requestRef.current = null;
    finalizingRef.current = false;
    ExpoSpeechRecognitionModule.stop();
    void Speech.stop();
    useTalkStore.getState().reset();
  };
  useEffect(() => {
    activeRef.current = active;
    if (!active) cancel();
    return () => {
      activeRef.current = false;
      cancel();
    };
    // The session is terminated only when leaving Talk or closing the modal.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const speak = (translated: string, speaker: TalkSpeaker) => {
    if (!activeRef.current) return;
    const store = useTalkStore.getState();
    if (store.muted) { store.setPhase('idle'); return; }
    store.setPhase('speaking');
    Speech.speak(translated, {
      language: spokenTranslationLocale(speaker),
      rate: 0.88,
      onDone: () => { if (activeRef.current) useTalkStore.getState().setPhase('idle'); },
      onStopped: () => { if (activeRef.current) useTalkStore.getState().setPhase('idle'); },
      onError: () => { if (activeRef.current) useTalkStore.getState().setError('No se pudo reproducir. Puedes leer el texto o tocar Repetir.'); },
    });
  };

  const translate = async (raw: string) => {
    if (finalizingRef.current || requestRef.current || !activeRef.current) return;
    const text = boundedUtterance(raw);
    if (!text) {
      useTalkStore.getState().setError('Revisa la frase: máximo 2,000 caracteres.');
      return;
    }
    const source = useTalkStore.getState().speaker;
    const request = makeAssistantRequest({
      mode: 'translate', sourceLanguage: spokenLanguageForSpeaker(source), draft: text, messages: [],
    });
    if (!request || !ENDPOINT || !endpointAvailable || !useTalkStore.getState().consent) {
      useTalkStore.getState().setError('Confirma el consentimiento y verifica la conexión antes de traducir.');
      return;
    }
    finalizingRef.current = true;
    // Do not listen to our own playback.
    ExpoSpeechRecognitionModule.stop();
    const controller = new AbortController();
    requestRef.current = controller;
    useTalkStore.getState().setPhase('translating');
    try {
      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(request),
        signal: controller.signal,
      });
      if (!response.ok) throw new Error('No se pudo contactar al traductor.');
      const result: unknown = await response.json();
      const translated = assistantReplyFromResponse(result);
      if (!translated || translated.length > 4000) throw new Error('El resultado no es válido.');
      if (!controller.signal.aborted && activeRef.current) {
        useTalkStore.getState().appendTurn(source, text, translated);
        speak(translated, source);
      }
    } catch (error) {
      if (!controller.signal.aborted && activeRef.current) {
        useTalkStore.getState().setError(error instanceof Error ? error.message : 'Traducción no disponible.');
      }
    } finally {
      if (requestRef.current === controller) requestRef.current = null;
      finalizingRef.current = false;
    }
  };

  useSpeechRecognitionEvent('result', (event) => {
    if (!activeRef.current || useTalkStore.getState().phase !== 'listening') return;
    const transcript = event.results[0]?.transcript?.trim() ?? '';
    if (transcript) useTalkStore.getState().setPartial(transcript);
    if (event.isFinal && transcript) void translate(transcript);
  });
  useSpeechRecognitionEvent('error', (event) => {
    if (!activeRef.current || useTalkStore.getState().phase !== 'listening') return;
    useTalkStore.getState().setError('No se reconoció la voz (' + event.error + '). Puedes escribir la frase.');
  });
  useSpeechRecognitionEvent('end', () => {
    if (!activeRef.current || useTalkStore.getState().phase !== 'listening') return;
    useTalkStore.getState().setPhase('idle');
    const partial = useTalkStore.getState().partial;
    if (partial.trim()) useTalkStore.getState().setTypedText(partial);
  });

  const listenTo = async (speaker: TalkSpeaker) => {
    if (!activeRef.current || finalizingRef.current || requestRef.current) return;
    const current = useTalkStore.getState();
    if (!current.consent || !endpointAvailable) {
      current.setError('Acepta el consentimiento y configura el servidor para usar el micrófono.');
      return;
    }
    ExpoSpeechRecognitionModule.stop();
    void Speech.stop();
    try {
      const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!activeRef.current) return;
      if (!permission.granted) {
        useTalkStore.getState().setError('Sin permiso de micrófono. Puedes escribir la frase.');
        return;
      }
      useTalkStore.getState().setSpeaker(speaker);
      useTalkStore.getState().setPhase('listening');
      ExpoSpeechRecognitionModule.start({
        lang: speechLocaleForSpeaker(speaker),
        interimResults: true,
        continuous: false,
        maxAlternatives: 1,
      });
    } catch {
      if (activeRef.current) useTalkStore.getState().setError('Este dispositivo no puede iniciar el reconocimiento de voz.');
    }
  };

  const stopListening = () => {
    ExpoSpeechRecognitionModule.stop();
    const pending = useTalkStore.getState().partial;
    if (boundedUtterance(pending)) void translate(pending);
    else useTalkStore.getState().setPhase('idle');
  };
  const repeat = () => {
    const last = useTalkStore.getState().turns.at(-1);
    if (!last || !activeRef.current) return;
    ExpoSpeechRecognitionModule.stop();
    void Speech.stop();
    speak(last.translation, last.speaker);
  };

  const busy = state.phase === 'translating';
  const listening = state.phase === 'listening';

  return (
    <View className="gap-4">
      <View className="gap-2 rounded-2xl border border-ink-700 bg-ink-900 p-5">
        <Text role="heading" aria-level={2} className="font-display text-2xl text-silver-50">
          Interpretación inglés ↔ español
        </Text>
        <Text className="text-base leading-7 text-silver-300">
          Toca quién va a hablar. Escucha una frase, verás su traducción y Pa’Casa la dirá en voz alta.
          Para cambiar de persona, toca el otro micrófono.
        </Text>
      </View>
      <TalkOrb phase={state.phase} />
      <View className="items-center gap-1">
        <Text role="status" aria-live="polite" className="text-lg font-semibold text-royal-300">
          {talkPhaseLabel(state.phase)}
        </Text>
        {state.partial ? <Text className="text-center text-base leading-6 text-silver-100">{state.partial}</Text> : null}
      </View>
      <View className="flex-row flex-wrap gap-3">
        <Pressable role="button" disabled={!active || busy} onPress={() => { void listenTo('doctor'); }}
          accessibilityLabel="Escuchar al médico en inglés y traducir al español"
          className="min-h-28 min-w-32 flex-1 items-center justify-center gap-2 rounded-2xl border-2 border-royal-400 bg-royal-500/15 p-3 disabled:opacity-40">
          <Mic size={28} className="text-royal-300" />
          <Text className="text-center text-lg font-semibold text-silver-50">Médico</Text>
          <Text className="text-center text-sm text-silver-300">English → Español</Text>
        </Pressable>
        <Pressable role="button" disabled={!active || busy} onPress={() => { void listenTo('patient'); }}
          accessibilityLabel="Escuchar al paciente en español y traducir al inglés"
          className="min-h-28 min-w-32 flex-1 items-center justify-center gap-2 rounded-2xl border-2 border-royal-400 bg-royal-500/15 p-3 disabled:opacity-40">
          <Mic size={28} className="text-royal-300" />
          <Text className="text-center text-lg font-semibold text-silver-50">Paciente</Text>
          <Text className="text-center text-sm text-silver-300">Español → English</Text>
        </Pressable>
      </View>
      <View className="flex-row flex-wrap gap-3">
        <Pressable role="button" disabled={!listening} onPress={stopListening}
          className="min-h-12 min-w-24 flex-1 flex-row items-center justify-center gap-2 rounded-xl border border-silver-500 bg-ink-900 disabled:opacity-50">
          <Square size={17} className="text-silver-200" />
          <Text className="font-semibold text-silver-100">Terminar frase</Text>
        </Pressable>
        <Pressable role="button" disabled={state.turns.length === 0 || !active} onPress={repeat}
          className="min-h-12 min-w-24 flex-1 flex-row items-center justify-center gap-2 rounded-xl border border-silver-500 bg-ink-900 disabled:opacity-50">
          <Play size={18} className="text-silver-200" />
          <Text className="font-semibold text-silver-100">Repetir</Text>
        </Pressable>
        <Pressable role="button" onPress={() => {
          if (!state.muted) void Speech.stop();
          state.setMuted(!state.muted);
        }} className="min-h-12 min-w-24 flex-1 flex-row items-center justify-center gap-2 rounded-xl border border-silver-500 bg-ink-900">
          {state.muted ? <VolumeX size={18} className="text-silver-200" /> : <Volume2 size={18} className="text-silver-200" />}
          <Text className="font-semibold text-silver-100">{state.muted ? 'Sin sonido' : 'Sonido'}</Text>
        </Pressable>
      </View>
      <Pressable role="checkbox" aria-checked={state.consent}
        onPress={() => state.setConsent(!state.consent)}
        className="min-h-12 flex-row items-center gap-3 rounded-xl border border-ink-700 bg-ink-900 p-3">
        <View className={state.consent
          ? 'h-6 w-6 border-2 border-royal-300 bg-royal-500'
          : 'h-6 w-6 border-2 border-silver-400'} />
        <Text className="min-w-0 flex-1 text-sm leading-6 text-silver-200">
          Ambas personas aceptan usar el micrófono y enviar solamente la frase reconocida al traductor de Pa’Casa.
        </Text>
      </Pressable>
      {!endpointAvailable ? <Text role="alert" className="text-sm text-silver-300">
        No hay servidor de traducción configurado. El micrófono no se encenderá.
      </Text> : null}
      {state.error ? <Text role="alert" className="text-sm leading-6 text-danger">{state.error}</Text> : null}
      <View className="gap-3 rounded-2xl border border-ink-700 bg-ink-900 p-4">
        <Text className="text-base font-semibold text-silver-100">
          También puedes escribir ({state.speaker === 'doctor' ? 'Médico · EN' : 'Paciente · ES'})
        </Text>
        <TextInput value={state.typedText} maxLength={2000}
          onChangeText={state.setTypedText}
          aria-label="Escribe una frase para traducir"
          placeholder="Escribe aquí si no puedes usar el micrófono…"
          placeholderTextColor="#AAB0C4"
          className="min-h-14 rounded-xl border border-ink-500 bg-ink-950 p-3 text-base text-silver-50" />
        <Pressable role="button" disabled={busy || listening || !state.consent || !endpointAvailable || !state.typedText.trim()}
          onPress={() => { void translate(state.typedText); }}
          className="min-h-12 items-center justify-center rounded-xl bg-royal-500 disabled:opacity-40">
          <Text className="font-semibold text-silver-50">Traducir frase escrita</Text>
        </Pressable>
      </View>
      {state.turns.map((turn) => (
        <View key={turn.id} className="gap-3 rounded-2xl border border-ink-600 bg-ink-900 p-5">
          <Text className="text-xs font-semibold uppercase tracking-wider text-royal-300">
            {turn.speaker === 'doctor' ? 'Médico · English' : 'Paciente · Español'}
          </Text>
          <Text className="text-base leading-7 text-silver-200">{turn.original}</Text>
          <View className="h-px bg-ink-700" />
          <Text className="text-xs font-semibold uppercase tracking-wider text-royal-300">
            {turn.speaker === 'doctor' ? 'Para el paciente · Español' : 'Para el médico · English'}
          </Text>
          <Text className="text-xl leading-8 text-silver-50">{turn.translation}</Text>
        </View>
      ))}
      <Text className="text-sm leading-6 text-silver-400">
        Ayuda para comprender, no intérprete médico certificado. En diagnósticos, consentimiento,
        tratamientos, dosis y decisiones importantes, solicita un intérprete profesional. Comprueba
        siempre los nombres, números y las palabras negativas. Este modo no escucha en segundo plano.
      </Text>
    </View>
  );
}
