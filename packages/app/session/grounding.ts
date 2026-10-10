import { currentQuestion, type PatientForm } from './patient';

/**
 * Preguntar: answers grounded in the active form and the answers already
 * captured (LOCKED ARCHITECTURE, "PREGUNTAR"). Not an open-ended medical chat.
 * When the session does not hold the information, Pa'Casa says so.
 *
 * Where the answer comes from a source field, the label as printed on the
 * document travels with it, so the screen can offer "Ver en el documento".
 */

/**
 * A place the patient can be routed to. The session only ever knows the
 * clinic's NAME — never coordinates — so the block carries the lookup string
 * and the card resolves it through the geocoder. What the map found is
 * displayed back to the patient rather than trusting a guessed location.
 */
export interface DirectionsBlock {
  /** The destination as the patient knows it — the clinic named on the form. */
  label: string;
  /** The lookup string for the map pin and the route link. */
  query: string;
}

export interface Grounding {
  text: string;
  /** The label exactly as printed on the source form, when the answer came from one. */
  sourceLabel?: string;
  questionEs?: string;
  /** Text worth reading aloud, when the answer is a question. */
  readAloud?: string;
  /** A "how do I get there" answer — the card shows the clinic on a map. */
  directions?: DirectionsBlock;
}

const MISSING = 'No tengo esa información en este formulario.';
const NO_FORM = 'Todavía no hay un formulario activo. Empiece un formulario y le ayudo con las preguntas.';

const normalise = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[¿?¡!.,;:]/g, '')
    .trim();

const QUESTION_TOPICS: readonly { match: RegExp; answer: RegExp }[] = [
  { match: /telefono|celular|numero/, answer: /telefono|celular/ },
  { match: /nombre/, answer: /nombre/ },
  { match: /nacimiento|cumple/, answer: /nacimiento/ },
  { match: /direccion|domicilio/, answer: /direccion/ },
  { match: /emergencia/, answer: /emergencia/ },
  { match: /medicina|medicamento/, answer: /medicina/ },
  { match: /alergi/, answer: /alergi/ },
  { match: /motivo|consulta/, answer: /motivo/ },
];

export function groundQuestion(question: string, form: PatientForm | null): Grounding {
  if (!form) return { text: NO_FORM };
  const asked = normalise(question);
  const pending = currentQuestion(form);

  // "¿Qué significa esta pregunta?" / "No entiendo esta pregunta"
  if (/significa|no entiendo|que quiere decir|explique/.test(asked)) {
    if (!pending) return { text: 'Ya contestó todas las preguntas de este formulario.' };
    return {
      text: 'Esta pregunta viene del formulario. Se la leo en voz alta si quiere.',
      sourceLabel: pending.sourceLabel,
      questionEs: pending.questionEs,
      readAloud: pending.questionEs,
    };
  }

  // "Repita la pregunta más despacio."
  if (/repita|repitame|otra vez|despacio|mas lento/.test(asked)) {
    if (!pending) return { text: 'Ya contestó todas las preguntas de este formulario.' };
    return { text: pending.questionEs, sourceLabel: pending.sourceLabel, questionEs: pending.questionEs, readAloud: pending.questionEs };
  }

  // "¿Cómo llego a la clínica?" — BEFORE the topic loop: "la dirección de la
  // clínica" also matches the /direccion/ topic, which answers with the
  // patient's own home address — exactly the wrong answer to a directions
  // question. The clinic is the only destination the session knows.
  if (/lleg|donde (queda|esta|es|se encuentra)|ubicad|direccion d(el|e la) (clinica|consultorio|hospital|cita)/.test(asked)) {
    const clinic = form.clinic.trim();
    if (!clinic) return { text: MISSING };
    return {
      text: `Su formulario es para ${clinic}. Toque «Cómo llegar» para abrir la ruta en el mapa.`,
      readAloud: `Su formulario es para ${clinic}.`,
      directions: { label: clinic, query: clinic },
    };
  }

  // "¿Qué puse como teléfono?" — a captured answer.
  for (const topic of QUESTION_TOPICS) {
    if (!topic.match.test(asked)) continue;
    const captured = form.answers.find((item) => topic.answer.test(normalise(item.questionEs)) || topic.answer.test(normalise(item.sourceLabel)));
    if (!captured) return { text: MISSING };
    if (!captured.value.trim()) {
      return {
        text: `Todavía no me ha dado ese dato. La pregunta es: ${captured.questionEs}`,
        sourceLabel: captured.sourceLabel,
        questionEs: captured.questionEs,
        readAloud: captured.questionEs,
      };
    }
    return { text: `Usted puso: ${captured.value}`, sourceLabel: captured.sourceLabel, questionEs: captured.questionEs, readAloud: captured.value };
  }

  // "¿Qué sigue?" — the next question on the table.
  if (/que sigue|siguiente|cual es la pregunta|que me va a preguntar/.test(asked)) {
    if (!pending) return { text: 'Ya contestó todas las preguntas de este formulario.' };
    return { text: `Sigue esta pregunta: ${pending.questionEs}`, sourceLabel: pending.sourceLabel, questionEs: pending.questionEs, readAloud: pending.questionEs };
  }

  return { text: MISSING };
}

/** The suggestions the Preguntar screen offers, from the architecture spec. */
export const SUGGESTED_QUESTIONS: readonly string[] = [
  '¿Qué significa esta pregunta?',
  'Repita la pregunta más despacio.',
  '¿Qué sigue?',
  '¿Cómo llego a la clínica?',
];