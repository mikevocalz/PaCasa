'use client';

import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { Modal, SafeArea } from '@acme/ui';
import { ArrowRight, MessageCircle, Mic, ScanLine, X } from '@acme/ui/icons';
import { Pressable, ScrollView, Text, TextInput, View } from '@acme/ui/tw';
import { OpenUIMessage } from '@acme/chat-ui';
import { ScanWorkspace } from '../scanner/ScanWorkspace';
import { TalkWorkspace } from '../talk/TalkWorkspace';
import { ChatOrb } from '../assistant/ChatOrb';
import { streamFetch } from '../assistant/stream-fetch';
import { readAssistantStream } from '../assistant/stream';
import { MAX_MESSAGE_CHARS, assistantReplyFromResponse, assistantUIFromResponse, makeAssistantRequest } from '../assistant/contract';
import { ASSISTANT_STAGES, type AssistantSurfaceMode } from '../assistant/modes';
import { useAssistantStore } from '../assistant/store';
import { useLanguage } from '../session/locale';
import { t, type StringKey } from '../session/strings';

const ENDPOINT = Platform.OS === 'web'
  ? process.env.NEXT_PUBLIC_PACASA_ASSISTANT_URL
  : process.env.EXPO_PUBLIC_PACASA_ASSISTANT_URL;
const endpointAvailable = Boolean(ENDPOINT &&
  (/^https:\/\//.test(ENDPOINT) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//.test(ENDPOINT)));

const STAGE_LABEL: Record<AssistantSurfaceMode, StringKey> = {
  chat: 'assistant.chat',
  scan: 'assistant.scan',
  talk: 'assistant.talk',
};

/**
 * A full-screen modal reached through the existing raised center action.
 * Bottom navigation is hidden; closing always restores the previous route.
 * The three modes own separate work surfaces, never silently share transcripts.
 */
export function AssistantOverlay() {
  const language = useLanguage();
  const store = useAssistantStore();
  const { open, mode, sourceLanguage, draft, busy, streamingText, messages, consent, error } = store;
  const abortRef = useRef<AbortController | null>(null);
  useEffect(() => () => abortRef.current?.abort(), []);

  const stopRequest = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    store.setBusy(false);
    store.setStreamingText('');
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
    store.setStreamingText('');
    store.setError(null);
    store.appendMessage(outboundMode, 'user', request.text);
    store.setDraft('');
    try {
      if (outboundMode === 'chat') {
        const streamUrl = ENDPOINT.replace(/\/assistant\/?$/, '/assistant/stream');
        const response = await streamFetch(streamUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
          body: JSON.stringify(request),
          signal: controller.signal,
        });
        const data = await readAssistantStream(response, (text) => {
          if (!controller.signal.aborted) store.setStreamingText(text);
        });
        if (!controller.signal.aborted) {
          store.appendMessage('chat', 'assistant', data.reply, data.ui);
          store.setStreamingText('');
        }
      } else {
        const response = await fetch(ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request),
          signal: controller.signal,
        });
        if (!response.ok) throw new Error('La solicitud no se pudo completar.');
        const payload: unknown = await response.json();
        const reply = assistantReplyFromResponse(payload);
        if (!reply) throw new Error('El servicio no devolvió una respuesta válida.');
        if (!controller.signal.aborted) {
          store.appendMessage('translate', 'assistant', reply, assistantUIFromResponse(payload) ?? undefined);
        }
      }
    } catch (cause) {
      if (!controller.signal.aborted) {
        store.setError(cause instanceof Error ? cause.message : 'No fue posible conectar con Pa’Casa.');
      }
    } finally {
      if (!controller.signal.aborted) {
        store.setBusy(false);
        store.setStreamingText('');
      }
      if (abortRef.current === controller) abortRef.current = null;
    }
  };

  const talk = mode === 'talk';
  const scan = mode === 'scan';

  return (
    <Modal visible={open} animationType="slide" presentationStyle="fullScreen" onRequestClose={close}>
      <SafeArea edges={['top', 'bottom', 'left', 'right']} className="min-h-0 flex-1 bg-surface">
        <View role="dialog" aria-modal aria-label="Asistente Pa’Casa" className="mx-auto min-h-0 w-full max-w-4xl flex-1">
          <View className="flex-row items-center justify-between gap-3 border-b border-border px-4 py-4">
            <View className="min-w-0 flex-1 gap-1">
              <Text className="text-sm font-semibold text-accent">Pa’Casa</Text>
              <Text role="heading" aria-level={1} className="font-display text-2xl text-text">{t('assistant.title', language)}</Text>
            </View>
            <Pressable role="button" accessibilityLabel={t('assistant.close', language)} onPress={close}
              className="h-12 w-12 items-center justify-center rounded-soft border border-border bg-surface-raised focus-visible:outline-2 focus-visible:outline-focus">
              <X size={23} className="text-text" />
            </Pressable>
          </View>
          <View role="tablist" aria-label={t('assistant.modes', language)} className="flex-row gap-2 border-b border-border px-4 py-3">
            {ASSISTANT_STAGES.map((stage) => {
              const active = mode === stage.mode;
              return (
                <Pressable key={stage.mode} role="tab" aria-selected={active}
                  accessibilityLabel={t(STAGE_LABEL[stage.mode], language)} accessibilityHint={stage.hint}
                  onPress={() => switchMode(stage.mode)}
                  className={active
                    ? 'min-h-14 flex-1 flex-row items-center justify-center gap-2 rounded-soft border-2 border-accent bg-surface-sunken px-2'
                    : 'min-h-14 flex-1 flex-row items-center justify-center gap-2 rounded-soft border border-border bg-surface-raised px-2'}>
                  {stage.mode === 'chat' ? <MessageCircle size={19} className={active ? 'text-accent' : 'text-text-muted'} /> :
                    stage.mode === 'scan' ? <ScanLine size={19} className={active ? 'text-accent' : 'text-text-muted'} /> :
                    <Mic size={19} className={active ? 'text-accent' : 'text-text-muted'} />}
                  <Text className={`text-sm font-semibold ${active ? 'text-text' : 'text-text-muted'}`}>{t(STAGE_LABEL[stage.mode], language)}</Text>
                </Pressable>
              );
            })}
          </View>
          <ScrollView className="min-h-0 flex-1 px-4" keyboardShouldPersistTaps="handled"
            contentContainerClassName="gap-4 pb-6 pt-5">
            {scan ? (
              <ScanWorkspace active={open && scan} />
            ) : talk ? (
              <TalkWorkspace active={open && talk} />
            ) : (
              <>
                {!talk ? <ChatOrb busy={busy} /> : null}
                <View className="gap-2 rounded-soft border border-border bg-surface-raised p-5">
                  <Text role="heading" aria-level={2} className="font-display text-xl text-text">
                    {talk ? 'Inglés y español, cara a cara' : '¿Qué necesitas entender?'}
                  </Text>
                  <Text className="text-base leading-7 text-text-muted">
                    {talk
                      ? 'Traduce una frase en ambas direcciones. La interpretación de voz en tiempo real se habilita por separado; no presupongas que esta vista ya está escuchando.'
                      : 'Pregunta en español o inglés. Tus mensajes quedan en este dispositivo durante la sesión.'}
                  </Text>
                </View>
                {talk ? (
                  <Pressable role="button" accessibilityLabel="Cambiar dirección de traducción"
                    onPress={() => store.setSourceLanguage(sourceLanguage === 'en' ? 'es' : 'en')}
                    className="min-h-12 self-start justify-center rounded-soft border border-accent bg-surface-raised px-4">
                    <Text className="text-base font-semibold text-text">
                      {sourceLanguage === 'en' ? 'English → Español  ⇄' : 'Español → English  ⇄'}
                    </Text>
                  </Pressable>
                ) : null}
                {activeMessages.map((message) => (
                  <View key={message.id} className={message.role === 'user'
                    ? 'ml-6 gap-2 self-end rounded-soft border border-accent bg-surface-sunken p-4'
                    : 'mr-6 gap-2 self-start rounded-soft border border-border bg-surface-raised p-4'}>
                    <Text className="text-xs font-semibold uppercase tracking-wider text-accent">
                      {message.role === 'user' ? 'Tú' : 'Pa’Casa'}
                    </Text>
                    <Text className="text-base leading-7 text-text">{message.text}</Text>
                    {message.role === 'assistant' && message.ui ? (
                      <OpenUIMessage ui={message.ui} onSuggestion={store.setDraft} />
                    ) : null}
                  </View>
                ))}
                {!talk && streamingText ? (
                  <View role="status" aria-live="polite" className="mr-6 gap-2 rounded-soft border border-border bg-surface-raised p-4">
                    <Text className="text-xs font-semibold uppercase tracking-wider text-accent">Pa’Casa · en vivo</Text>
                    <Text className="text-base leading-7 text-text">{streamingText}</Text>
                  </View>
                ) : null}
              </>
            )}
            <Text className="text-sm leading-6 text-text-muted">
              Revisa siempre las traducciones y las respuestas. Pa’Casa no envía formularios ni decide por ti.
            </Text>
          </ScrollView>
          {!scan && !talk ? (
            <View className="gap-3 border-t border-border bg-surface px-4 py-4">
              {error ? <Text role="alert" className="text-sm leading-6 text-danger">{error}</Text> : null}
              {!endpointAvailable ? (
                <Text role="status" className="text-sm text-text-muted">
                  El servicio de IA aún no está conectado. Tu texto no se enviará.
                </Text>
              ) : null}
              <Pressable role="checkbox" aria-checked={consent} onPress={() => store.setConsent(!consent)}
                className="min-h-12 flex-row items-center gap-3">
                <View className={consent
                  ? 'h-6 w-6 border-2 border-accent bg-accent'
                  : 'h-6 w-6 border-2 border-border bg-surface-raised'} />
                <Text className="min-w-0 flex-1 text-sm leading-6 text-text-muted">
                  Confirmo que deseo enviar este texto al servicio de Pa’Casa.
                </Text>
              </Pressable>
              <TextInput value={draft} onChangeText={store.setDraft} maxLength={MAX_MESSAGE_CHARS}
                onSubmitEditing={() => { void send(); }} returnKeyType="send"
                placeholder={talk ? 'Escribe una frase para traducir…' : 'Escribe tu pregunta…'}
                aria-label={talk ? 'Frase para traducir' : 'Escribir pregunta'}
                placeholderTextColor="#61656A"
                className="min-h-14 w-full rounded-soft border border-border bg-surface-raised px-4 text-lg text-text" />
              <Pressable role="button" accessibilityLabel={talk ? 'Traducir' : 'Enviar pregunta'}
                disabled={busy || !draft.trim() || !consent || !endpointAvailable}
                onPress={() => { void send(); }}
                className="min-h-14 flex-row items-center justify-center gap-3 rounded-soft border border-transparent bg-cta px-6 hover:bg-cta-pressed disabled:opacity-40">
                <Text className="text-lg font-semibold text-on-cta">
                  {busy ? 'Preparando respuesta…' : talk ? 'Traducir' : 'Enviar'}
                </Text>
                <ArrowRight size={22} className="text-on-cta" />
              </Pressable>
            </View>
          ) : null}
        </View>
      </SafeArea>
    </Modal>
  );
}
