import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  canCompleteForm,
  currentQuestion,
  demoForms,
  formProgress,
  usePatientSession,
  type PatientForm,
} from './patient.ts';

/** Fresh session state per test; the store is module-scoped by design. */
function seed(forms: PatientForm[], activeFormId: string | null = null) {
  usePatientSession.setState({ forms, documents: [], activeFormId });
}

const formAt = (index = 0): PatientForm => {
  const form = usePatientSession.getState().forms[index];
  assert.ok(form);
  return form;
};

const makeAnswer = (id: string, sourceLabel: string, questionEs: string, value: string, confirmed: boolean) =>
  ({ id, sourceLabel, questionEs, value, confirmed });

const makeForm = (answers: PatientForm['answers'], status: PatientForm['status'] = 'en_progreso'): PatientForm => ({
  id: 'form-test',
  title: 'Formulario de prueba',
  clinic: 'Clínica de prueba',
  source: 'ejemplo',
  status,
  documentId: 'doc-test',
  answers,
});

test('setAnswer updates the value and clears confirmation on that answer only', () => {
  seed([
    makeForm([
      makeAnswer('a1', 'Patient Name', '¿Cuál es su nombre completo?', 'Rosa', true),
      makeAnswer('a2', 'Allergies', '¿A qué es alérgico?', 'Nada', true),
    ]),
  ]);
  usePatientSession.getState().setAnswer('form-test', 'a1', 'Rosa Velázquez');
  const [a1, a2] = formAt().answers;
  assert.ok(a1);
  assert.ok(a2);
  assert.equal(a1.value, 'Rosa Velázquez');
  assert.equal(a1.confirmed, false);
  assert.equal(a2.value, 'Nada');
  assert.equal(a2.confirmed, true);
});

test('confirmAnswer confirms only the target answer', () => {
  seed([
    makeForm([
      makeAnswer('a1', 'Patient Name', '¿Cuál es su nombre completo?', 'Rosa', false),
      makeAnswer('a2', 'Allergies', '¿A qué es alérgico?', 'Nada', false),
    ]),
  ]);
  usePatientSession.getState().confirmAnswer('form-test', 'a1', true);
  const [a1, a2] = formAt().answers;
  assert.ok(a1);
  assert.ok(a2);
  assert.equal(a1.confirmed, true);
  assert.equal(a2.confirmed, false);
});

test('completeForm refuses a form with a missing answer', () => {
  seed(
    [makeForm([makeAnswer('a1', 'Patient Name', '¿Cuál es su nombre completo?', 'Rosa', true), makeAnswer('a2', 'Allergies', '¿A qué es alérgico?', '', false)])],
    'form-test',
  );
  usePatientSession.getState().completeForm('form-test');
  assert.equal(formAt().status, 'en_progreso');
  assert.equal(usePatientSession.getState().activeFormId, 'form-test');
});

test('completeForm refuses unconfirmed answers instead of confirming for the patient', () => {
  seed([
    makeForm([
      makeAnswer('a1', 'Patient Name', '¿Cuál es su nombre completo?', 'Rosa', true),
      makeAnswer('a2', 'Allergies', '¿A qué es alérgico?', 'Penicilina', false),
    ]),
  ]);
  usePatientSession.getState().completeForm('form-test');
  const [, a2] = formAt().answers;
  assert.ok(a2);
  assert.equal(formAt().status, 'en_progreso');
  assert.equal(a2.confirmed, false);
});

test('completeForm marks listo only once every answer is confirmed and non-empty', () => {
  seed(
    [
      makeForm([
        makeAnswer('a1', 'Patient Name', '¿Cuál es su nombre completo?', 'Rosa', true),
        makeAnswer('a2', 'Allergies', '¿A qué es alérgico?', 'Penicilina', true),
      ]),
    ],
    'form-test',
  );
  assert.equal(canCompleteForm(formAt()), true);
  usePatientSession.getState().completeForm('form-test');
  assert.equal(formAt().status, 'listo');
  assert.equal(usePatientSession.getState().activeFormId, null);
});

test('formProgress counts confirmed non-empty answers and keeps provenance fields', () => {
  const form = makeForm([
    makeAnswer('a1', 'Patient Name', '¿Cuál es su nombre completo?', 'Rosa', true),
    makeAnswer('a2', 'Allergies', '¿A qué es alérgico?', 'Penicilina', false),
    makeAnswer('a3', 'Phone Number', '¿Cuál es su número de teléfono?', '', false),
  ]);
  assert.deepEqual(formProgress(form), { done: 1, total: 3 });
  const next = currentQuestion(form);
  assert.equal(next?.id, 'a2');
  assert.equal(next?.sourceLabel, 'Allergies');
  assert.equal(next?.questionEs, '¿A qué es alérgico?');
});

test('demo forms keep sourceLabel provenance on every answer', () => {
  for (const form of demoForms()) {
    for (const item of form.answers) {
      assert.ok(item.sourceLabel.length > 0);
      assert.ok(item.questionEs.length > 0);
    }
  }
});
