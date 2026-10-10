import assert from 'node:assert/strict';
import { test } from 'node:test';
import { analysisCopy, analyseDocument, formFromDocument } from './document-analysis.ts';
import type { PatientDocument } from './patient.ts';

const intake: PatientDocument = {
  id: 'doc-test',
  title: 'Intake de prueba',
  clinic: 'Clínica de prueba',
  kind: 'pdf',
  pages: [
    { number: 1, text: ['NEW PATIENT INTAKE', '', 'Patient Name: ______', 'Date of Birth: ______'].join('\n') },
    { number: 2, text: ['HISTORY', '', 'Allergies: ______', 'Reason for visit: ______'].join('\n') },
  ],
};

test('ready analysis keeps sourceLabel, page and questionEs provenance on every field', () => {
  const result = analyseDocument(intake);
  assert.equal(result.state, 'ready');
  assert.equal(result.fields.length, 4);
  assert.equal(result.unreadable.length, 0);

  const byLabel = new Map(result.fields.map((field) => [field.sourceLabel, field]));
  assert.deepEqual(byLabel.get('Patient Name'), {
    sourceLabel: 'Patient Name',
    page: 1,
    questionEs: '¿Cuál es su nombre completo?',
  });
  assert.equal(byLabel.get('Date of Birth')?.page, 1);
  assert.equal(byLabel.get('Allergies')?.page, 2);
  assert.equal(byLabel.get('Reason for visit')?.questionEs, '¿Cuál es el motivo de su consulta?');
});

test('a label with no known Spanish question is unreadable and the document needs review', () => {
  const document: PatientDocument = {
    ...intake,
    pages: [{ number: 3, text: ['Patient Name: ______', 'Phlebotomy Ref: ______'].join('\n') }],
  };
  const result = analyseDocument(document);
  assert.equal(result.state, 'needs_review');
  // The known label still reports its provenance; the unknown one is not guessed at.
  assert.equal(result.fields.length, 1);
  assert.equal(result.fields[0]?.sourceLabel, 'Patient Name');
  assert.equal(result.fields[0]?.page, 3);
  assert.deepEqual(result.unreadable, ['Phlebotomy Ref']);
  assert.ok(!result.fields.some((field) => field.sourceLabel === 'Phlebotomy Ref'));
});

test('a document flagged unreadable reports needs_review with no invented fields', () => {
  const uploaded: PatientDocument = {
    id: 'doc-upload',
    title: 'scan-0142.pdf',
    clinic: 'Sesión actual',
    kind: 'pdf',
    pages: [],
    unreadable: true,
  };
  const result = analyseDocument(uploaded);
  assert.equal(result.state, 'needs_review');
  assert.equal(result.fields.length, 0);
  assert.deepEqual(result.unreadable, ['scan-0142.pdf']);
  // No fields means nothing to put on a form.
  assert.equal(formFromDocument(uploaded, result).answers.length, 0);
});

test('a readable document with no fill-in lines reports no_fields honestly', () => {
  const letter: PatientDocument = {
    ...intake,
    pages: [{ number: 1, text: 'Su cita es el lunes a las nueve.\nTraiga su identificación y su seguro.' }],
  };
  const result = analyseDocument(letter);
  assert.equal(result.state, 'no_fields');
  assert.equal(result.fields.length, 0);
  assert.equal(result.unreadable.length, 0);
  assert.equal(analysisCopy(result), 'Este documento no tiene preguntas para el formulario.');
});
