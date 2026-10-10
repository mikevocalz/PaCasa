import { create } from 'zustand';

/**
 * The patient session: everything Pa'Casa knows about the CURRENT visit.
 *
 * Ephemeral by design — the hackathon session lives in memory for one visit and
 * is never framed as permanent medical-record storage (LOCKED ARCHITECTURE,
 * "Documentos"). Zustand and module-scoped (repo rule), because the five tab
 * routes and Pa'Casa Live all read the same session.
 */

export type FormSource = 'voz' | 'foto' | 'pdf' | 'ejemplo';
export type FormStatus = 'en_progreso' | 'listo';

export interface PatientAnswer {
  id: string;
  /** The label exactly as printed on the source form. */
  sourceLabel: string;
  questionEs: string;
  value: string;
  confirmed: boolean;
}

export interface PatientForm {
  id: string;
  title: string;
  clinic: string;
  source: FormSource;
  status: FormStatus;
  answers: PatientAnswer[];
  /** The document this form was read out of, when it came from one. */
  documentId: string | null;
}

export interface PatientDocumentPage {
  /** 1-based, as a reader counts pages. */
  number: number;
  text: string;
}

export interface PatientDocument {
  id: string;
  title: string;
  clinic: string;
  kind: 'pdf' | 'imagen';
  pages: PatientDocumentPage[];
  /**
   * A file the reader has no parser for: no text was extracted, so nothing can
   * be analysed. The screens say so instead of inventing fields.
   */
  unreadable?: boolean;
}

export const FORM_SOURCE_LABEL: Record<FormSource, string> = {
  voz: 'Dictado por voz',
  foto: 'Tomado con la cámara',
  pdf: 'PDF subido',
  ejemplo: 'Formulario de ejemplo',
};

const answer = (id: string, sourceLabel: string, questionEs: string, value: string, confirmed: boolean): PatientAnswer =>
  ({ id, sourceLabel, questionEs, value, confirmed });

export function demoForms(): PatientForm[] {
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

export function demoDocuments(): PatientDocument[] {
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

export interface FormProgress {
  done: number;
  total: number;
}

const isAnswered = (item: PatientAnswer) => item.confirmed && item.value.trim().length > 0;

/** How many answers are confirmed, out of the questions this form asks. */
export function formProgress(form: PatientForm): FormProgress {
  return { done: form.answers.filter(isAnswered).length, total: form.answers.length };
}

/** The questions Pa'Casa still has to ask, in form order. */
export function pendingAnswers(form: PatientForm): PatientAnswer[] {
  return form.answers.filter((item) => !isAnswered(item));
}

/** The question on the table right now: the first unanswered one. */
export function currentQuestion(form: PatientForm | null): PatientAnswer | null {
  return form ? pendingAnswers(form)[0] ?? null : null;
}

/**
 * Safe to finish only when every answer holds a value the patient confirmed.
 * `completeForm` refuses anything short of this, so no screen can mark a form
 * `listo` over pending or unconfirmed answers.
 */
export function canCompleteForm(form: PatientForm): boolean {
  return form.answers.length > 0 && form.answers.every(isAnswered);
}

export const latestDocument = (documents: PatientDocument[]): PatientDocument | null => documents[0] ?? null;

export const findDocument = (documents: PatientDocument[], id: string | null | undefined) =>
  documents.find((document) => document.id === id) ?? null;

const baseline = (demo: boolean) => {
  const forms = demo ? demoForms() : [];
  return {
    forms,
    documents: demo ? demoDocuments() : ([] as PatientDocument[]),
    activeFormId: forms.find((form) => form.status === 'en_progreso')?.id ?? null,
  };
};

interface PatientSessionState {
  forms: PatientForm[];
  documents: PatientDocument[];
  /** Sample data loaded? The drawer's Modo demo switches this. */
  demoMode: boolean;
  activeFormId: string | null;
  setAnswer: (formId: string, answerId: string, value: string) => void;
  confirmAnswer: (formId: string, answerId: string, confirmed: boolean) => void;
  addForm: (form: PatientForm) => void;
  setActiveForm: (formId: string | null) => void;
  completeForm: (formId: string) => void;
  addDocument: (document: PatientDocument) => void;
  /** Clear the visit back to its baseline (empty, or the sample data). */
  resetSession: () => void;
  setDemoMode: (on: boolean) => void;
}

const patchForm = (forms: PatientForm[], formId: string, patch: (form: PatientForm) => PatientForm) =>
  forms.map((form) => (form.id === formId ? patch(form) : form));

export const usePatientSession = create<PatientSessionState>((set) => ({
  demoMode: true,
  ...baseline(true),
  setAnswer: (formId, answerId, value) =>
    set((state) => ({
      forms: patchForm(state.forms, formId, (form) => ({
        ...form,
        // A corrected answer is unconfirmed again until Pa'Casa reads it back.
        answers: form.answers.map((item) => (item.id === answerId ? { ...item, value, confirmed: false } : item)),
      })),
    })),
  confirmAnswer: (formId, answerId, confirmed) =>
    set((state) => ({
      forms: patchForm(state.forms, formId, (form) => ({
        ...form,
        answers: form.answers.map((item) => (item.id === answerId ? { ...item, confirmed } : item)),
      })),
    })),
  addForm: (form) =>
    set((state) => ({
      forms: [form, ...state.forms.filter((existing) => existing.id !== form.id)],
      activeFormId: form.status === 'en_progreso' ? form.id : state.activeFormId,
    })),
  setActiveForm: (activeFormId) => set({ activeFormId }),
  completeForm: (formId) =>
    set((state) => {
      const form = state.forms.find((item) => item.id === formId);
      // Never confirm answers on the patient's behalf: an incomplete or
      // unconfirmed form stays en_progreso and the call is a no-op.
      if (!form || !canCompleteForm(form)) return {};
      return {
        forms: patchForm(state.forms, formId, (item) => ({ ...item, status: 'listo' })),
        activeFormId: state.activeFormId === formId ? null : state.activeFormId,
      };
    }),
  addDocument: (document) => set((state) => ({ documents: [document, ...state.documents.filter((existing) => existing.id !== document.id)] })),
  resetSession: () => set((state) => ({ ...baseline(state.demoMode) })),
  setDemoMode: (on) => set({ demoMode: on, ...baseline(on) }),
}));

/** The form the tab bar, Inicio and Pa'Casa Live all point at. */
export function useActiveForm(): PatientForm | null {
  const activeFormId = usePatientSession((state) => state.activeFormId);
  const forms = usePatientSession((state) => state.forms);
  return forms.find((form) => form.id === activeFormId) ?? null;
}