'use client';

import { createLibrary, defineComponent, useTriggerAction } from '@openuidev/react-lang';
import { z } from 'zod/v4';
import { Pressable, Text, View } from '@acme/ui/tw';
import { descriptions, paCasaSchemas } from './schemas';

/**
 * Every view uses Pa'Casa's universal UI primitives (HTML on web, native views
 * on Expo). Props never include URLs, functions, tools, or generated JSX.
 */
const Paragraph = defineComponent({
  name: 'PaCasaText',
  description: descriptions.PaCasaText,
  props: paCasaSchemas.text,
  component: ({ props }) => (
    <Text className={
      props.tone === 'heading' ? 'font-display text-xl leading-7 text-silver-50' :
      props.tone === 'note' ? 'text-sm leading-6 text-silver-400' :
      'text-base leading-7 text-silver-100'
    }>{props.text}</Text>
  ),
});

const Translation = defineComponent({
  name: 'TranslationPair',
  description: descriptions.TranslationPair,
  props: paCasaSchemas.translation,
  component: ({ props }) => (
    <View className="gap-3 border border-royal-400/60 bg-ink-950 p-4">
      <View className="gap-1">
        <Text className="text-xs font-semibold uppercase tracking-wider text-silver-400">
          {props.source === 'en' ? 'English' : 'Español'}
        </Text>
        <Text className="text-base leading-7 text-silver-200">{props.original}</Text>
      </View>
      <View className="h-px bg-ink-700" />
      <View className="gap-1">
        <Text className="text-xs font-semibold uppercase tracking-wider text-royal-300">
          {props.target === 'en' ? 'English' : 'Español'}
        </Text>
        <Text className="text-lg leading-7 text-silver-50">{props.translated}</Text>
      </View>
    </View>
  ),
});

const FieldReview = defineComponent({
  name: 'FormFieldReview',
  description: descriptions.FormFieldReview,
  props: paCasaSchemas.field,
  component: ({ props }) => {
    const triggerAction = useTriggerAction();
    return (
      <View className="gap-3 border border-ink-600 bg-ink-900 p-4">
        <Text className="text-xs font-semibold uppercase tracking-wider text-royal-300">
          Revisar · {props.englishLabel}
        </Text>
        <Text className="text-lg leading-7 text-silver-50">{props.spanishQuestion}</Text>
        <Text className="text-base leading-7 text-silver-200">
          Respuesta propuesta: {props.proposedAnswer || 'Sin respuesta'}
        </Text>
        <Text className="text-sm leading-6 text-silver-400">
          La confirmación solo prepara un mensaje. No se completa ni envía el formulario.
        </Text>
        <View className="flex-row flex-wrap gap-3">
          <Pressable role="button" accessibilityLabel={'Confirmar respuesta de ' + props.englishLabel}
            onPress={() => triggerAction('Confirmar para revisar el campo ' + props.fieldId + ': ' + props.proposedAnswer)}
            className="min-h-12 flex-1 items-center justify-center border border-royal-300 bg-royal-500 px-3">
            <Text className="text-sm font-semibold text-silver-50">Revisar y confirmar</Text>
          </Pressable>
          <Pressable role="button" accessibilityLabel={'Corregir respuesta de ' + props.englishLabel}
            onPress={() => triggerAction('Necesito corregir el campo ' + props.fieldId + '.')}
            className="min-h-12 flex-1 items-center justify-center border border-silver-500 bg-ink-800 px-3">
            <Text className="text-sm font-semibold text-silver-50">Corregir</Text>
          </Pressable>
        </View>
      </View>
    );
  },
});

const Suggestion = defineComponent({
  name: 'FollowUpSuggestion',
  description: descriptions.FollowUpSuggestion,
  props: paCasaSchemas.suggestion,
  component: ({ props }) => {
    const triggerAction = useTriggerAction();
    return (
      <Pressable role="button" accessibilityLabel={'Sugerencia: ' + props.label}
        onPress={() => triggerAction(props.prompt)}
        className="min-h-12 self-start justify-center border border-royal-400/70 bg-ink-900 px-4">
        <Text className="text-base font-semibold text-silver-100">{props.label}</Text>
      </Pressable>
    );
  },
});

const Response = defineComponent({
  name: 'PaCasaResponse',
  description: descriptions.PaCasaResponse,
  props: z.object({
    children: z.array(z.union([Paragraph.ref, Translation.ref, FieldReview.ref, Suggestion.ref])).max(12),
  }),
  component: ({ props, renderNode }) => (
    <View className="w-full min-w-0 gap-4">{renderNode(props.children)}</View>
  ),
});

/** The matching backend model library is in modelLibrary.ts (shared Zod schemas). */
export const library = createLibrary({
  root: 'PaCasaResponse',
  components: [Response, Paragraph, Translation, FieldReview, Suggestion],
  componentGroups: [
    { name: 'Bilingual assistance', components: ['PaCasaText', 'TranslationPair'], notes: ['Explain English forms in plain Spanish.'] },
    { name: 'User-controlled form review', components: ['FormFieldReview', 'FollowUpSuggestion'], notes: ['No action can submit, save or commit an answer.'] },
  ],
});
