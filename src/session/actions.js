import { addDocument, addForm, demoDocuments, session } from '@/session/store';
import { analyseDocument, formFromDocument } from '@/session/domain';

/**
 * The writes the patient screens share, so a screen never reaches into the
 * store's shape itself.
 */

const slugify = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** "Usar formulario de ejemplo": the sample intake, read and ready to answer. */
export function startExampleForm() {
  const state = session.get();
  const sample = state.documents.find((document) => document.id === 'doc-nuevo-paciente') ?? demoDocuments()[0];
  if (!state.documents.some((document) => document.id === sample.id)) addDocument(sample);
  const form = formFromDocument(sample, analyseDocument(sample));
  addForm(form);
  return form;
}

/** Build a form out of a document already in the session. */
export function startFormFromDocument(documentId) {
  const document = session.get().documents.find((item) => item.id === documentId);
  if (!document) return null;
  const form = formFromDocument(document, analyseDocument(document));
  addForm(form);
  return form;
}

/**
 * A file the patient just chose or photographed. This build has no PDF parser,
 * so the document joins the session unread and the analysis screen says so
 * instead of inventing fields.
 */
export function addUploadedDocument(name, kind) {
  const document = {
    id: `doc-${slugify(name) || 'archivo'}`,
    title: name,
    clinic: 'Sesión actual',
    kind,
    pages: [],
    unreadable: true,
  };
  addDocument(document);
  return document;
}