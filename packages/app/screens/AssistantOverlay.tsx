'use client';

import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { Modal, SafeArea, VoiceRecorder } from '@acme/ui';
import { ArrowRight, MessageCircle, Mic, ScanLine, X } from '@acme/ui/icons';
import { Pressable, ScrollView, Text, TextInput, View } from '@acme/ui/tw';
import { MAX_MESSAGE_CHARS, assistantReplyFromResponse, makeAssistantRequest, type AssistantMode } from '../assistant/contract';
import { useAssistantStore } from '../assistant/store';

/**
 * A root-level, full-screen workflow (not a bottom-tab route). Closing returns
 * to the tab the person was using. Text and recordings stay in memory/on device.
 * The static Base44 export cannot implement an API route: calls go to an
 * explicitly configured, separately hosted HTTPS assistant endpoint.
 */
const ASSISTANT_ENDPOINT =
  Platform.OS === 'web'
    ? process.env.NEXT_PUBLIC_PACASA_ASSISTANT_URL
    : process.env.EXPO_PUBLIC_PACASA_ASSISTANT_URL;

const endpointAvailable = Boolean(
  ASSISTANT_ENDPOINT &&
  (/^https:\/\//.test(ASSISTANT_ENDPOINT) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//.test(ASSISTANT_ENDPOINT)),
);

const labelForMode: Record<AssistantMode, string> = {
  chat: 'Preguntar',
  translate: 'Traducir',
};

export function AssistantOverlay({ onScan }: { onScan: () => void }) {
  const store = useAssistantStore();
  const abortRef = useRef<AbortController | null>(null);
  const { open, mode, sourceLanguage, draft, busy, messages, consent, error, voiceNotice } = store;

  useEffect(() => () => abortRef.current?.abort(), []);

  const close = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    store.closeAssistant();
  };

  const changeMode = (next: AssistantMode) => {
    if (busy) {
      abortRef.current?.abort();
      abortRef.current = null;
      store.setBusy(false);
    }
    store.setMode(next);
  };

  const send = async () => {
    if (busy) return;
    const request = makeAssistantRequest({ mode, draft, sourceLanguage, messages });
    if (!request) {
      store.setError('Escribe una frase de hasta 2,000 caracteres para continuar.');
      return;
    }
    if (!consent) {
      store.setError('Primero confirma que deseas enviar este texto al servicio seguro de Pa’Casa.');
      return;
    }
    if (!endpointAvailable || !ASSISTANT_ENDPOINT) {
      store.setError('La traducción y las respuestas de IA todavía no están configuradas en esta instalación. Tu texto no se envió.');
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    store.setBusy(true);
    store.setError(null);
    store.appendMessage(mode, 'user', request.text);
    store.setDraft('');
    try {
      const response = await fetch(ASSISTANT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
        signal: controller.signal,
      });
      if (!response.ok) throw new Error('La solicitud no se pudo completar.');
      const payload: unknown = await response.json();
      const reply = assistantReplyFromResponse(payload);
      if (!reply) throw new Error('El servicio no devolvió una respuesta válida.');
      if (!controller.signal.aborted) store.appendMessage(mode, 'assistant', reply);
    } catch (cause) {
      if (!controller.signal.aborted) {
        store.setError(cause instanceof Error ? cause.message : 'No fue posible conectar con Pa’Casa.');
      }
    } finally {
      if (!controller.signal.aborted) store.setBusy(false);
      if (abortRef.current === controller) abortRef.current = null;
    }
  };

  const activeMessages = messages.filter((message) => message.mode === mode);

  return (
    <Modal visible={open} animationType="slide" presentationStyle="fullScreen" onRequestClose={close}>
      <SafeArea edges={['top', 'bottom', 'left', 'right']} className="min-h-0 flex-1 bg-ink-950">
        <View role="dialog" aria-modal aria-label="Pa’Casa, chat y traducción" className="mx-auto min-h-0 w-full max-w-4xl flex-1">
          <View className="flex-row items-center justify-between gap-4 border-b border-ink-700 bg-ink-950 px-4 py-4">
            <View className="min-w-0 flex-1 gap-1">
              <Text className="text-xs font-semibold uppercase tracking-widest text-royal-300">Asistente Pa&apos;Casa</Text>
              <Text role="heading" aria-level={1} className="font-display text-2xl text-silver-50">Hablar y traducir</Text>
            </View>
            <Pressable role="button" accessibilityLabel="Cerrar asistente" onPress={close}
              className="h-12 w-12 items-center justify-center border border-ink-600 bg-ink-900 focus-visible:outline-2 focus-visible:outline-silver-50">
              <X size={23} className="text-silver-50" />
            </Pressable>
          </View>

          <View role="tablist" aria-label="Modo de asistencia" className="flex-row gap-3 px-4 py-4">
            <Pressable
              role="tab" aria-selected={mode === 'chat'} onPress={() => changeMode('chat')}
              className={mode === 'chat'
                ? 'min-h-14 flex-1 flex-row items-center justify-center gap-2 border-2 border-royal-300 bg-royal-500/25'
                : 'min-h-14 flex-1 flex-row items-center justify-center gap-2 border border-ink-600 bg-ink-900'}
            >
              <MessageCircle size={22} className="text-silver-50" />
              <Text className="text-base font-semibold text-silver-50">Preguntar</Text>
            </Pressable>
            <Pressable
              role="tab" aria-selected={mode === 'translate'} onPress={() => changeMode('translate')}
              className={mode === 'translate'
                ? 'min-h-14 flex-1 flex-row items-center justify-center gap-2 border-2 border-royal-300 bg-royal-500/25'
                : 'min-h-14 flex-1 flex-row items-center justify-center gap-2 border border-ink-600 bg-ink-900'}
            >
              <Mic size={22} className="text-silver-50" />
              <Text className="text-base font-semibold text-silver-50">Traducir</Text>
            </Pressable>
          </View>

          <ScrollView
            className="min-h-0 flex-1 px-4"
            keyboardShouldPersistTaps="handled"
            contentContainerClassName="gap-4 pb-6"
          >
            <View className="gap-2 border-l-4 border-royal-400 bg-ink-900 p-4">
              <Text className="text-xl font-semibold text-silver-50">
                {mode === 'chat' ? '¿Qué necesitas entender?' : 'Traduce a tu ritmo'}
              </Text>
              <Text className="text-base leading-7 text-silver-300">
                {mode === 'chat'
                  ? 'Puedes preguntar en español. Te ayudaremos a entender preguntas y documentos; tú decides qué responder.'
                  : 'Copia una frase, escribe con el teclado o dicta usando el micrófono de tu teclado.'}
              </Text>
            </View>

            {mode === 'translate' ? (
              <Pressable
                role="button"
                accessibilityLabel="Cambiar dirección de traducción"
                onPress={() => store.setSourceLanguage(sourceLanguage === 'en' ? 'es' : 'en')}
                className="min-h-12 self-start justify-center border border-royal-400 px-4"
              >
                <Text className="text-base font-semibold text-silver-50">
                  {sourceLanguage === 'en' ? 'Inglés → Español  ⇄' : 'Español → Inglés  ⇄'}
                </Text>
              </Pressable>
            ) : null}

            {activeMessages.map((message) => (
              <View key={message.id}
                className={message.role === 'user'
                  ? 'ml-6 gap-1 self-end border border-royal-400/60 bg-royal-500/15 p-4'
                  : 'mr-6 gap-1 self-start border border-ink-700 bg-ink-900 p-4'}
              >
                <Text className="text-xs font-semibold uppercase tracking-wider text-royal-300">
                  {message.role === 'user' ? 'Tú' : 'Pa’Casa'}
                </Text>
                <Text className="text-base leading-7 text-silver-50">{message.text}</Text>
              </View>
            ))}

            {Platform.OS !== 'web' ? (
              <View className="gap-2 border border-ink-700 bg-ink-900 p-4">
                <Text className="font-semibold text-silver-50">Nota de voz (en este dispositivo)</Text>
                <VoiceRecorder
                  maxSeconds={60}
                  onCancel={() => store.setVoiceNotice(null)}
                  onComplete={(take) => store.setVoiceNotice(
                    'Grabación revisada (' + Math.ceil(take.duration) + ' s). La transcripción de audio aún requiere conectar el servicio seguro. No se ha enviado.'
                  )}
                />
                {voiceNotice ? <Text role="status" className="text-sm text-silver-300">{voiceNotice}</Text> : null}
              </View>
            ) : (
              <Text className="text-sm text-silver-400">
                Si deseas dictar en la web, utiliza el micrófono integrado de tu teclado. La grabación dentro de Pa’Casa está disponible en la app móvil.
              </Text>
            )}

            {Platform.OS !== 'web' ? (
              <Pressable role="button" accessibilityLabel="Abrir Camera Lab; aún no lee formularios" onPress={onScan}
                className="min-h-12 flex-row items-center justify-center gap-3 border border-ink-600 bg-ink-900 px-4">
                <ScanLine size={21} className="text-silver-200" />
                <View className="min-w-0 flex-1 gap-1">
                  <Text className="text-base font-semibold text-silver-50">Abrir cámara</Text>
                  <Text className="text-sm text-silver-300">Vista de prueba; todavía no lee formularios</Text>
                </View>
              </Pressable>
            ) : null}
            <Text className="text-sm leading-6 text-silver-400">
              Las conversaciones y respuestas no se guardan al cerrar. Revisa y confirma siempre cualquier respuesta antes de usarla en un formulario.
            </Text>
          </ScrollView>

          <View className="gap-3 border-t border-ink-700 bg-ink-950 px-4 py-4">
            {error ? <Text role="alert" className="text-sm leading-6 text-danger">{error}</Text> : null}
            {!endpointAvailable ? (
              <Text role="status" className="text-sm text-silver-300">
                El servicio de IA aún no está conectado. Puedes preparar tu mensaje, pero no se enviará hasta configurar un endpoint seguro.
              </Text>
            ) : null}
            <Pressable role="checkbox" aria-checked={consent} onPress={() => store.setConsent(!consent)}
              className="min-h-12 flex-row items-center gap-3">
              <View className={consent
                ? 'h-6 w-6 border-2 border-royal-300 bg-royal-500'
                : 'h-6 w-6 border-2 border-silver-400 bg-ink-900'} />
              <Text className="min-w-0 flex-1 text-sm leading-6 text-silver-300">
                Entiendo que al enviar se compartirá este texto con el servicio de Pa’Casa; no escribiré datos sensibles sin querer.
              </Text>
            </Pressable>
            <TextInput
              value={draft}
              onChangeText={store.setDraft}
              onSubmitEditing={() => { void send(); }}
              maxLength={MAX_MESSAGE_CHARS}
              returnKeyType="send"
              placeholder={mode === 'chat' ? 'Escribe tu pregunta…' : 'Escribe la frase a traducir…'}
              aria-label={mode === 'chat' ? 'Escribir pregunta' : 'Texto para traducir'}
              placeholderTextColor="#AAB0C4"
              className="min-h-14 w-full border border-ink-500 bg-ink-900 px-4 text-lg text-silver-50"
            />
            <Pressable
              role="button"
              accessibilityLabel={labelForMode[mode]}
              disabled={busy || !draft.trim() || !consent || !endpointAvailable}
              onPress={() => { void send(); }}
              className="min-h-14 flex-row items-center justify-center gap-3 border border-royal-300 bg-royal-500 px-6 disabled:opacity-40 active:bg-royal-600"
            >
              <Text className="text-lg font-semibold text-silver-50">{busy ? 'Preparando respuesta…' : labelForMode[mode]}</Text>
              <ArrowRight size={22} className="text-silver-50" />
            </Pressable>
          </View>
        </View>
      </SafeArea>
    </Modal>
  );
}
