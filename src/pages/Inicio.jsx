import { useNavigate } from 'react-router-dom';
import { Camera, FileText, ListChecks, Mic } from 'lucide-react';
import { addUploadedDocument, startExampleForm } from '@/session/actions';
import { pendingAnswers, session, useSession } from '@/session/store';
import { pickDocument } from '@/session/voice';
import { ActionButton, BigAction, Panel, PatientFrame, ProgressRow } from '@/components/patient-ui';

/** Inicio: the patient's starting point. It answers "¿Qué necesita hacer ahora?". */
export default function Inicio() {
  const { forms, activeFormId, documents } = useSession();
  const navigate = useNavigate();

  const activeForm = forms.find((form) => form.id === activeFormId) ?? null;
  const latestDocument = documents[0] ?? null;
  const hasAnswers = forms.some((form) => form.answers.some((answer) => answer.confirmed && answer.value.trim()));

  const continueTalking = () => {
    session.set({ returnTo: '/' });
    navigate('/pacasa');
  };

  const startForm = () => {
    startExampleForm();
    session.set({ returnTo: '/' });
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

  return (
    <PatientFrame
      question="¿Qué necesita hacer ahora?"
      title={activeForm ? 'Continuemos' : '¿Qué necesita llenar hoy?'}
      lead={
        activeForm
          ? `${activeForm.title} · ${activeForm.clinic}`
          : 'Suba el formulario de la clínica y Pa’Casa se lo pregunta en español, una pregunta a la vez.'
      }
    >
      {activeForm ? (
        <Panel label="Formulario en curso">
          <ProgressRow form={activeForm} />
          <p className="text-sm text-fg-muted">
            {pendingAnswers(activeForm).length === 0
              ? 'Ya contestó todo. Revise sus respuestas.'
              : `Siguiente pregunta: ${pendingAnswers(activeForm)[0].questionEs}`}
          </p>
          <div className="flex flex-wrap gap-3">
            <ActionButton label="Continuar hablando" onPress={continueTalking} />
            <ActionButton tone="quiet" label="Revisar respuestas" onPress={() => navigate('/revisar')} />
          </div>
        </Panel>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          <BigAction icon={Mic} label="🎤 Empezar con un formulario" hint="Hablando, en español" onPress={startForm} />
          <BigAction icon={Camera} label="📷 Tomar foto" hint="Del formulario en papel" onPress={takePhoto} />
          <BigAction icon={FileText} label="📄 Subir PDF" hint="El formulario de la clínica" onPress={uploadPdf} />
        </div>
      )}

      {activeForm ? (
        <div className="grid gap-4 md:grid-cols-2">
          <BigAction icon={Mic} label="Empezar otro formulario" tone="quiet" onPress={startForm} />
          <BigAction icon={FileText} label="Subir PDF" tone="quiet" onPress={uploadPdf} />
        </div>
      ) : null}

      {latestDocument ? (
        <Panel label="Último documento">
          <div className="space-y-1">
            <p className="font-display text-lg text-fg">{latestDocument.title}</p>
            <p className="text-sm text-fg-muted">
              {latestDocument.clinic} · {latestDocument.kind === 'pdf' ? 'PDF' : 'Imagen'} ·{' '}
              {latestDocument.pages.length > 0 ? `${latestDocument.pages.length} páginas` : 'sin leer todavía'}
            </p>
          </div>
          <ActionButton tone="quiet" label="Ver" onPress={() => navigate('/documentos')} />
        </Panel>
      ) : null}

      {hasAnswers ? (
        <Panel label="Respuestas de esta visita">
          <p className="text-base leading-7 text-fg-muted">
            Puede escuchar y corregir cada respuesta antes de terminar el formulario.
          </p>
          <ActionButton tone="quiet" icon={ListChecks} label="Ir a Revisar" onPress={() => navigate('/revisar')} />
        </Panel>
      ) : null}
    </PatientFrame>
  );
}