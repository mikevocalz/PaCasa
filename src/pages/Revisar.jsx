import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pencil, Volume2 } from 'lucide-react';
import { startExampleForm } from '@/session/actions';
import { completeForm, formProgress, session, setAnswer, setConfirmed, useSession } from '@/session/store';
import { canPrint, canSpeak, printDocument, speak } from '@/session/voice';
import { ActionButton, Panel, PatientFrame } from '@/components/patient-ui';

/** Revisar: review, correction and patient control — the heart of Pa'Casa. */
export default function Revisar() {
  const { forms, activeFormId } = useSession();
  const navigate = useNavigate();
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState('');
  const [completed, setCompleted] = useState(false);

  const form =
    forms.find((item) => item.id === activeFormId) ??
    forms.find((item) => item.answers.some((answer) => answer.value.trim())) ??
    forms[0] ??
    null;

  const { done, total } = form ? formProgress(form) : { done: 0, total: 0 };

  if (!form || done === 0) {
    return (
      <PatientFrame question="Revisar" title="Todavía no hay respuestas." lead="Cuando conteste algunas preguntas, aquí las verá todas juntas.">
        <ActionButton
          label="Empezar un formulario"
          onPress={() => {
            startExampleForm();
            session.set({ returnTo: '/revisar' });
            navigate('/pacasa');
          }}
        />
      </PatientFrame>
    );
  }

  if (completed) {
    return (
      <PatientFrame question="Revisar" title="Todo está correcto" lead={`${form.title} · ${form.clinic}`}>
        <Panel label="Respuestas confirmadas">
          <dl className="space-y-4">
            {form.answers.map((answer) => (
              <div key={answer.id} className="border-b border-line/60 pb-3 last:border-b-0 last:pb-0">
                <dt className="text-xs uppercase tracking-[0.14em] text-fg-subtle">{answer.sourceLabel}</dt>
                <dd className="text-base text-fg">{answer.value || 'Sin respuesta'}</dd>
              </div>
            ))}
          </dl>
          <div className="flex flex-wrap gap-3">
            {canPrint() ? <ActionButton label="Crear PDF" onPress={printDocument} /> : null}
            <ActionButton tone="quiet" label="Volver a revisar" onPress={() => setCompleted(false)} />
            <ActionButton tone="quiet" label="Ir a Formularios" onPress={() => navigate('/formularios')} />
          </div>
        </Panel>
      </PatientFrame>
    );
  }

  return (
    <PatientFrame
      question="Revisar"
      title="Revise sus respuestas"
      lead={`${form.title} · ${form.clinic}`}
    >
      <Panel label="Progreso">
        <p className="text-base text-fg">
          {done} de {total} respuestas confirmadas
        </p>
        {done < total ? (
          <ActionButton
            label="Continuar formulario"
            onPress={() => {
              session.set({ returnTo: '/revisar' });
              navigate('/pacasa');
            }}
          />
        ) : null}
      </Panel>

      <div className="space-y-4">
        {form.answers.map((answer) => {
          const filled = Boolean(answer.value.trim());
          const editing = editingId === answer.id;
          return (
            <article key={answer.id} className="space-y-3 border border-line bg-panel p-5 shadow-card">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-[0.14em] text-fg-subtle">{answer.sourceLabel}</p>
                <h2 className="font-display text-xl leading-tight text-fg">{answer.questionEs}</h2>
              </div>

              {editing ? (
                <div className="space-y-3">
                  <input
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    aria-label={`Respuesta para ${answer.questionEs}`}
                    className="min-h-12 w-full border border-line bg-page px-4 text-base text-fg outline-none"
                  />
                  <div className="flex flex-wrap gap-3">
                    <ActionButton
                      label="Guardar"
                      onPress={() => {
                        setAnswer(form.id, answer.id, draft);
                        setConfirmed(form.id, answer.id, true);
                        setEditingId(null);
                      }}
                    />
                    <ActionButton tone="quiet" label="Cancelar" onPress={() => setEditingId(null)} />
                  </div>
                </div>
              ) : (
                <p className="text-lg text-fg">{filled ? answer.value : 'Pendiente'}</p>
              )}

              {!editing ? (
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => speak(`${answer.questionEs}. ${answer.value}`)}
                    disabled={!canSpeak()}
                    className="flex min-h-11 items-center gap-2 border border-line bg-panel px-4 text-sm text-fg-muted hover:text-fg disabled:opacity-40"
                  >
                    <Volume2 size={18} aria-hidden /> Escuchar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(answer.id);
                      setDraft(answer.value);
                    }}
                    className="flex min-h-11 items-center gap-2 border border-line bg-panel px-4 text-sm text-fg-muted hover:text-fg"
                  >
                    <Pencil size={18} aria-hidden /> Editar
                  </button>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>

      <Panel label="Todo está correcto">
        <p className="text-base leading-7 text-fg-muted">
          Si sus respuestas están bien, Pa’Casa genera el documento de la visita.
        </p>
        <ActionButton
          label="Crear PDF"
          onPress={() => {
            completeForm(form.id);
            setCompleted(true);
          }}
        />
      </Panel>
    </PatientFrame>
  );
}