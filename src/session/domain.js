/**
 * Reading and understanding the visit's documents, and answering questions
 * about them — all independent of what the viewer happens to be showing.
 *
 * Nothing here guesses. A label with no known Spanish question is reported as
 * unreadable, and a question the session cannot answer says so.
 */

/* ------------------------------------------------------------- ANALYSIS */

export const ANALYSIS_COPY = {
  reading: 'Estoy leyendo el documento…',
  detecting: 'Estoy encontrando las preguntas…',
  translating: 'Estoy preparando las preguntas en español…',
  needs_review: 'Hay una parte que no pude leer bien.',
  no_fields: 'Este documento no tiene preguntas para el formulario.',
};

/** Intake labels → the Spanish question Pa'Casa asks, keyed lowercase. */
export const QUESTION_ES = {
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

const labelOf = (line) => {
  const match = FILL_IN_LINE.exec(line.trim());
  return match ? match[1].trim() : null;
};

export function analyseDocument(document) {
  if (document.unreadable) return { state: 'needs_review', fields: [], unreadable: [document.title] };

  const fields = [];
  const unreadable = [];
  for (const page of document.pages) {
    for (const line of page.text.split('\n')) {
      const sourceLabel = labelOf(line);
      if (!sourceLabel) continue;
      const questionEs = QUESTION_ES[sourceLabel.toLowerCase()];
      if (questionEs) fields.push({ sourceLabel, page: page.number, questionEs });
      else unreadable.push(sourceLabel);
    }
  }
  const state = unreadable.length > 0 ? 'needs_review' : fields.length > 0 ? 'ready' : 'no_fields';
  return { state, fields, unreadable };
}

export const analysisCopy = (analysis) =>
  analysis.state === 'ready' ? `Encontré ${analysis.fields.length} preguntas.` : ANALYSIS_COPY[analysis.state];

const slugify = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-');

/** A runnable form built from what the analyzer read out of the document. */
export function formFromDocument(document, analysis) {
  return {
    id: `${document.id}-form`,
    title: document.title,
    clinic: document.clinic,
    source: 'pdf',
    status: 'en_progreso',
    documentId: document.id,
    answers: analysis.fields.map((field) => ({
      id: `${document.id}-${slugify(field.sourceLabel)}`,
      sourceLabel: field.sourceLabel,
      questionEs: field.questionEs,
      value: '',
      confirmed: false,
    })),
  };
}

/* ------------------------------------------------------------ GROUNDING */

const MISSING = 'No tengo esa información en este formulario.';
const NO_FORM = 'Todavía no hay un formulario activo. Empiece un formulario y le ayudo con las preguntas.';

const normalise = (value) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[¿?¡!.,;:]/g, '')
    .trim();

const TOPICS = [
  { match: /telefono|celular|numero/, answer: /telefono|celular/ },
  { match: /nacimiento|cumple/, answer: /nacimiento/ },
  { match: /direccion|domicilio/, answer: /direccion/ },
  { match: /emergencia/, answer: /emergencia/ },
  { match: /medicina|medicamento/, answer: /medicina/ },
  { match: /alergi/, answer: /alergi/ },
  { match: /motivo|consulta/, answer: /motivo/ },
  { match: /nombre/, answer: /nombre/ },
];

/**
 * Preguntar: an answer grounded in the active form and the answers already
 * captured. Not an open-ended medical chat.
 */
export function groundQuestion(question, form, pending) {
  if (!form) return { text: NO_FORM };

  const asked = normalise(question);
  const next = pending[0] ?? null;

  if (/significa|no entiendo|que quiere decir|explique/.test(asked)) {
    if (!next) return { text: 'Ya contestó todas las preguntas de este formulario.' };
    return {
      text: 'Esta pregunta viene del formulario. Se la leo en voz alta si quiere.',
      sourceLabel: next.sourceLabel,
      questionEs: next.questionEs,
      readAloud: next.questionEs,
    };
  }

  if (/repita|repitame|otra vez|despacio|mas lento/.test(asked)) {
    if (!next) return { text: 'Ya contestó todas las preguntas de este formulario.' };
    return { text: next.questionEs, sourceLabel: next.sourceLabel, questionEs: next.questionEs, readAloud: next.questionEs };
  }

  if (/que sigue|siguiente|cual es la pregunta|que me va a preguntar/.test(asked)) {
    if (!next) return { text: 'Ya contestó todas las preguntas de este formulario.' };
    return {
      text: `Sigue esta pregunta: ${next.questionEs}`,
      sourceLabel: next.sourceLabel,
      questionEs: next.questionEs,
      readAloud: next.questionEs,
    };
  }

  // "¿Cómo llego a la clínica?" — BEFORE the topic loop: "la dirección de la
  // clínica" also matches the /direccion/ topic, which would answer with the
  // patient's own home address. The clinic is the only destination the
  // session knows; `directions` gives the screen a place it can map and
  // route to rather than a paragraph to invent.
  if (/lleg|donde (queda|esta|es|se encuentra)|ubicad|direccion d(el|e la) (clinica|consultorio|hospital|cita)/.test(asked)) {
    const clinic = (form.clinic ?? '').trim();
    if (!clinic) return { text: MISSING };
    return {
      text: `Su formulario es para ${clinic}. Toque «Cómo llegar» para abrir la ruta en el mapa.`,
      readAloud: `Su formulario es para ${clinic}.`,
      directions: { label: clinic, query: clinic },
    };
  }

  for (const topic of TOPICS) {
    if (!topic.match.test(asked)) continue;
    const captured = form.answers.find(
      (item) => topic.answer.test(normalise(item.questionEs)) || topic.answer.test(normalise(item.sourceLabel)),
    );
    if (!captured) return { text: MISSING };
    if (!captured.value.trim()) {
      return {
        text: `Todavía no me ha dado ese dato. La pregunta es: ${captured.questionEs}`,
        sourceLabel: captured.sourceLabel,
        questionEs: captured.questionEs,
        readAloud: captured.questionEs,
      };
    }
    return {
      text: `Usted puso: ${captured.value}`,
      sourceLabel: captured.sourceLabel,
      questionEs: captured.questionEs,
      readAloud: captured.value,
    };
  }

  return { text: MISSING };
}

export const SUGGESTED_QUESTIONS = [
  '¿Qué significa esta pregunta?',
  'Repita la pregunta más despacio.',
  '¿Qué sigue?',
  '¿Cómo llego a la clínica?',
];

/* ----------------------------------------------------------- TRADUCCIÓN */

/** Front-desk sentences, both directions. */
export const PHRASES = [
  { en: 'Good morning, how can I help you?', es: 'Buenos días, ¿en qué le puedo ayudar?' },
  { en: 'Do you have an appointment?', es: '¿Tiene una cita?' },
  { en: 'Please take a seat, we will call you shortly.', es: 'Tome asiento, por favor, la llamaremos en un momento.' },
  { en: 'Can I see your identification?', es: '¿Me puede mostrar su identificación?' },
  { en: 'Do you have insurance?', es: '¿Tiene seguro médico?' },
  { en: 'I need your date of birth.', es: 'Necesito su fecha de nacimiento.' },
  { en: 'What is your phone number?', es: '¿Cuál es su número de teléfono?' },
  { en: 'Are you allergic to any medication?', es: '¿Es alérgico a algún medicamento?' },
  { en: 'What medications do you take?', es: '¿Qué medicinas toma actualmente?' },
  { en: 'How long have you had this pain?', es: '¿Desde cuándo tiene este dolor?' },
  { en: 'Please fill out this form.', es: 'Por favor, llene este formulario.' },
  { en: 'The doctor will see you now.', es: 'El doctor la atenderá ahora.' },
  { en: 'The lab is on the second floor.', es: 'El laboratorio está en el segundo piso.' },
  { en: 'Come back in two weeks.', es: 'Regrese en dos semanas.' },
  { en: 'Do you need an interpreter?', es: '¿Necesita un intérprete?' },
  { en: 'Thank you, have a good day.', es: 'Gracias, que tenga buen día.' },
];

/** Translate one phrase. No match is an honest miss, never a guess. */
export function translatePhrase(input, direction) {
  const key = normalise(input);
  if (!key) return { text: '', matched: false };
  const source = direction === 'en-es' ? 'en' : 'es';
  const target = direction === 'en-es' ? 'es' : 'en';
  const phrase = PHRASES.find((entry) => normalise(entry[source]) === key);
  return phrase ? { text: phrase[target], matched: true } : { text: '', matched: false };
}