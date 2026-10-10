import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, FileText, ListChecks, Mic } from 'lucide-react';
import { addUploadedDocument, startExampleForm } from '@/session/actions';
import { FORM_SOURCE_LABEL, formProgress, pendingAnswers, session, setActiveForm, useSession } from '@/session/store';
import { pickDocument } from '@/session/voice';
import { ActionButton, BigAction, Panel, PatientFrame, ProgressRow } from '@/components/patient-ui';

/** Formularios: the form workspace for the current session. */
export default function Formularios() {
  const { forms } = useSession();
  const navigate = useNavigate();
  const [detailId, setDetailId] = useState(null);

  const detail = forms.find((form) => form.id === detailId) ?? null;
  const inProgress = forms.filter((form) => form.status === 'en_progreso');
  const ready = forms.filter((form) => form.status === 'listo');

  const continueTalking = (formId) => {
    setActiveForm(formId);
    session.set({ returnTo: '/formularios' });
    navigate('/pacasa');
  };

  const takePhoto = async () => {
    const picked = await pickDocument({ capture: true });
    if (!picked) return;
    addUploadedDocument(picked.name, 'imagen');
    navigate('/documentos');
  };

  const uploadPdf = async () => {
    const picked = await pickDocument();
    if (!picked) return;
    addUploadedDocument(picked.name, picked.kind);
    navigate('/documentos');
  };

  if (detail) {
    return <FormDetail form={detail} onBack={() => setDetailId(null)} onContinue={continueTalking} onReview={() => navigate('/revisar')} />;
  }

  return (
    <PatientFrame
      question="Formularios"
      title="Sus formularios"
      lead="Lo que está llenando en esta visita, y las formas de empezar otro."
    >
      <Panel label="En progreso">
        {inProgress.length === 0 ? (
          <p className="text-base text-fg-muted">No hay ningún formulario en progreso.</p>
        ) : (
          <div className="space-y-4">
            {inProgress.map((form) => (
              <FormRow key={form.id} form={form} onOpen={() => setDetailId(form.id)} onContinue={() => continueTalking(form.id)} onReview={() => navigate('/revisar')} />
            ))}
          </div>
        )}
      </Panel>

      <Panel label="Listos">
        {ready.length === 0 ? (
          <p className="text-base text-fg-muted">Todavía no hay formularios terminados en esta sesión.</p>
        ) : (
          <div className="space-y-4">
            {ready.map((form) => (
              <FormRow key={form.id} form={form} onOpen={() => setDetailId(form.id)} onContinue={() => continueTalking(form.id)} onReview={() => navigate('/revisar')} />
            ))}
          </div>
        )}
      </Panel>

      <Panel label="Nuevo formulario">
        <div className="grid gap-4 md:grid-cols-3">
          <BigAction icon={Camera} label="Tomar foto" onPress={takePhoto} />
          <BigAction icon={FileText} label="Subir PDF" onPress={uploadPdf} />
          <BigAction
            icon={Mic}
            label="Usar formulario de ejemplo"
            hint="Formulario de paciente nuevo"
            tone="quiet"
            onPress={() => {
              const form = startExampleForm();
              setDetailId(form.id);
            }}
          />
        </div>
      </Panel>
    </PatientFrame>
  );
}

function FormRow({ form, onOpen, onContinue, onReview }) {
  const done = form.status === 'listo';
  return (
    <article className="space-y-5 border border-line bg-panel p-5 shadow-card md:p-6">
      <button type="button" onClick={onOpen} className="block w-full space-y-1 text-left">
        <span className="flex items-center gap-2 font-display text-xl text-fg md:text-2xl">
          {form.title}
          <span aria-hidden className="text-accent-soft">›</span>
        </span>
        <span className="block text-sm text-fg-muted">
          {form.clinic} · {FORM_SOURCE_LABEL[form.source]} · {done ? 'Listo' : 'En progreso'}
        </span>
      </button>
      <ProgressRow form={form} />
      <div className="flex flex-wrap gap-3">
        {done ? (
          <ActionButton label="Revisar respuestas" onPress={onReview} />
        ) : (
          <>
            <ActionButton label="Continuar" onPress={onContinue} />
            <ActionButton tone="quiet" label="Revisar" onPress={onReview} />
          </>
        )}
      </div>
    </article>
  );
}

/** FormDetail — a nested screen, not another tab. */
function FormDetail({ form, onBack, onContinue, onReview }) {
  const { done, total } = formProgress(form);
  const pending = pendingAnswers(form);

  return (
    <PatientFrame question="Formulario" title={form.title} lead={`${form.clinic} · ${FORM_SOURCE_LABEL[form.source]}`}>
      <button type="button" onClick={onBack} className="self-start text-sm font-semibold uppercase tracking-[0.12em] text-accent-soft">
        ‹ Formularios
      </button>

      <Panel label="Progreso">
        <ProgressRow form={form} />
        <p className="text-sm text-fg-muted">
          {done} de {total} {done === 1 ? 'respuesta confirmada' : 'respuestas confirmadas'} ·{' '}
          {pending.length === 0 ? 'nada pendiente' : `${pending.length} por preguntar`}
        </p>
        <div className="flex flex-wrap gap-3">
          <ActionButton label="Continuar hablando" onPress={() => onContinue(form.id)} />
          <ActionButton tone="quiet" label="Revisar respuestas" onPress={onReview} />
        </div>
      </Panel>

      <Panel label="Preguntas del formulario">
        <ol className="space-y-4">
          {form.answers.map((answer) => (
            <li key={answer.id} className="space-y-1 border-b border-line/60 pb-3 last:border-b-0 last:pb-0">
              <p className="text-xs uppercase tracking-[0.14em] text-fg-subtle">{answer.sourceLabel}</p>
              <p className="text-base text-fg">{answer.questionEs}</p>
              <p className="text-sm text-fg-muted">
                {answer.confirmed && answer.value.trim() ? answer.value : 'Pendiente'}
              </p>
            </li>
          ))}
        </ol>
      </Panel>

      <p className="flex items-center gap-2 text-sm text-fg-subtle">
        <ListChecks size={16} aria-hidden /> Al terminar, revise sus respuestas en la pestaña Revisar.
      </p>
    </PatientFrame>
  );
}