'use client';

import { Link } from 'solito/link';
import { useInstanceStore, useStore } from '@acme/ui';
import { Text, TextInput, View } from '@acme/ui/tw';
import { startExampleForm } from '../session/actions';
import { useLiveOverlay } from '../session/live-overlay';
import {
  canCompleteForm,
  formProgress,
  usePatientSession,
  type PatientAnswer,
  type PatientForm,
} from '../session/patient';
import { canPrint, printDocument } from '../session/print';
import { canSpeak, speak } from '../speech/speech';
import { PatientButton, PatientFrame, PatientPanel, ProgressRow } from './patient-ui';

/** Pa'Casa Live is a modal overlay, not a route: record this screen to return to. */
function openLiveOverlay(returnTo: string) {
  useLiveOverlay.getState().openLive(returnTo, 'hablar');
}

/** Screen-local UI state: which answer is being edited and the in-progress text. */
interface ReviewState {
  editingId: string | null;
  draft: string;
}

/** One answer on the review surface: provenance, question, value and controls. */
function ReviewRow({
  form,
  answer,
  editing,
  draft,
  onEdit,
  onSave,
  onCancel,
}: {
  form: PatientForm;
  answer: PatientAnswer;
  editing: boolean;
  draft: string;
  onEdit: (text: string) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const confirmAnswer = usePatientSession((s) => s.confirmAnswer);
  const filled = answer.value.trim().length > 0;
  return (
    <View className="gap-3 rounded-soft border border-border bg-surface-raised p-5">
      <View className="gap-1">
        <Text className="text-sm font-semibold text-text-muted">{answer.sourceLabel}</Text>
        <Text role="heading" aria-level={2} className="font-display text-xl leading-tight text-text">
          {answer.questionEs}
        </Text>
      </View>
      {editing ? (
        <TextInput
          value={draft}
          onChangeText={onEdit}
          aria-label={`Respuesta para ${answer.questionEs}`}
          className="min-h-12 rounded-soft border border-border bg-surface px-4 text-base text-text placeholder:text-text-muted focus:border-border-strong"
        />
      ) : (
        <Text className="text-lg leading-8 text-text">{filled ? answer.value : 'Pendiente'}</Text>
      )}
      <Text className={`text-sm ${answer.confirmed && filled ? 'text-success' : 'text-text-muted'}`}>
        {answer.confirmed && filled ? 'Confirmada' : 'Pendiente de confirmar'}
      </Text>
      <View className="flex-row flex-wrap gap-3">
        {editing ? (
          <>
            <PatientButton label="Guardar" onPress={onSave} />
            <PatientButton tone="quiet" label="Cancelar" onPress={onCancel} />
          </>
        ) : (
          <PatientButton tone="quiet" label="Editar" onPress={() => onEdit(answer.value)} />
        )}
        {!editing && filled && !answer.confirmed ? (
          <PatientButton label="Confirmar" onPress={() => confirmAnswer(form.id, answer.id, true)} />
        ) : null}
        {canSpeak() && !editing ? (
          <PatientButton tone="quiet" label="Escuchar" onPress={() => speak(`${answer.questionEs}. ${answer.value || 'Pendiente'}`)} />
        ) : null}
      </View>
    </View>
  );
}

/** The reviewed summary once the form is marked listo. */
function ReadySummary({ form }: { form: PatientForm }) {
  return (
    <PatientFrame question="Revisar" title="Todo está correcto" lead={`${form.title} · ${form.clinic}`}>
      <PatientPanel label="Respuestas confirmadas">
        <View role="list" className="gap-4">
          {form.answers.map((answer) => (
            <View role="listitem" key={answer.id} className="gap-1 border-b border-border pb-3">
              <Text className="text-sm font-semibold text-text-muted">{answer.sourceLabel}</Text>
              <Text className="text-base leading-7 text-text">{answer.value || 'Sin respuesta'}</Text>
            </View>
          ))}
        </View>
        <View className="flex-row flex-wrap gap-3">
          {canPrint() ? (
            <PatientButton label="Imprimir o guardar" onPress={printDocument} />
          ) : (
            <Text className="text-base leading-7 text-text-muted">
              Imprimir no está disponible en esta versión. Puede mostrar este resumen en recepción.
            </Text>
          )}
          <Link href="/native" aria-label="Ir a Formularios">
            <View className="min-h-12 items-center justify-center rounded-soft border border-border bg-surface-raised px-6 hover:bg-surface-sunken">
              <Text className="text-base font-semibold text-text">Ir a Formularios</Text>
            </View>
          </Link>
        </View>
      </PatientPanel>
    </PatientFrame>
  );
}

export function GameScreen() {
  const store = useInstanceStore<ReviewState>(() => ({ editingId: null, draft: '' }));
  const editingId = useStore(store, (s) => s.editingId);
  const draft = useStore(store, (s) => s.draft);

  const forms = usePatientSession((s) => s.forms);
  const activeFormId = usePatientSession((s) => s.activeFormId);
  const setAnswer = usePatientSession((s) => s.setAnswer);
  const setActiveForm = usePatientSession((s) => s.setActiveForm);
  const completeForm = usePatientSession((s) => s.completeForm);

  // The active form, else the first form with any answer filled in.
  const form =
    forms.find((item) => item.id === activeFormId) ??
    forms.find((item) => item.answers.some((answer) => answer.value.trim().length > 0)) ??
    forms[0] ??
    null;

  const { done, total } = form ? formProgress(form) : { done: 0, total: 0 };

  if (!form || done === 0) {
    return (
      <PatientFrame
        question="Revisar"
        title="Todavía no hay respuestas."
        lead="Cuando conteste algunas preguntas, aquí las verá todas juntas."
      >
        <PatientButton
          label="Empezar un formulario"
          onPress={() => {
            const started = startExampleForm();
            if (!started) return;
            setActiveForm(started.id);
            openLiveOverlay('/game');
          }}
        />
      </PatientFrame>
    );
  }

  if (form.status === 'listo') {
    return <ReadySummary form={form} />;
  }

  const completable = canCompleteForm(form);
  const remaining = form.answers.filter((answer) => !(answer.confirmed && answer.value.trim().length > 0)).length;

  return (
    <PatientFrame question="Revisar" title="Revise sus respuestas" lead={`${form.title} · ${form.clinic}`}>
      <PatientPanel label="Progreso">
        <ProgressRow form={form} />
        <Text className="text-base leading-7 text-text">
          {done} de {total} respuestas confirmadas
        </Text>
        {done < total ? (
          <PatientButton
            label="Continuar formulario"
            onPress={() => {
              setActiveForm(form.id);
              openLiveOverlay('/game');
            }}
          />
        ) : null}
      </PatientPanel>

      <View role="list" className="gap-4">
        {form.answers.map((answer) => (
          <View role="listitem" key={answer.id}>
            <ReviewRow
              form={form}
              answer={answer}
              editing={editingId === answer.id}
              draft={draft}
              onEdit={(text) => store.setState(editingId === answer.id ? { draft: text } : { editingId: answer.id, draft: text })}
              onSave={() => {
                setAnswer(form.id, answer.id, draft);
                store.setState({ editingId: null, draft: '' });
              }}
              onCancel={() => store.setState({ editingId: null, draft: '' })}
            />
          </View>
        ))}
      </View>

      <PatientPanel label="Todo está correcto">
        <Text className="text-base leading-7 text-text-muted">
          {completable
            ? 'Todas las respuestas están confirmadas. Marque el formulario como listo.'
            : `Faltan ${remaining} respuestas por contestar y confirmar antes de terminar.`}
        </Text>
        <PatientButton label="Marcar como listo" disabled={!completable} onPress={() => completeForm(form.id)} />
      </PatientPanel>
    </PatientFrame>
  );
}
