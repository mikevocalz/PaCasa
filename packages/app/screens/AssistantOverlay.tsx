'use client';

import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { Modal, SafeArea, VoiceRecorder } from '@acme/ui';
import { ArrowRight, Camera, MessageCircle, Mic, ScanLine, X } from '@acme/ui/icons';
import { Pressable, ScrollView, Text, TextInput, View } from '@acme/ui/tw';
import { OpenUIMessage } from '@acme/chat-ui';
import { MAX_MESSAGE_CHARS, assistantReplyFromResponse, assistantUIFromResponse, makeAssistantRequest } from '../assistant/contract';
import { ASSISTANT_STAGES, type AssistantSurfaceMode } from '../assistant/modes';
import { useAssistantStore } from '../assistant/store';

const ENDPOINT = Platform.OS === 'web'
  ? process.env.NEXT_PUBLIC_PACASA_ASSISTANT_URL
  : process.env.EXPO_PUBLIC_PACASA_ASSISTANT_URL;
const endpointAvailable = Boolean(ENDPOINT &&
  (/^https:\/\//.test(ENDPOINT) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//.test(ENDPOINT)));

/**
 * A full-screen modal reached through the existing raised center action.
 * Bottom navigation is hidden; closing always restores the previous route.
 * The three modes own separate work surfaces, never silently share transcripts.
 */
export function AssistantOverlay({ onScan }: { onScan: () => void }) {
  const store = useAssistantStore();
  const { open, mode, sourceLanguage, draft, busy, messages, consent, error, voiceNotice } = store;
  const abortRef = useRef<AbortController | null>(null);
  useEffect(() => () => abortRef.current?.abort(), []);

  const stopRequest = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    store.setBusy(false);
  };
  const close = () => {
    stopRequest();
    store.closeAssistant();
  };
  const switchMode = (next: AssistantSurfaceMode) => {
    if (next === mode) return;
    stopRequest();
    store.setMode(next);
  };
  const requestMode = mode === 'talk' ? 'translate' : 'chat';
  const activeMessages = messages.filter((message) => message.mode === requestMode);

  const send = async () => {
    if (mode === 'scan' || busy) return;
    const outboundMode = mode === 'talk' ? 'translate' : 'chat';
    const request = makeAssistantRequest({ mode: outboundMode, draft, sourceLanguage, messages });
    if (!request) {
      store.setError('Escribe una frase de hasta 2,000 caracteres para continuar.');
      return;
    }
    if (!consent) {
      store.setError('Confirma antes de compartir este texto con el servicio de Pa’Casa.');
      return;
    }
    if (!endpointAvailable || !ENDPOINT) {
      store.setError('El servicio todavía no está configurado. Tu texto no se envió.');
      return;
    }
    const controller = new AbortController();
    abortRef.current = controller;
    store.setBusy(true);
    store.setError(null);
    store.appendMessage(outboundMode, 'user', request.text);
    store.setDraft('');
    try {
      const response = await fetch(ENDPOINT, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request), signal: controller.signal,
      });
      if (!response.ok) throw new Error('La solicitud no se pudo completar.');
      const payload: unknown = await response.json();
      const reply = assistantReplyFromResponse(payload);
      if (!reply) throw new Error('El servicio no devolvió una respuesta válida.');
      if (!controller.signal.aborted) {
        store.appendMessage(outboundMode, 'assistant', reply, assistantUIFromResponse(payload) ?? undefined);
      }
    } catch (cause) {
      if (!controller.signal.aborted) {
        store.setError(cause instanceof Error ? cause.message : 'No fue posible conectar con Pa’Casa.');
      }
    } finally {
      if (!controller.signal.aborted) store.setBusy(false);
      if (abortRef.current === controller) abortRef.current = null;
    }
  };

  const talk = mode === 'talk';
  const scan = mode === 'scan';

  return (
    <Modal visible={open} animationType="slide" presentationStyle="fullScreen" onRequestClose={close}>
      <SafeArea edges={['top', 'bottom', 'left', 'right']} className="min-h-0 flex-1 bg-ink-950">
        <View role="dialog" aria-modal aria-label="Asistente Pa’Casa" className="mx-auto min-h-0 w-full max-w-4xl flex-1">
          <View className="flex-row items-center justify-between gap-3 border-b border-ink-700 px-4 py-4">
            <View className="min-w-0 flex-1 gap-1">
              <Text className="text-xs font-semibold uppercase tracking-widest text-royal-300">Pa’Casa</Text>
              <Text role="heading" aria-level={1} className="font-display text-2xl text-silver-50">Tu asistente</Text>
            </View>
            <Pressable role="button" accessibilityLabel="Cerrar Pa’Casa" onPress={close}
              className="h-12 w-12 items-center justify-center border border-ink-600 bg-ink-900">
              <X size={23} className="text-silver-50" />
            </Pressable>
          </View>
          <View role="tablist" aria-label="Chat, Escanear o Hablar" className="flex-row gap-2 border-b border-ink-800 px-4 py-3">
            {ASSISTANT_STAGES.map((stage) => (
              <Pressable key={stage.mode} role="tab" aria-selected={mode === stage.mode}
                accessibilityLabel={stage.label} accessibilityHint={stage.hint}
                onPress={() => switchMode(stage.mode)}
                className={mode === stage.mode
                  ? 'min-h-14 flex-1 flex-row items-center justify-center gap-2 rounded-xl border-2 border-royal-300 bg-royal-500/25 px-2'
                  : 'min-h-14 flex-1 flex-row items-center justify-center gap-2 rounded-xl border border-ink-600 bg-ink-900 px-2'}>
                {stage.mode === 'chat' ? <MessageCircle size={19} className="text-silver-50" /> :
                  stage.mode === 'scan' ? <ScanLine size={19} className="text-silver-50" /> :
                  <Mic size={19} className="text-silver-50" />}
                <Text className="text-sm font-semibold text-silver-50">{stage.label}</Text>
              </Pressable>
            ))}
          </View>
          <ScrollView className="min-h-0 flex-1 px-4" keyboardShouldPersistTaps="handled"
            contentContainerClassName="gap-4 pb-6 pt-5">
            {scan ? (
              <View className="gap-5 rounded-2xl border border-ink-700 bg-ink-900 p-5">
                <View className="items-center gap-3 py-9">
                  <View className="h-28 w-28 items-center justify-center rounded-3xl border border-royal-400 bg-royal-500/15">
                    <ScanLine size={56} className="text-royal-300" />
                  </View>
                  <Text role="heading" aria-level={2} className="font-display text-2xl text-silver-50">Escanea a tu ritmo</Text>
                  <Text className="text-center text-base leading-7 text-silver-300">
                    Encuadra el documento. Podrás revisar el texto antes de traducirlo o usarlo.
                  </Text>
                </View>
                {Platform.OS !== 'web' ? (
                  <Pressable role="button" accessibilityLabel="Abrir vista de cámara de prueba"
                    onPress={onScan} className="min-h-14 flex-row items-center justify-center gap-3 rounded-xl bg-royal-500 px-5">
                    <Camera size={23} className="text-silver-50" />
                    <Text className="font-semibold text-silver-50">Abrir cámara de prueba</Text>
                  </Pressable>
                ) : (
                  <Text role="status" className="text-base leading-7 text-silver-300">
                    El escáner web aún no está conectado. No se ha capturado ni enviado ningún documento.
                  </Text>
                )}
                <Text className="text-sm leading-6 text-silver-400">
                  Esta vista preliminar no extrae texto ni envía formularios. El procesamiento de documentos requiere el módulo de escaneo.
                </Text>
              </View>
            ) : (
              <>
                <View className="gap-2 rounded-2xl border border-ink-700 bg-ink-900 p-5">
                  <Text role="heading" aria-level={2} className="font-display text-xl text-silver-50">
                    {talk ? 'Inglés y español, cara a cara' : '¿Qué necesitas entender?'}
                  </Text>
                  <Text className="text-base leading-7 text-silver-300">
                    {talk
                      ? 'Traduce una frase en ambas direcciones. La interpretación de voz en tiempo real se habilita por separado; no presupongas que esta vista ya está escuchando.'
                      : 'Pregunta en español o inglés. Tus mensajes quedan en este dispositivo durante la sesión.'}
                  </Text>
                </View>
                {talk ? (
                  <Pressable role="button" accessibilityLabel="Cambiar dirección de traducción"
                    onPress={() => store.setSourceLanguage(sourceLanguage === 'en' ? 'es' : 'en')}
                    className="min-h-12 self-start justify-center rounded-xl border border-royal-400 px-4">
                    <Text className="text-base font-semibold text-silver-50">
                      {sourceLanguage === 'en' ? 'English → Español  ⇄' : 'Español → English  ⇄'}
                    </Text>
                  </Pressable>
                ) : null}
                {activeMessages.map((message) => (
                  <View key={message.id} className={message.role === 'user'
                    ? 'ml-6 gap-2 self-end rounded-2xl border border-royal-400/60 bg-royal-500/15 p-4'
                    : 'mr-6 gap-2 self-start rounded-2xl border border-ink-700 bg-ink-900 p-4'}>
                    <Text className="text-xs font-semibold uppercase tracking-wider text-royal-300">
                      {message.role === 'user' ? 'Tú' : 'Pa’Casa'}
                    </Text>
                    <Text className="text-base leading-7 text-silver-50">{message.text}</Text>
                    {message.role === 'assistant' && message.ui ? (
                      <OpenUIMessage ui={message.ui} onSuggestion={store.setDraft} />
                    ) : null}
                  </View>
                ))}
                {talk && Platform.OS !== 'web' ? (
                  <View className="gap-3 rounded-xl border border-ink-700 bg-ink-900 p-4">
                    <Text className="font-semibold text-silver-50">Nota de voz local</Text>
                    <VoiceRecorder maxSeconds={60} onCancel={() => store.setVoiceNotice(null)}
                      onComplete={(take) => store.setVoiceNotice(
                        'Grabación local revisada (' + Math.ceil(take.duration) + ' s). Aún no se ha transcrito ni enviado.'
                      )} />
                    {voiceNotice ? <Text role="status" className="text-sm text-silver-300">{voiceNotice}</Text> : null}
                  </View>
                ) : null}
              </>
            )}
            <Text className="text-sm leading-6 text-silver-400">
              Revisa siempre las traducciones y las respuestas. Pa’Casa no envía formularios ni decide por ti.
            </Text>
          </ScrollView>
          {!scan ? (
            <View className="gap-3 border-t border-ink-700 bg-ink-950 px-4 py-4">
              {error ? <Text role="alert" className="text-sm leading-6 text-danger">{error}</Text> : null}
              {!endpointAvailable ? (
                <Text role="status" className="text-sm text-silver-300">
                  El servicio de IA aún no está conectado. Tu texto no se enviará.
                </Text>
              ) : null}
              <Pressable role="checkbox" aria-checked={consent} onPress={() => store.setConsent(!consent)}
                className="min-h-12 flex-row items-center gap-3">
                <View className={consent
                  ? 'h-6 w-6 border-2 border-royal-300 bg-royal-500'
                  : 'h-6 w-6 border-2 border-silver-400 bg-ink-900'} />
                <Text className="min-w-0 flex-1 text-sm leading-6 text-silver-300">
                  Confirmo que deseo enviar este texto al servicio de Pa’Casa.
                </Text>
              </Pressable>
              <TextInput value={draft} onChangeText={store.setDraft} maxLength={MAX_MESSAGE_CHARS}
                onSubmitEditing={() => { void send(); }} returnKeyType="send"
                placeholder={talk ? 'Escribe una frase para traducir…' : 'Escribe tu pregunta…'}
                aria-label={talk ? 'Frase para traducir' : 'Escribir pregunta'}
                placeholderTextColor="#AAB0C4"
                className="min-h-14 w-full rounded-xl border border-ink-500 bg-ink-900 px-4 text-lg text-silver-50" />
              <Pressable role="button" accessibilityLabel={talk ? 'Traducir' : 'Enviar pregunta'}
                disabled={busy || !draft.trim() || !consent || !endpointAvailable}
                onPress={() => { void send(); }}
                className="min-h-14 flex-row items-center justify-center gap-3 rounded-xl border border-royal-300 bg-royal-500 px-6 disabled:opacity-40">
                <Text className="text-lg font-semibold text-silver-50">
                  {busy ? 'Preparando respuesta…' : talk ? 'Traducir' : 'Enviar'}
                </Text>
                <ArrowRight size={22} className="text-silver-50" />
              </Pressable>
            </View>
          ) : null}
        </View>
      </SafeArea>
    </Modal>
  );
}
