import { useSyncExternalStore } from 'react';

/**
 * The patient session: everything Pa'Casa knows about the CURRENT visit.
 *
 * Ephemeral by design — this is a hackathon demo session, held in memory for
 * one visit, never framed as permanent medical-record storage.
 *
 * A tiny store rather than a state library: one module-scoped object the five
 * tab screens and Pa'Casa Live all read, so switching tabs never loses the
 * visit. Snapshots are stable references, so React re-renders only on a write.
 */
function createStore(initializer) {
  let state = initializer();
  const listeners = new Set();

  const set = (partial) => {
    const next = typeof partial === 'function' ? partial(state) : partial;
    if (next === state) return;
    state = { ...state, ...next };
    listeners.forEach((listener) => listener());
  };

  const useStore = () =>
    useSyncExternalStore(
      (listener) => {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
      () => state,
      () => state,
    );

  return { get: () => state, set, useStore };
}

export const FORM_SOURCE_LABEL = {
  voz: 'Dictado por voz',
  foto: 'Tomado con la cámara',
  pdf: 'PDF subido',
  ejemplo: 'Formulario de ejemplo',
};

const answer = (id, sourceLabel, questionEs, value, confirmed) => ({
  id,
  sourceLabel,
  questionEs,
  value,
  confirmed,
});

/** The sample visit: one intake form, read but not finished. */
function demoForms() {
  return [
    {
      id: 'form-nuevo-paciente',
      title: 'Formulario de paciente nuevo',
      clinic: 'Clínica San Miguel',
      source: 'pdf',
      status: 'en_progreso',
      documentId: 'doc-nuevo-paciente',
      answers: [
        answer('a-nombre', 'Patient Name', '¿Cuál es su nombre completo?', 'Rosa Velázquez', true),
        answer('a-nacimiento', 'Date of Birth', '¿Cuál es su fecha de nacimiento?', '14 de junio de 1959', true),
        answer('a-telefono', 'Phone Number', '¿Cuál es su número de teléfono?', '(555) 018-2244', true),
        answer('a-direccion', 'Home Address', '¿Cuál es su dirección?', 'Calle Reforma 218, Cuernavaca', true),
        answer('a-emergencia', 'Emergency Contact', '¿A quién llamamos en caso de emergencia?', 'Miguel Velázquez · (555) 014-8890', true),
        answer('a-medicinas', 'Current medications', '¿Qué medicinas toma actualmente?', '', false),
        answer('a-alergias', 'Allergies', '¿A qué es alérgico?', '', false),
        answer('a-motivo', 'Reason for visit', '¿Cuál es el motivo de su consulta?', '', false),
      ],
    },
  ];
}

/** The source documents of this visit, as the reader sees them. */
export function demoDocuments() {
  return [
    {
      id: 'doc-nuevo-paciente',
      title: 'Formulario de paciente nuevo',
      clinic: 'Clínica San Miguel',
      kind: 'pdf',
      pages: [
        {
          number: 1,
          text: [
            'CLÍNICA SAN MIGUEL · NEW PATIENT INTAKE',
            '',
            'Patient Name: ______________________',
            'Date of Birth: ______________________',
            'Phone Number: ______________________',
            'Home Address: ______________________',
          ].join('\n'),
        },
        {
          number: 2,
          text: [
            'EMERGENCY CONTACT',
            '',
            'Emergency Contact: ______________________',
            'Current medications: ______________________',
            '',
            'Página 2 de 3 · complete cada línea',
          ].join('\n'),
        },
        {
          number: 3,
          text: [
            'MEDICAL HISTORY',
            '',
            'Allergies: ______________________',
            'Reason for visit: ______________________',
            '',
            'Clínica San Miguel · Recepción',
          ].join('\n'),
        },
      ],
    },
    {
      id: 'doc-historia',
      title: 'Historia médica',
      clinic: 'Clínica San Miguel',
      kind: 'pdf',
      pages: [
        {
          number: 1,
          text: [
            'HISTORIA MÉDICA · Dra. Elena Ruiz',
            '',
            'La paciente refiere dolor de rodilla derecha desde hace tres meses.',
            'Se recomienda fisioterapia dos veces por semana.',
          ].join('\n'),
        },
        {
          number: 2,
          text: [
            'ESTUDIOS REALIZADOS',
            '',
            'Radiografía de rodilla derecha — 12 de mayo.',
            'Análisis de sangre completos — 18 de mayo.',
            'Próxima cita: 2 de junio.',
          ].join('\n'),
        },
      ],
    },
  ];
}

const baseline = (demo) => {
  const forms = demo ? demoForms() : [];
  return {
    forms,
    documents: demo ? demoDocuments() : [],
    activeFormId: forms[0]?.id ?? null,
  };
};

export const session = createStore(() => ({
  demoMode: true,
  /** Where Pa'Casa Live returns to when it closes. */
  returnTo: '/',
  ...baseline(true),
}));

export const useSession = session.useStore;

/* ------------------------------------------------------------------ writes */

export const setReturnTo = (returnTo) => session.set({ returnTo });

export const setActiveForm = (activeFormId) => session.set({ activeFormId });

export const setAnswer = (formId, answerId, value) =>
  session.set((state) => ({
    forms: state.forms.map((form) =>
      form.id === formId
        ? {
            ...form,
            // A corrected answer is unconfirmed again until Pa'Casa reads it back.
            answers: form.answers.map((item) => (item.id === answerId ? { ...item, value, confirmed: false } : item)),
          }
        : form,
    ),
  }));

export const setConfirmed = (formId, answerId, confirmed) =>
  session.set((state) => ({
    forms: state.forms.map((form) =>
      form.id === formId
        ? { ...form, answers: form.answers.map((item) => (item.id === answerId ? { ...item, confirmed } : item)) }
        : form,
    ),
  }));

export const addForm = (form) =>
  session.set((state) => ({
    forms: [form, ...state.forms.filter((existing) => existing.id !== form.id)],
    activeFormId: form.status === 'en_progreso' ? form.id : state.activeFormId,
  }));

export const completeForm = (formId) =>
  session.set((state) => ({
    forms: state.forms.map((form) =>
      form.id === formId
        ? {
            ...form,
            status: 'listo',
            answers: form.answers.map((item) => ({ ...item, confirmed: item.value.trim().length > 0 })),
          }
        : form,
    ),
    activeFormId: state.activeFormId === formId ? null : state.activeFormId,
  }));

export const addDocument = (document) =>
  session.set((state) => ({
    documents: [document, ...state.documents.filter((existing) => existing.id !== document.id)],
  }));

export const resetSession = () => session.set((state) => baseline(state.demoMode));

export const setDemoMode = (demoMode) => session.set({ demoMode, ...baseline(demoMode) });

/* ------------------------------------------------------------- selectors */

const isAnswered = (item) => item.confirmed && item.value.trim().length > 0;

export const formProgress = (form) => ({
  done: form.answers.filter(isAnswered).length,
  total: form.answers.length,
});

/** The questions Pa'Casa still has to ask, in form order. */
export const pendingAnswers = (form) => form.answers.filter((item) => !isAnswered(item));

export const currentQuestion = (form) => (form ? pendingAnswers(form)[0] ?? null : null);