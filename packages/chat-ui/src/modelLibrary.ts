/**
 * Node-compatible OpenUI library for system-prompt/spec generation.
 * Uses the EXACT same schemas and descriptions as the React Native renderer.
 * Deliberately imports no DOM, React Native, app shell or credentials.
 */
import { createLibrary, defineComponent } from '@openuidev/react-lang';
import { z } from 'zod/v4';
import { descriptions, paCasaSchemas } from './schemas';

const Paragraph = defineComponent({
  name: 'PaCasaText', description: descriptions.PaCasaText,
  props: paCasaSchemas.text, component: () => null,
});
const Translation = defineComponent({
  name: 'TranslationPair', description: descriptions.TranslationPair,
  props: paCasaSchemas.translation, component: () => null,
});
const FieldReview = defineComponent({
  name: 'FormFieldReview', description: descriptions.FormFieldReview,
  props: paCasaSchemas.field, component: () => null,
});
const Suggestion = defineComponent({
  name: 'FollowUpSuggestion', description: descriptions.FollowUpSuggestion,
  props: paCasaSchemas.suggestion, component: () => null,
});
const Directions = defineComponent({
  name: 'DirectionsMap', description: descriptions.DirectionsMap,
  props: paCasaSchemas.directions, component: () => null,
});
const Response = defineComponent({
  name: 'PaCasaResponse', description: descriptions.PaCasaResponse,
  props: z.object({
    children: z.array(z.union([Paragraph.ref, Translation.ref, FieldReview.ref, Suggestion.ref, Directions.ref])).max(12),
  }),
  component: () => null,
});
export const library = createLibrary({
  root: 'PaCasaResponse',
  components: [Response, Paragraph, Translation, FieldReview, Suggestion, Directions],
  componentGroups: [
    { name: 'Bilingual assistance', components: ['PaCasaText', 'TranslationPair'], notes: ['Explain English forms in plain Spanish.'] },
    { name: 'Real places and directions', components: ['DirectionsMap'], notes: ['Only verified geocoded coordinates.'] },
    { name: 'User-controlled form review', components: ['FormFieldReview', 'FollowUpSuggestion'], notes: ['No action can submit, save or commit an answer.'] },
  ],
});
