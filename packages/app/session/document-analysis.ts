import type { PatientDocument, PatientForm } from './patient';

/**
 * AI document analysis, independent of the viewer's pixels (LOCKED
 * ARCHITECTURE, "AI DOCUMENT ANALYSIS"): the pipeline reads the document
 * source — pages and their text — and never screenshots the viewer.
 *
 * Every detected field keeps its provenance: the label as printed, the page it
 * sits on, and the Spanish question Pa'Casa will ask. A label with no known
 * translation is reported as unreadable rather than guessed at.
 */

export type AnalysisState = 'reading' | 'detecting' | 'translating' | 'ready' | 'needs_review' | 'no_fields';

export interface DetectedField {
  sourceLabel: string;
  /** The 1-based page the label sits on. */
  page: number;
  questionEs: string;
}

export interface DocumentAnalysis {
  state: AnalysisState;
  fields: DetectedField[];
  /** Labels the analyzer found but could not read well enough to ask. */
  unreadable: string[];
}

export const ANALYSIS_COPY: Record<Exclude<AnalysisState, 'ready'>, string> = {
  reading: 'Estoy leyendo el documento…',
  detecting: 'Estoy encontrando las preguntas…',
  translating: 'Estoy preparando las preguntas en español…',
  needs_review: 'Hay una parte que no pude leer bien.',
  no_fields: 'Este documento no tiene preguntas para el formulario.',
};

/** Intake labels → the Spanish question Pa'Casa asks, keyed lowercase. */
export const QUESTION_ES: Record<string, string> = {
  'patient name': '¿Cuál es su nombre completo?',
  'date of birth': '¿Cuál es su fecha de nacimiento?',
  'phone number': '¿Cuál es su número de teléfono?',
  'home address': '¿Cuál es su dirección?',
  'emergency contact': '¿A quién llamamos en caso de emergencia?',
  'current medications': '¿Qué medicinas toma actualmente?',
  allergies: '¿A qué es alérgico?',
  'reason for visit': '¿Cuál es el motivo de su consulta?',
};

/** A blank rule line on an intake form: "Patient Name: ______". */
const FILL_IN_LINE = /^(.+?):\s*_*\s*$/;

function labelOf(line: string): string | null {
  const match = FILL_IN_LINE.exec(line.trim());
  return match ? match[1].trim() : null;
}

export function analyseDocument(document: PatientDocument): DocumentAnalysis {
  if (document.unreadable) {
    return { state: 'needs_review', fields: [], unreadable: [document.title] };
  }
  const fields: DetectedField[] = [];
  const unreadable: string[] = [];
  for (const page of document.pages) {
    for (const line of page.text.split('\n')) {
      const sourceLabel = labelOf(line);
      if (!sourceLabel) continue;
      const questionEs = QUESTION_ES[sourceLabel.toLowerCase()];
      if (questionEs) fields.push({ sourceLabel, page: page.number, questionEs });
      else unreadable.push(sourceLabel);
    }
  }
  const state: AnalysisState = unreadable.length > 0 ? 'needs_review' : fields.length > 0 ? 'ready' : 'no_fields';
  return { state, fields, unreadable };
}

export function analysisCopy(analysis: DocumentAnalysis): string {
  return analysis.state === 'ready'
    ? `Encontré ${analysis.fields.length} preguntas.`
    : ANALYSIS_COPY[analysis.state];
}

/** A runnable form built from what the analyzer read out of the document. */
export function formFromDocument(document: PatientDocument, analysis: DocumentAnalysis): PatientForm {
  return {
    id: `${document.id}-form`,
    title: document.title,
    clinic: document.clinic,
    source: 'pdf',
    status: 'en_progreso',
    documentId: document.id,
    answers: analysis.fields.map((field) => ({
      id: `${document.id}-${field.sourceLabel.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      sourceLabel: field.sourceLabel,
      questionEs: field.questionEs,
      value: '',
      confirmed: false,
    })),
  };
}

/** The field a question belongs to, so the viewer can highlight the source line. */
export function fieldForAnswer(analysis: DocumentAnalysis, questionEs: string): DetectedField | null {
  return analysis.fields.find((field) => field.questionEs === questionEs) ?? null;
}