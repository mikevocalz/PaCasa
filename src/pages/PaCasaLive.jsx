import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Languages, Mic, MicOff, Volume2, X } from 'lucide-react';
import { startExampleForm } from '@/session/actions';
import { groundQuestion, translatePhrase, SUGGESTED_QUESTIONS } from '@/session/domain';
import { currentQuestion, formProgress, pendingAnswers, setAnswer, setConfirmed, useSession } from '@/session/store';
import { canListen, canSpeak, listen, speak, stopSpeaking } from '@/session/voice';
import { ActionButton, BigAction } from '@/components/patient-ui';
import { DirectionsCard } from '@/components/DirectionsCard';

const MODES = [
  { id: 'hablar', label: 'Hablar', icon: Mic },
  { id: 'traducir', label: 'Traducir', icon: Languages },
  { id: 'preguntar', label: 'Preguntar', icon: Volume2 },
];

/**
 * Pa'Casa Live — the voice-first command center, opened from the raised center
 * action as a root screen. It closes back to the exact screen it opened from.
 */
export default function PaCasaLive() {
  const { forms, activeFormId, returnTo } = useSession();
  const navigate = useNavigate();
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
        <button type="button" onClick={close} aria-label="Cerrar Pa’Casa Live" className="flex h-11 w-11 items-center justify-center border border-line bg-panel text-fg">
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
            <item.icon size={18} aria-hidden /> {item.label}
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

/** Traducir: two-way English ⇄ Spanish for the front desk. */
function Traducir() {
  const [direction, setDirection] = useState('en-es');
  const [input, setInput] = useState('');
  const [result, setResult] = useState(null);

  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-wrap gap-3">
        <ActionButton
          tone={direction === 'en-es' ? 'solid' : 'quiet'}
          label="English → Español"
          onPress={() => {
            setDirection('en-es');
            setResult(null);
          }}
        />
        <ActionButton
          tone={direction === 'es-en' ? 'solid' : 'quiet'}
          label="Español → English"
          onPress={() => {
            setDirection('es-en');
            setResult(null);
          }}
        />
      </div>

      <div className="space-y-3">
        <label className="block text-sm text-fg-muted" htmlFor="traducir">
          {direction === 'en-es' ? 'Escriba en inglés' : 'Escriba en español'}
        </label>
        <textarea
          id="traducir"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          rows={3}
          className="w-full border border-line bg-panel p-4 text-base text-fg outline-none"
        />
        <div className="flex flex-wrap gap-3">
          <ActionButton label="Traducir" onPress={() => setResult(translatePhrase(input, direction))} disabled={!input.trim()} />
          <ActionButton
            tone="quiet"
            label="Escuchar"
            onPress={() => speak(input)}
            disabled={!canSpeak()}
          />
        </div>
      </div>

      {result ? (
        <div className="space-y-3 border border-line bg-panel p-5" aria-live="polite">
          {result.matched ? (
            <>
              <p className="text-xs uppercase tracking-[0.14em] text-fg-subtle">Traducción</p>
              <p className="text-xl text-fg">{result.text}</p>
              <ActionButton tone="quiet" label="Escuchar" onPress={() => speak(result.text)} />
            </>
          ) : (
            <p className="text-base text-fg-muted">
              No tengo una traducción para esa frase. Puede usar una de las frases frecuentes.
            </p>
          )}
        </div>
      ) : null}
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

          {answer.directions ? <DirectionsCard block={answer.directions} /> : null}

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