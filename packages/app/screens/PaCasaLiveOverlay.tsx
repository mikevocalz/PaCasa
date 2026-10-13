'use client';

/**
 * Pa'Casa Live — the voice-first command surface. It is a modal overlay, not
 * a route: the raised shell action records the pathname it was opened from
 * (`returnTo`) and closing only drops `open`, so the tab selection never
 * moves. Hablar completes the active form one question at a time; Traducir
 * runs the verified two-way front-desk phrasebook; Preguntar answers from
 * the session and nothing else.
 *
 * Every UI field lives in the Zustand overlay store; the speech engine's
 * cancel handle is imperative and stays in a ref (repo rules).
 */

import { useEffect, useRef, type ComponentType } from 'react';
import { Platform } from 'react-native';
import { Link } from 'solito/link';
import { Modal, SafeArea } from '@acme/ui';
import { Check, HelpCircle, Languages, Mic, MicOff, Volume2, X } from '@acme/ui/icons';
import { Nav, Pressable, ScrollView, Text, TextInput, View } from '@acme/ui/tw';
import { startExampleForm } from '../session/actions';
import { groundQuestion, SUGGESTED_QUESTIONS } from '../session/grounding';
import { useLiveOverlay, type LiveMode } from '../session/live-overlay';
import { useLanguage } from '../session/locale';
import { t, type StringKey } from '../session/strings';
import {
  currentQuestion,
  formProgress,
  useActiveForm,
  usePatientSession,
  type PatientAnswer,
  type PatientForm,
} from '../session/patient';
import { DIRECTION_LABEL, PHRASES, translatePhrase } from '../session/phrasebook';
import { canListen, canSpeak, listen, speak, stopSpeaking } from '../speech/speech';
import { DirectionsCard } from './DirectionsCard';
import { PatientBigAction, PatientButton } from './patient-ui';

type IconComponent = ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;

const MODES: readonly { id: LiveMode; labelKey: StringKey; icon: IconComponent }[] = [
  { id: 'hablar', labelKey: 'live.hablar', icon: Mic },
  { id: 'traducir', labelKey: 'live.traducir', icon: Languages },
  { id: 'preguntar', labelKey: 'live.preguntar', icon: HelpCircle },
] as const;

/** Platform-neutral navigation prop for solito Links that also close the overlay. */
const linkClose = (close: () => void) => (Platform.OS === 'web' ? { onClick: close } : { onPress: close });

export function PaCasaLiveOverlay() {
  const language = useLanguage();
  const open = useLiveOverlay((state) => state.open);
  const mode = useLiveOverlay((state) => state.mode);
  const setMode = useLiveOverlay((state) => state.setMode);
  const form = useActiveForm();
  const next = currentQuestion(form);
  const progress = form ? formProgress(form) : null;

  const close = () => {
    stopSpeaking();
    useLiveOverlay.getState().closeLive();
  };

  // Closing or switching mode always silences read-aloud; the overlay itself
  // stopping speech on unmount keeps a closing route honest too.
  useEffect(() => () => stopSpeaking(), []);
  useEffect(() => {
    stopSpeaking();
  }, [mode]);

  // Escape dismisses the overlay on web; Android back goes through onRequestClose.
  useEffect(() => {
    if (!open || Platform.OS !== 'web') return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <Modal visible={open} animationType="fade" onRequestClose={close}>
      <SafeArea edges={['top', 'bottom', 'left', 'right']} className="flex-1 bg-surface">
        <View role="dialog" aria-modal aria-label="Pa'Casa" className="min-h-0 flex-1">
          <View className="min-h-14 flex-row items-center justify-between gap-3 border-b border-border px-4 py-2">
            <Pressable
              role="button"
              aria-label={t('assistant.close', language)}
              onPress={close}
              className="h-11 w-11 items-center justify-center rounded-soft border border-border bg-surface-raised focus-visible:outline-2 focus-visible:outline-focus"
            >
              <X size={22} className="text-text" />
            </Pressable>
            <Text className="font-display text-xl text-text">Pa&apos;Casa</Text>
            <View aria-hidden className="h-11 w-11" />
          </View>

          {form && progress ? (
            <View className="border-b border-border px-4 py-2">
              <Text className="text-sm text-text-muted">
                {form.title} · {next ? `Pregunta ${progress.done + 1} de ${progress.total}` : 'Todas las preguntas contestadas'}
              </Text>
            </View>
          ) : null}

          <Nav aria-label="Modo de Pa'Casa" className="flex-row gap-2 border-b border-border px-4 py-3">
            {MODES.map((item) => {
              const selected = mode === item.id;
              return (
                <Pressable
                  key={item.id}
                  role="button"
                  aria-current={selected ? 'true' : undefined}
                  accessibilityState={{ selected }}
                  onPress={() => setMode(item.id)}
                  className={`min-h-12 flex-1 flex-row items-center justify-center gap-2 rounded-soft border px-3 focus-visible:outline-2 focus-visible:outline-focus ${
                    selected ? 'border-transparent bg-accent' : 'border-border bg-surface-raised'
                  }`}
                >
                  <item.icon size={18} className={selected ? 'text-on-accent' : 'text-text-muted'} />
                  <Text className={`text-sm font-semibold ${selected ? 'text-on-accent' : 'text-text-muted'}`}>{t(item.labelKey, language)}</Text>
                </Pressable>
              );
            })}
          </Nav>

          <ScrollView className="min-h-0 flex-1" contentContainerClassName="px-4 py-6">
            {mode === 'hablar' ? <HablarMode form={form} next={next} /> : null}
            {mode === 'traducir' ? <TraducirMode /> : null}
            {mode === 'preguntar' ? <PreguntarMode form={form} /> : null}
          </ScrollView>

          <View className="border-t border-border px-4 py-3">
            <Text className="text-center text-sm text-text-muted">
              Pa&apos;Casa ayuda con formularios; no da consejos médicos.
            </Text>
          </View>
        </View>
      </SafeArea>
    </Modal>
  );
}

/** Hablar: complete the active form conversationally, one question at a time. */
function HablarMode({
  form,
  next,
}: {
  form: PatientForm | null;
  next: PatientAnswer | null;
}) {
  const draft = useLiveOverlay((state) => state.draft);
  const proposal = useLiveOverlay((state) => state.proposal);
  const listening = useLiveOverlay((state) => state.listening);
  const setAnswer = usePatientSession((state) => state.setAnswer);
  const confirmAnswer = usePatientSession((state) => state.confirmAnswer);
  const cancelListen = useRef<(() => void) | null>(null);

  // Leaving Hablar (mode switch, close, unmount) stops any open microphone.
  useEffect(
    () => () => {
      cancelListen.current?.();
      cancelListen.current = null;
      useLiveOverlay.getState().setListening(false);
    },
    [],
  );

  if (!form) {
    return (
      <View className="mx-auto w-full max-w-2xl gap-6">
        <Text className="text-base leading-7 text-text-muted">
          Todavía no hay un formulario activo. Empiece con el formulario de ejemplo y se lo pregunto en español.
        </Text>
        <PatientBigAction icon={Mic} label="Empezar con un formulario" hint="Hablando, en español" onPress={() => startExampleForm()} />
      </View>
    );
  }

  if (!next) {
    const { done, total } = formProgress(form);
    return (
      <View className="mx-auto w-full max-w-2xl items-center gap-6">
        <Text role="heading" aria-level={2} className="font-display text-2xl text-text">
          Formulario completo
        </Text>
        <Text className="text-base text-text-muted">
          Contestó {done} de {total} preguntas. Revise sus respuestas antes de terminar.
        </Text>
        <View className="w-full flex-row flex-wrap justify-center gap-3">
          <Link href="/game" {...linkClose(() => { stopSpeaking(); useLiveOverlay.getState().closeLive(); })}>
            <View className="min-h-12 items-center justify-center rounded-soft border border-transparent bg-cta px-6">
              <Text className="text-base font-semibold text-on-cta">Revisar respuestas</Text>
            </View>
          </Link>
          <PatientButton tone="quiet" label="Cerrar" onPress={() => { stopSpeaking(); useLiveOverlay.getState().closeLive(); }} />
        </View>
      </View>
    );
  }

  const startListening = () => {
    if (!canListen()) return;
    useLiveOverlay.getState().setListening(true);
    const cancel = listen(
      (transcript) => useLiveOverlay.getState().setProposal(transcript),
      () => {
        useLiveOverlay.getState().setListening(false);
        cancelListen.current = null;
      },
    );
    if (cancel) cancelListen.current = cancel;
    else useLiveOverlay.getState().setListening(false);
  };

  const confirmProposal = () => {
    if (!proposal) return;
    setAnswer(form.id, next.id, proposal);
    confirmAnswer(form.id, next.id, true);
    speak(proposal);
    useLiveOverlay.setState({ proposal: null, draft: '' });
  };

  return (
    <View className="mx-auto w-full max-w-2xl gap-6" role="region" aria-label="Pregunta actual">
      <View className="gap-2">
        <Text role="heading" aria-level={2} className="font-display text-2xl leading-snug text-text md:text-3xl">
          {next.questionEs}
        </Text>
        <Text className="text-sm text-text-muted">En el formulario dice: {next.sourceLabel}</Text>
      </View>

      {canSpeak() ? (
        <Pressable
          role="button"
          onPress={() => speak(next.questionEs)}
          className="min-h-11 flex-row items-center gap-2 self-start focus-visible:outline-2 focus-visible:outline-focus"
          aria-label="Escuchar la pregunta"
        >
          <Volume2 size={18} className="text-accent" />
          <Text className="text-sm font-semibold text-accent">Escuchar la pregunta</Text>
        </Pressable>
      ) : null}

      {proposal ? (
        <View aria-live="polite" className="gap-4 rounded-soft border border-border bg-surface-raised p-5">
          <Text className="text-sm font-semibold text-text-muted">Así lo entendí</Text>
          <Text className="text-xl text-text">{proposal}</Text>
          <View className="flex-row flex-wrap gap-3">
            <PatientButton label="Sí, correcto" onPress={confirmProposal} />
            <PatientButton
              tone="quiet"
              label="Corregir"
              onPress={() => useLiveOverlay.setState({ draft: proposal, proposal: null })}
            />
          </View>
        </View>
      ) : (
        <View className="gap-4">
          {canListen() ? (
            <Pressable
              role="button"
              onPress={startListening}
              disabled={listening}
              aria-disabled={listening}
              aria-label="Responder hablando"
              className="h-24 w-24 items-center justify-center self-start rounded-full border-4 border-surface bg-accent focus-visible:outline-2 focus-visible:outline-focus disabled:opacity-70"
            >
              <Mic size={36} className="text-on-accent" />
            </Pressable>
          ) : (
            <View className="flex-row items-center gap-2">
              <MicOff size={18} className="text-text-muted" />
              <Text className="text-sm text-text-muted">El dictado no está disponible aquí; escriba su respuesta.</Text>
            </View>
          )}
          <View className="gap-3">
            <Text className="text-sm text-text-muted">Su respuesta</Text>
            <TextInput
              value={draft}
              onChangeText={(value) => useLiveOverlay.getState().setDraft(value)}
              aria-label="Su respuesta"
              className="min-h-12 w-full rounded-soft border border-border bg-surface-raised px-4 text-base text-text placeholder:text-text-muted focus:border-border-strong"
            />
            <View className="flex-row flex-wrap gap-3">
              <PatientButton
                label="Responder"
                disabled={!draft.trim()}
                onPress={() => useLiveOverlay.getState().setProposal(draft.trim())}
              />
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

/** Traducir: verified two-way English ⇄ Spanish for the front desk. */
function TraducirMode() {
  const direction = useLiveOverlay((state) => state.direction);
  const phraseInput = useLiveOverlay((state) => state.phraseInput);
  const translation = useLiveOverlay((state) => state.translation);
  const sourceKey = direction === 'en-es' ? 'en' : 'es';

  const translate = (input: string) => {
    useLiveOverlay.getState().setTranslation({ ...translatePhrase(input, direction), asked: input });
  };

  return (
    <View className="mx-auto w-full max-w-2xl gap-6">
      <View className="flex-row flex-wrap gap-3" role="group" aria-label="Dirección de la traducción">
        <PatientButton
          tone={direction === 'en-es' ? 'solid' : 'quiet'}
          label={DIRECTION_LABEL['en-es']}
          onPress={() => useLiveOverlay.setState({ direction: 'en-es', translation: null })}
        />
        <PatientButton
          tone={direction === 'es-en' ? 'solid' : 'quiet'}
          label={DIRECTION_LABEL['es-en']}
          onPress={() => useLiveOverlay.setState({ direction: 'es-en', translation: null })}
        />
      </View>

      <View className="gap-3">
        <Text className="text-sm text-text-muted">Frases frecuentes</Text>
        <View className="flex-row flex-wrap gap-2">
          {PHRASES.map((phrase) => (
            <Pressable
              key={phrase.en}
              role="button"
              onPress={() => {
                useLiveOverlay.getState().setPhraseInput(phrase[sourceKey]);
                translate(phrase[sourceKey]);
              }}
              className="min-h-11 items-center justify-center rounded-soft border border-border bg-surface-raised px-4 hover:bg-surface-sunken focus-visible:outline-2 focus-visible:outline-focus"
            >
              <Text className="text-sm text-text-muted">{phrase[sourceKey]}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View className="gap-3">
        <Text className="text-sm text-text-muted">
          {direction === 'en-es' ? 'Escriba en inglés' : 'Escriba en español'}
        </Text>
        <TextInput
          value={phraseInput}
          onChangeText={(value) => useLiveOverlay.getState().setPhraseInput(value)}
          aria-label={direction === 'en-es' ? 'Escriba en inglés' : 'Escriba en español'}
          className="min-h-12 w-full rounded-soft border border-border bg-surface-raised px-4 text-base text-text placeholder:text-text-muted focus:border-border-strong"
        />
        <View className="flex-row flex-wrap gap-3">
          <PatientButton label="Traducir" disabled={!phraseInput.trim()} onPress={() => translate(phraseInput.trim())} />
        </View>
      </View>

      {translation ? (
        <View aria-live="polite" className="gap-4 rounded-soft border border-border bg-surface-raised p-5">
          {translation.matched ? (
            <>
              <Text className="text-sm font-semibold text-text-muted">
                {direction === 'en-es' ? 'Español' : 'English'}
              </Text>
              <Text className="text-xl text-text">{translation.text}</Text>
              {canSpeak() ? (
                <View className="flex-row flex-wrap gap-3">
                  <PatientButton
                    tone="quiet"
                    label="Escuchar"
                    onPress={() => speak(translation.text, direction === 'en-es' ? 'es-MX' : 'en-US')}
                  />
                </View>
              ) : null}
            </>
          ) : (
            <View className="gap-2">
              <Text className="text-base text-text">
                No tengo una traducción verificada para esa frase. Puede usar una de las frases frecuentes.
              </Text>
              <Text className="text-sm text-text-muted">
                Para asuntos de salud, pida un intérprete médico calificado.
              </Text>
            </View>
          )}
        </View>
      ) : null}
    </View>
  );
}

/** Preguntar: grounded answers about this form — never open-ended advice. */
function PreguntarMode({ form }: { form: PatientForm | null }) {
  const questionInput = useLiveOverlay((state) => state.questionInput);
  const groundedAnswer = useLiveOverlay((state) => state.groundedAnswer);
  const setMode = useLiveOverlay((state) => state.setMode);

  const ask = (text: string) => {
    const grounding = groundQuestion(text, form);
    useLiveOverlay.getState().setGroundedAnswer({ asked: text, grounding });
    if (grounding.readAloud && canSpeak()) speak(grounding.readAloud);
  };

  return (
    <View className="mx-auto w-full max-w-2xl gap-6">
      <View className="flex-row flex-wrap gap-2">
        {SUGGESTED_QUESTIONS.map((suggestion) => (
          <Pressable
            key={suggestion}
            role="button"
            onPress={() => {
              useLiveOverlay.getState().setQuestionInput(suggestion);
              ask(suggestion);
            }}
            className="min-h-11 items-center justify-center rounded-soft border border-border bg-surface-raised px-4 hover:bg-surface-sunken focus-visible:outline-2 focus-visible:outline-focus"
          >
            <Text className="text-sm text-text-muted">{suggestion}</Text>
          </Pressable>
        ))}
      </View>

      <View className="gap-3">
        <Text className="text-sm text-text-muted">Pregúnteme sobre este formulario</Text>
        <TextInput
          value={questionInput}
          onChangeText={(value) => useLiveOverlay.getState().setQuestionInput(value)}
          aria-label="Pregúnteme sobre este formulario"
          className="min-h-12 w-full rounded-soft border border-border bg-surface-raised px-4 text-base text-text placeholder:text-text-muted focus:border-border-strong"
        />
        <View className="flex-row flex-wrap gap-3">
          <PatientButton label="Preguntar" disabled={!questionInput.trim()} onPress={() => ask(questionInput.trim())} />
        </View>
      </View>

      {groundedAnswer ? (
        <View aria-live="polite" className="gap-4 rounded-soft border border-border bg-surface-raised p-5">
          <Text className="text-xl leading-snug text-text">{groundedAnswer.grounding.text}</Text>

          {groundedAnswer.grounding.sourceLabel ? (
            <View className="gap-1 border-t border-border pt-4">
              <Text className="text-sm font-semibold text-text-muted">En el formulario dice</Text>
              <Text className="text-base text-text">{groundedAnswer.grounding.sourceLabel}</Text>
              {groundedAnswer.grounding.questionEs ? (
                <>
                  <Text className="pt-2 text-sm font-semibold text-text-muted">En español</Text>
                  <Text className="text-base text-text-muted">{groundedAnswer.grounding.questionEs}</Text>
                </>
              ) : null}
            </View>
          ) : null}

          {groundedAnswer.grounding.directions ? (
            <DirectionsCard block={groundedAnswer.grounding.directions} />
          ) : null}

          <View className="flex-row flex-wrap gap-3">
            {groundedAnswer.grounding.readAloud && canSpeak() ? (
              <PatientButton tone="quiet" label="Escuchar" onPress={() => speak(groundedAnswer.grounding.readAloud ?? '')} />
            ) : null}
            {groundedAnswer.grounding.sourceLabel ? (
              <Link href="/hybrid" {...linkClose(() => { stopSpeaking(); useLiveOverlay.getState().closeLive(); })}>
                <View className="min-h-12 items-center justify-center rounded-soft border border-border bg-surface-raised px-6">
                  <Text className="text-base font-semibold text-text">Ver en el documento</Text>
                </View>
              </Link>
            ) : null}
            {!form ? (
              <PatientButton
                label="Empezar un formulario"
                onPress={() => {
                  startExampleForm();
                  setMode('hablar');
                }}
              />
            ) : null}
          </View>
        </View>
      ) : (
        <View className="flex-row items-center gap-2">
          <Check size={16} className="text-text-muted" />
          <Text className="text-sm text-text-muted">
            Las respuestas salen de su formulario y de sus propias respuestas.
          </Text>
        </View>
      )}
    </View>
  );
}
