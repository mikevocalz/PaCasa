/**
 * Traducir: the front-desk phrase list. Two-way English ⇄ Spanish for the
 * sentences a clinic front desk actually repeats. An unknown sentence is
 * reported as unknown — Pa'Casa never invents a translation.
 */

export interface Phrase {
  en: string;
  es: string;
}

export const PHRASES: readonly Phrase[] = [
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

export type Direction = 'en-es' | 'es-en';

export const DIRECTION_LABEL: Record<Direction, string> = {
  'en-es': 'English → Español',
  'es-en': 'Español → English',
};

const normalise = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[¿?¡!.,;:]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

export interface Translation {
  text: string;
  matched: boolean;
}

/** Translate one phrase. No match is an honest miss, not a guess. */
export function translatePhrase(input: string, direction: Direction): Translation {
  const key = normalise(input);
  if (!key) return { text: '', matched: false };
  const source = direction === 'en-es' ? 'en' : 'es';
  const target = direction === 'en-es' ? 'es' : 'en';
  const phrase = PHRASES.find((entry) => normalise(entry[source]) === key);
  return phrase ? { text: phrase[target], matched: true } : { text: '', matched: false };
}