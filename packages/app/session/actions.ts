import { analyseDocument, formFromDocument } from './document-analysis';
import { demoDocuments, demoForms, usePatientSession, type PatientDocument, type PatientForm } from './patient';

/**
 * The writes the patient screens share, so a screen never reaches into the
 * session store's shape itself. Every form built here keeps the analyzer's
 * provenance (the printed label and page), and every answer starts empty
 * and unconfirmed — extraction never confirms a field on its own.
 */

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/** "Usar formulario de ejemplo": the sample intake, read and ready to answer. */
export function startExampleForm(): PatientForm | null {
  const sample = usePatientSession.getState().documents.find((document) => document.id === 'doc-nuevo-paciente')
    ?? demoDocuments()[0];
  if (!sample) return null;
  if (!usePatientSession.getState().documents.some((document) => document.id === sample.id)) {
    usePatientSession.getState().addDocument(sample);
  }
  const form = formFromDocument(sample, analyseDocument(sample));
  usePatientSession.getState().addForm(form);
  return form;
}

/** Build a form out of a document already in the session. */
export function startFormFromDocument(documentId: string): PatientForm | null {
  const document = usePatientSession.getState().documents.find((item) => item.id === documentId);
  if (!document) return null;
  const form = formFromDocument(document, analyseDocument(document));
  usePatientSession.getState().addForm(form);
  return form;
}

/**
 * A file the patient just chose or photographed. This build has no document
 * text pipeline on this surface, so the document joins the session unread
 * and the screens say so instead of inventing fields.
 */
export function addUploadedDocument(name: string, kind: PatientDocument['kind']): PatientDocument {
  const document: PatientDocument = {
    id: `doc-${slugify(name) || 'archivo'}`,
    title: name,
    clinic: 'Sesión actual',
    kind,
    pages: [],
    unreadable: true,
  };
  usePatientSession.getState().addDocument(document);
  return document;
}
