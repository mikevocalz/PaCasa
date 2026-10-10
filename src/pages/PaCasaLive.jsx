import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Languages, Mic, MicOff, Volume2, X } from 'lucide-react';
import { startExampleForm } from '@/session/actions';
import { groundQuestion, PHRASES, SUGGESTED_QUESTIONS } from '@/session/domain';
import { currentQuestion, formProgress, pendingAnswers, setAnswer, setConfirmed, useSession } from '@/session/store';
import { canListen, canSpeak, listen, speak, stopSpeaking } from '@/session/voice';
import { ActionButton, BigAction } from '@/components/patient-ui';
import { useLocale } from '@/i18n/store';
import { speechLanguage } from '@/i18n/locale.mjs';
import { translateForRecipient } from '@/i18n/translate.mjs';

const MODES = [
  { id: 'hablar', key: 'live.mode.speak', icon: Mic },
  { id: 'traducir', key: 'live.mode.translate', icon: Languages },
  { id: 'preguntar', key: 'live.mode.ask', icon: Volume2 },
];

/**
 * Pa'Casa Live — the voice-first command center, opened from the raised center
 * action as a root screen. It closes back to the exact screen it opened from.
 */
export default function PaCasaLive() {
  const { forms, activeFormId, returnTo } = useSession();
  const navigate = useNavigate();
  const { t } = useLocale();
  const [mode, setMode] = useState('hablar');

  const form = forms.find((item) => item.id === activeFormId) ?? forms.find((item) => item.status === 'en_progreso') ?? null;
  const next = form ? currentQuestion(form) : null;
  const { done, total } = form ? formProgress(form) : { done: 0, total: 0 };

  useEffect(() => () => stopSpeaking(), []);

  const close = () => {
    stopSpeaking();
    navigate(returnTo || '/');
  };

  return (
    <div className="flex min-h-screen flex-col bg-page">
      <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
        <button type="button" onClick={close} aria-label={t('live.close')} className="flex h-11 w-11 items-center justify-center border border-line bg-panel text-fg">
          <X size={22} aria-hidden />
        </button>
        <h1 className="font-display text-xl text-fg">Pa’Casa</h1>
        <span aria-hidden className="h-11 w-11" />
      </header>

      {form ? (
        <div className="border-b border-line px-4 py-2">
          <p className="text-sm text-fg-muted">
            {form.title} · {next ? `Pregunta ${done + 1} de ${total}` : 'Todas las preguntas contestadas'}
          </p>
        </div>
      ) : null}

      <nav aria-label="Modo de Pa’Casa Live" className="flex gap-2 border-b border-line px-4 py-3">
        {MODES.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-current={mode === item.id ? 'true' : undefined}
            onClick={() => {
              stopSpeaking();
              setMode(item.id);
            }}
            className={`flex min-h-12 flex-1 items-center justify-center gap-2 border px-3 text-sm font-semibold ${
              mode === item.id ? 'border-royal-400 bg-accent text-silver-50' : 'border-line bg-panel text-fg-muted'
            }`}
          >
            <item.icon size={18} aria-hidden /> {t(item.key)}
          </button>
        ))}
      </nav>

      <main className="min-h-0 flex-1 overflow-y-auto px-4 py-6">
        {mode === 'hablar' ? <Hablar form={form} next={next} done={done} total={total} onReview={() => navigate('/revisar')} onClose={close} /> : null}
        {mode === 'traducir' ? <Traducir /> : null}
        {mode === 'preguntar' ? <Preguntar form={form} next={next} onClose={close} /> : null}
      </main>
    </div>
  );
}

/** Hablar: complete the form conversationally, one question at a time. */
function Hablar({ form, next, done, total, onReview, onClose }) {
  const [draft, setDraft] = useState('');
  const [hearing, setHearing] = useState(false);
  const [proposal, setProposal] = useState(null);

  if (!form) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <p className="text-base leading-7 text-fg-muted">
          Todavía no hay un formulario activo. Empiece con el formulario de ejemplo y se lo pregunto en español.
        </p>
        <BigAction icon={Mic} label="Empezar con un formulario" onPress={startExampleForm} />
      </div>
    );
  }

  if (!next) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 text-center">
        <p className="font-display text-2xl text-fg">Formulario completo</p>
        <p className="text-base text-fg-muted">
          Contestó {done} de {total} preguntas. Revise sus respuestas antes de terminar.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <ActionButton label="Revisar respuestas" onPress={onReview} />
          <ActionButton tone="quiet" label="Cerrar" onPress={onClose} />
        </div>
      </div>
    );
  }

  const startListening = () => {
    setHearing(true);
    const cancel = listen(
      (transcript) => setProposal(transcript),
      () => setHearing(false),
    );
    if (!cancel) setHearing(false);
  };

  return (
    <section aria-labelledby="current-question" className="mx-auto max-w-2xl space-y-6">
      <h2 id="current-question" className="font-display text-2xl leading-snug text-fg md:text-3xl">
        {next.questionEs}
      </h2>
      <p className="text-sm text-fg-subtle">En el formulario dice: {next.sourceLabel}</p>

      {canSpeak() ? (
        <button
          type="button"
          onClick={() => speak(next.questionEs)}
          className="flex min-h-11 items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-accent-soft"
        >
          <Volume2 size={18} aria-hidden /> Escuchar la pregunta
        </button>
      ) : null}

      {proposal ? (
        <div className="space-y-4 border border-line bg-panel p-5">
          <p className="text-sm uppercase tracking-[0.14em] text-fg-subtle">Así lo entendí</p>
          <p className="text-xl text-fg">{proposal}</p>
          <div className="flex flex-wrap gap-3">
            <ActionButton
              label="Sí, correcto"
              onPress={() => {
                setAnswer(form.id, next.id, proposal);
                setConfirmed(form.id, next.id, true);
                speak(proposal);
                setProposal(null);
                setDraft('');
              }}
            />
            <ActionButton tone="quiet" label="Corregir" onPress={() => setProposal(null)} />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {canListen() ? (
            <button
              type="button"
              onClick={startListening}
              disabled={hearing}
              className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-page bg-accent text-silver-50 shadow-raised disabled:opacity-70"
              aria-label="Responder hablando"
            >
              <Mic size={36} aria-hidden />
            </button>
          ) : (
            <p className="flex items-center gap-2 text-sm text-fg-muted">
              <MicOff size={18} aria-hidden /> El dictado no está disponible aquí; escriba su respuesta.
            </p>
          )}
          <div className="space-y-3">
            <label className="block text-sm text-fg-muted" htmlFor="respuesta">
              Su respuesta
            </label>
            <input
              id="respuesta"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              className="min-h-12 w-full border border-line bg-panel px-4 text-base text-fg outline-none"
            />
            <ActionButton label="Responder" onPress={() => draft.trim() && setProposal(draft.trim())} disabled={!draft.trim()} />
          </div>
        </div>
      )}
    </section>
  );
}

/** A local conversation preview, not a clinical messaging transport.
 * Provider input is English; patient preference comes from the device or
 * an accessible override. No manually chosen language direction.
 */
function Traducir() {
  const { language, preference, setPreference, deviceLanguage, t } = useLocale();
  const [speaker, setSpeaker] = useState('provider');
  const [input, setInput] = useState('');
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [hearing, setHearing] = useState(false);
  const requestId = useRef(0);

  const sourceLanguage = speaker === 'provider' ? 'en' : language;
  const targetLanguage = speaker === 'provider' ? language : 'en';
  const label = (code) => t(code === 'en' ? 'locale.en' : 'locale.es');

  useEffect(() => {
    requestId.current += 1;
    setResult(null);
    setBusy(false);
    stopSpeaking();
  }, [language, speaker]);

  useEffect(() => () => { requestId.current += 1; stopSpeaking(); }, []);

  const submit = async (text = input, participant = speaker) => {
    if (!text.trim()) return;
    const id = ++requestId.current;
    const from = participant === 'provider' ? 'en' : language;
    const to = participant === 'provider' ? language : 'en';
    setBusy(true);
    setResult(null);
    try {
      const translated = await translateForRecipient({
        text,
        sourceLanguage: from,
        targetLanguage: to,
        endpoint: import.meta.env.VITE_PACASA_TRANSLATION_URL,
      });
      if (id === requestId.current) setResult({ ...translated, original: text.trim(), from, to });
    } catch {
      if (id === requestId.current) setResult({ status: 'error', text: '', original: text.trim(), from, to });
    } finally {
      if (id === requestId.current) setBusy(false);
    }
  };

  const record = () => {
    if (hearing || !canListen()) return;
    setHearing(true);
    const cancel = listen(
      (transcript) => {
        setInput(transcript);
        void submit(transcript);
      },
      () => setHearing(false),
      speechLanguage(sourceLanguage),
    );
    if (!cancel) setHearing(false);
  };

  return (
    <section aria-labelledby="translation-title" className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-2">
        <h2 id="translation-title" className="font-display text-2xl text-fg">{t('translate.heading')}</h2>
        <p className="text-base leading-7 text-fg-muted">{t('translate.lead')}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="border border-line bg-panel p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-fg-subtle">{t('translate.provider')}</p>
          <p className="mt-2 text-lg text-fg">English</p>
        </div>
        <div className="space-y-3 border border-royal-400 bg-panel p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-fg-subtle">{t('translate.patient')}</p>
          <p className="text-lg text-fg">{label(language)}</p>
          <p className="text-sm text-fg-subtle">{t('translate.detected')} {label(deviceLanguage)}</p>
          <label className="block space-y-2" htmlFor="live-patient-language">
            <span className="block text-sm text-fg-muted">{t('locale.heading')}</span>
            <select
              id="live-patient-language"
              value={preference}
              onChange={(event) => setPreference(event.target.value)}
              className="min-h-12 w-full border border-line bg-page px-3 text-base text-fg"
            >
              <option value="auto">{t('locale.auto')}</option>
              <option value="en">{t('locale.en')}</option>
              <option value="es">{t('locale.es')}</option>
            </select>
          </label>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.12em] text-fg-muted">{t('translate.speaker')}</p>
        <div className="flex flex-wrap gap-2">
          <ActionButton
            label={t('translate.provider')}
            tone={speaker === 'provider' ? 'solid' : 'quiet'}
            onPress={() => { setSpeaker('provider'); setInput(''); }}
          />
          <ActionButton
            label={`${t('translate.patient')} · ${label(language)}`}
            tone={speaker === 'patient' ? 'solid' : 'quiet'}
            onPress={() => { setSpeaker('patient'); setInput(''); }}
          />
        </div>
      </div>

      <div className="space-y-3">
        <label htmlFor="live-translation-input" className="block text-sm text-fg-muted">
          {t(speaker === 'provider' ? 'translate.inputProvider' : 'translate.inputPatient')}
        </label>
        <textarea
          id="live-translation-input"
          lang={sourceLanguage}
          value={input}
          onChange={(event) => { setInput(event.target.value); setResult(null); }}
          maxLength={2000}
          rows={3}
          className="w-full border border-line bg-panel p-4 text-base text-fg outline-none"
        />
        <div className="flex flex-wrap gap-3">
          <ActionButton
            label={t(speaker === 'provider' ? 'translate.sendProvider' : 'translate.sendPatient')}
            disabled={!input.trim() || busy}
            onPress={() => { void submit(); }}
          />
          <ActionButton
            tone="quiet"
            label={hearing ? t('translate.listening') : t('translate.record')}
            disabled={!canListen() || hearing || busy}
            onPress={record}
          />
          <ActionButton
            tone="quiet"
            label={t('translate.listenOriginal')}
            disabled={!canSpeak() || !input.trim()}
            onPress={() => speak(input, speechLanguage(sourceLanguage))}
          />
        </div>
      </div>

      {busy ? <p role="status" className="text-sm text-fg-muted">{t('translate.waiting')}</p> : null}
      {result ? (
        <div className="space-y-4 border border-line bg-panel p-5" aria-live="polite">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-fg-subtle">{t('translate.original')} · {label(result.from)}</p>
            <p className="mt-2 whitespace-pre-wrap text-base text-fg">{result.original}</p>
          </div>
          {result.status === 'translated' || result.status === 'identity' ? (
            <div className="space-y-3 border-t border-line pt-4" lang={result.to}>
              <p className="text-xs uppercase tracking-[0.14em] text-fg-subtle">{t('translate.result')} · {label(result.to)}</p>
              <p className="whitespace-pre-wrap text-xl text-fg">{result.text}</p>
              {result.status === 'identity' ? <p className="text-sm text-fg-muted">{t('translate.same')}</p> : null}
              <ActionButton
                tone="quiet"
                label={t('translate.listenResult')}
                disabled={!canSpeak()}
                onPress={() => speak(result.text, speechLanguage(result.to))}
              />
            </div>
          ) : (
            <p role="alert" className="border-t border-line pt-4 text-sm text-fg-muted">
              {t(result.status === 'unavailable' ? 'translate.unavailable' : 'translate.error')}
            </p>
          )}
        </div>
      ) : null}

      <div className="space-y-2">
        <p className="text-sm font-semibold text-fg-muted">{t('translate.phrases')}</p>
        <div className="flex flex-wrap gap-2">
          {PHRASES.slice(0, 4).map((phrase) => (
            <button
              key={phrase.en}
              type="button"
              className="min-h-11 border border-line bg-panel px-3 py-2 text-left text-sm text-fg-muted hover:border-accent-soft"
              onClick={() => {
                setSpeaker('provider');
                setInput(phrase.en);
                void submit(phrase.en, 'provider');
              }}
            >
              {phrase.en}
            </button>
          ))}
        </div>
      </div>
      <p className="text-sm leading-6 text-fg-subtle">{t('translate.notice')}</p>
    </section>
  );
}

/** Preguntar: about the current form or document — never open-ended advice. */
function Preguntar({ form, next, onClose }) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState(null);
  const navigate = useNavigate();

  const ask = (text) => {
    const grounding = groundQuestion(text, form, form ? pendingAnswers(form) : []);
    setAnswer({ ...grounding, asked: text });
    if (grounding.readAloud) speak(grounding.readAloud);
  };

  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-wrap gap-3">
        {SUGGESTED_QUESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => {
              setQuestion(suggestion);
              ask(suggestion);
            }}
            className="min-h-11 border border-line bg-panel px-4 text-sm text-fg-muted hover:border-accent-soft hover:text-fg"
          >
            {suggestion}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        <label className="block text-sm text-fg-muted" htmlFor="preguntar">
          Pregúnteme sobre este formulario
        </label>
        <input
          id="preguntar"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          className="min-h-12 w-full border border-line bg-panel px-4 text-base text-fg outline-none"
        />
        <ActionButton label="Preguntar" onPress={() => ask(question)} disabled={!question.trim()} />
      </div>

      {answer ? (
        <div className="space-y-4 border border-line bg-panel p-5" aria-live="polite">
          <p className="text-xl leading-snug text-fg">{answer.text}</p>

          {answer.sourceLabel ? (
            <div className="space-y-1 border-t border-line/70 pt-4">
              <p className="text-xs uppercase tracking-[0.14em] text-fg-subtle">En el formulario dice</p>
              <p className="text-base text-fg">{answer.sourceLabel}</p>
              {answer.questionEs ? (
                <>
                  <p className="pt-2 text-xs uppercase tracking-[0.14em] text-fg-subtle">En español</p>
                  <p className="text-base text-fg-muted">{answer.questionEs}</p>
                </>
              ) : null}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3">
            {answer.readAloud && canSpeak() ? (
              <ActionButton tone="quiet" label="Escuchar" onPress={() => speak(answer.readAloud)} />
            ) : null}
            {answer.sourceLabel ? (
              <ActionButton
                tone="quiet"
                label="Ver en el documento"
                onPress={() => {
                  onClose();
                  navigate('/documentos');
                }}
              />
            ) : null}
            {!form && next === null ? <ActionButton label="Empezar un formulario" onPress={startExampleForm} /> : null}
          </div>
        </div>
      ) : (
        <p className="flex items-center gap-2 text-sm text-fg-subtle">
          <Check size={16} aria-hidden /> Las respuestas salen de su formulario y de sus propias respuestas.
        </p>
      )}
    </section>
  );
}