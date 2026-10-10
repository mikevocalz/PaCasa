'use client';

import { Link } from 'solito/link';
import { useInstanceStore, useLayoutSize, useStore } from '@acme/ui';
import { Pressable, Text, TextInput, View } from '@acme/ui/tw';
import { resolveWorkspaceLayout } from './workspace-layout';
import { PatientBigAction, PatientButton, PatientFrame, PatientPanel, ProgressRow } from './patient-ui';
import {
  FORM_SOURCE_LABEL,
  formProgress,
  pendingAnswers,
  usePatientSession,
  type PatientAnswer,
  type PatientForm,
} from '../session/patient';
import { startExampleForm } from '../session/actions';
import { useLiveOverlay } from '../session/live-overlay';
import { Mic } from '@acme/ui/icons';

/** Pa'Casa Live is a modal overlay, not a route: record this screen to return to. */
function openLiveOverlay(returnTo: string) {
  useLiveOverlay.getState().openLive(returnTo, 'hablar');
}

/** Screen-local UI state: which form is open, which answer is being corrected. */
interface FormsWorkspaceState {
  selectedId: string | null;
  inspectorOpen: boolean;
  editingId: string | null;
  draft: string;
}

const FORM_STATUS_LABEL: Record<PatientForm['status'], string> = {
  en_progreso: 'En progreso',
  listo: 'Listo',
};

/** One question: provenance label, the question, a correction field and its state. */
function AnswerRow({
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
    <View className="gap-3 border-b border-ink-800 pb-4">
      <Text className="text-xs uppercase tracking-[0.14em] text-silver-500">{answer.sourceLabel}</Text>
      <Text className="text-base text-silver-100">{answer.questionEs}</Text>
      <TextInput
        value={editing ? draft : answer.value}
        onChangeText={onEdit}
        aria-label={`Respuesta para ${answer.questionEs}`}
        placeholder="Pendiente"
        className="min-h-12 border border-ink-600 bg-ink-950 px-4 text-base text-silver-50 placeholder:text-silver-500 focus:border-royal-400"
      />
      <Text className={`text-sm ${answer.confirmed && filled ? 'text-carolina-300' : 'text-silver-400'}`}>
        {answer.confirmed && filled ? 'Confirmada' : 'Pendiente de confirmar'}
      </Text>
      <View className="flex-row flex-wrap gap-3">
        {editing ? (
          <>
            <PatientButton label="Guardar corrección" onPress={onSave} />
            <PatientButton tone="quiet" label="Cancelar" onPress={onCancel} />
          </>
        ) : null}
        {!editing && filled && !answer.confirmed ? (
          <PatientButton label="Confirmar" onPress={() => confirmAnswer(form.id, answer.id, true)} />
        ) : null}
      </View>
    </View>
  );
}

/** A form in the list: title, clinic, where it came from, progress. */
function FormRow({ form, selected, onPress }: { form: PatientForm; selected: boolean; onPress: () => void }) {
  const { done, total } = formProgress(form);
  return (
    <Pressable
      role="button"
      aria-pressed={selected}
      onPress={onPress}
      className={`min-h-14 gap-2 border-l-2 px-4 py-3 ${selected ? 'border-royal-400 bg-royal-500/20' : 'border-transparent active:bg-ink-800 hover:bg-ink-800'}`}
    >
      <Text className={`text-base ${selected ? 'font-semibold text-silver-50' : 'text-silver-200'}`}>{form.title}</Text>
      <Text className="text-sm text-silver-400">
        {form.clinic} · {FORM_SOURCE_LABEL[form.source]} · {FORM_STATUS_LABEL[form.status]}
      </Text>
      <Text className="text-sm text-silver-400">
        {done} de {total} respuestas confirmadas
      </Text>
      <ProgressRow form={form} />
    </Pressable>
  );
}

export function NativeScreen() {
  const { size, onLayout } = useLayoutSize();
  const layout = resolveWorkspaceLayout(size.width);
  const wide = layout.split;

  const store = useInstanceStore<FormsWorkspaceState>(() => ({ selectedId: null, inspectorOpen: false, editingId: null, draft: '' }));
  const selectedId = useStore(store, (s) => s.selectedId);
  const inspectorOpen = useStore(store, (s) => s.inspectorOpen);
  const editingId = useStore(store, (s) => s.editingId);
  const draft = useStore(store, (s) => s.draft);

  const forms = usePatientSession((s) => s.forms);
  const setAnswer = usePatientSession((s) => s.setAnswer);
  const setActiveForm = usePatientSession((s) => s.setActiveForm);

  const selected = forms.find((form) => form.id === selectedId) ?? null;
  const inProgress = forms.filter((form) => form.status === 'en_progreso');
  const ready = forms.filter((form) => form.status === 'listo');

  const select = (formId: string | null) => store.setState({ selectedId: formId, editingId: null, draft: '' });

  const continueTalking = (form: PatientForm) => {
    setActiveForm(form.id);
    openLiveOverlay('/native');
  };

  const list = (
    <View className="gap-4">
      <PatientPanel label="Formularios" className="flex-1">
        {inProgress.length > 0 ? (
          <View role="list" className="gap-1">
            <Text className="text-xs font-semibold uppercase tracking-[0.18em] text-silver-400">En progreso</Text>
            {inProgress.map((form) => (
              <FormRow key={form.id} form={form} selected={form.id === selectedId} onPress={() => select(form.id)} />
            ))}
          </View>
        ) : null}
        {ready.length > 0 ? (
          <View role="list" className="gap-1">
            <Text className="text-xs font-semibold uppercase tracking-[0.18em] text-silver-400">Listos</Text>
            {ready.map((form) => (
              <FormRow key={form.id} form={form} selected={form.id === selectedId} onPress={() => select(form.id)} />
            ))}
          </View>
        ) : null}
        {forms.length === 0 ? (
          <Text className="text-base text-silver-300">No hay formularios en esta visita. Empiece uno abajo.</Text>
        ) : null}
      </PatientPanel>

      <PatientPanel label="Nuevo formulario">
        <PatientBigAction
          icon={Mic}
          label="Usar formulario de ejemplo"
          hint="Formulario de paciente nuevo"
          tone="quiet"
          onPress={() => {
            const form = startExampleForm();
            if (form) select(form.id);
          }}
        />
        <PatientButton tone="quiet" label="Hablar con Pa'Casa" onPress={() => openLiveOverlay('/native')} />
      </PatientPanel>
    </View>
  );

  const detail = selected ? (
    <PatientPanel label={selected.title} className="flex-1">
      {wide ? null : <PatientButton tone="quiet" label="Volver a formularios" onPress={() => select(null)} />}
      <View className="gap-3 border-b border-ink-800 pb-5">
        <Text className="text-xs font-semibold uppercase tracking-[0.18em] text-royal-300">Formulario</Text>
        <Text role="heading" aria-level={2} className="font-display text-2xl text-silver-50 md:text-3xl">
          {selected.title}
        </Text>
        <Text className="text-base leading-7 text-silver-300">
          {selected.clinic} · {FORM_SOURCE_LABEL[selected.source]} · {FORM_STATUS_LABEL[selected.status]}
        </Text>
        <ProgressRow form={selected} />
        <Text className="text-sm text-silver-400">
          {pendingAnswers(selected).length === 0 ? 'Todo contestado.' : `${pendingAnswers(selected).length} preguntas por contestar.`}
        </Text>
      </View>
      <View className="flex-row flex-wrap gap-3">
        <PatientButton label="Continuar hablando" onPress={() => continueTalking(selected)} />
        <Link href="/game" aria-label="Revisar respuestas">
          <View className="min-h-12 items-center justify-center border border-ink-600 bg-ink-900 px-6 shadow-card hover:border-royal-500 hover:bg-ink-800">
            <Text className="text-sm font-semibold uppercase tracking-[0.12em] text-silver-200">Revisar respuestas</Text>
          </View>
        </Link>
        {wide ? (
          <PatientButton
            tone="quiet"
            label={inspectorOpen ? 'Ocultar procedencia' : 'Ver procedencia'}
            onPress={() => store.setState((s) => ({ inspectorOpen: !s.inspectorOpen }))}
          />
        ) : null}
      </View>
      <View role="list" className="gap-4">
        {selected.answers.map((answer) => (
          <View role="listitem" key={answer.id}>
            <AnswerRow
              form={selected}
              answer={answer}
              editing={editingId === answer.id}
              draft={draft}
              onEdit={(text) => store.setState(editingId === answer.id ? { draft: text } : { editingId: answer.id, draft: text })}
              onSave={() => {
                setAnswer(selected.id, answer.id, draft);
                store.setState({ editingId: null, draft: '' });
              }}
              onCancel={() => store.setState({ editingId: null, draft: '' })}
            />
          </View>
        ))}
      </View>
    </PatientPanel>
  ) : (
    <PatientPanel label="Detalle" className="flex-1">
      <Text className="text-base text-silver-300">Elija un formulario para ver sus preguntas y corregir respuestas.</Text>
    </PatientPanel>
  );

  // Provenance overlay: 30% of the content row, absolute on the right. It never
  // resizes the 40/60 columns, and compact windows omit it entirely.
  const inspector =
    wide && selected && inspectorOpen ? (
      <View style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: layout.inspectorWidth, zIndex: 10 }}>
        <PatientPanel label="Procedencia" className="flex-1 border-royal-400 bg-ink-950">
          <PatientButton tone="quiet" label="Cerrar" onPress={() => store.setState({ inspectorOpen: false })} />
          <Text className="text-sm text-royal-300">Origen</Text>
          <Text className="text-base text-silver-50">{FORM_SOURCE_LABEL[selected.source]}</Text>
          <Text className="text-sm text-royal-300">Documento de origen</Text>
          <Text className="text-base text-silver-50">{selected.documentId ?? 'Sin documento'}</Text>
          <Text className="text-sm text-royal-300">Estado</Text>
          <Text className="text-base text-silver-50">{FORM_STATUS_LABEL[selected.status]}</Text>
          <Text className="text-sm text-royal-300">Respuestas confirmadas</Text>
          <Text className="text-base text-silver-50">
            {formProgress(selected).done} de {formProgress(selected).total}
          </Text>
        </PatientPanel>
      </View>
    ) : null;

  return (
    <PatientFrame
      question="Formularios"
      title="Sus formularios"
      lead="Lo que está llenando en esta visita, y las formas de empezar otro."
    >
      <View onLayout={onLayout} className="relative min-w-0">
        <View className="flex-row items-stretch">
          {wide || !selected ? <View style={{ width: wide ? layout.listWidth : '100%', paddingRight: wide ? 8 : 0 }}>{list}</View> : null}
          {wide || selected ? <View style={{ width: wide ? layout.detailWidth : '100%', paddingLeft: wide ? 8 : 0 }}>{detail}</View> : null}
        </View>
        {inspector}
      </View>
    </PatientFrame>
  );
}
