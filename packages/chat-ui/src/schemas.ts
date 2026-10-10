import { z } from 'zod/v4';

/** The only data shapes a model can populate. Component props are display-only. */
export const paCasaSchemas = {
  text: z.object({
    text: z.string().min(1).max(4000),
    tone: z.enum(['body', 'heading', 'note']).optional(),
  }),
  translation: z.object({
    original: z.string().min(1).max(3000),
    translated: z.string().min(1).max(3000),
    source: z.enum(['es', 'en']),
    target: z.enum(['es', 'en']),
  }),
  field: z.object({
    fieldId: z.string().min(1).max(100),
    englishLabel: z.string().min(1).max(240),
    spanishQuestion: z.string().min(1).max(400),
    proposedAnswer: z.string().max(800),
  }),
  directions: z.object({
    name: z.string().min(1).max(140),
    address: z.string().min(1).max(250),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }),
  suggestion: z.object({
    label: z.string().min(1).max(120),
    prompt: z.string().min(1).max(400),
  }),
};

export const descriptions = {
  PaCasaText: 'A short readable explanation. Prefer conversational Spanish, simple vocabulary, and no unsupported medical claims.',
  TranslationPair: 'Display a verified bilingual source and translated phrase. Both texts must be supplied by the assistant backend.',
  FormFieldReview: 'Preview one proposed English form field and Spanish explanation for explicit human review. Never save or submit the answer.',
  FollowUpSuggestion: 'A safe suggested question that fills, but never sends, the message composer.',
  DirectionsMap: 'A confirmed geocoded destination, static map preview, and app-owned route button. Coordinates must come from a trusted places API, never from free-form model text.',
  PaCasaResponse: 'The only root container. Holds an ordered list of approved components, rendering vertically inside chat.',
} as const;

/**
 * Reject dynamic OpenUI operations before parsing untrusted model output.
 * Parser validation is still required; this gate prevents built-in tools,
 * URL actions and state/mutation expression syntax being passed downstream.
 */
export const MAX_OPENUI_CHARS = 12_000;

export function safePaCasaProgram(raw: unknown): raw is string {
  if (typeof raw !== 'string' || !raw.trim() || raw.length > MAX_OPENUI_CHARS) return false;
  if (!/^\s*root\s*=\s*PaCasaResponse\s*\(/.test(raw)) return false;
  if (/(?:@|\$|\bQuery\s*\(|\bMutation\s*\(|https?:\/\/|\bjavascript\s*:|<script)/i.test(raw)) return false;
  if (raw.split('\n').length > 100) return false;
  return true;
}
