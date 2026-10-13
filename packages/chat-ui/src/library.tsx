'use client';

import { createLibrary, defineComponent, useTriggerAction } from '@openuidev/react-lang';
import { Linking, Platform } from 'react-native';
import { Image } from '@acme/ui';
import { z } from 'zod/v4';
import { Pressable, Text, View } from '@acme/ui/tw';
import { descriptions, paCasaSchemas } from './schemas';

/**
 * Every view uses Pa'Casa's universal UI primitives (HTML on web, native views
 * on Expo) and the daylit patient theme tokens. Props never include URLs,
 * functions, tools, or generated JSX.
 */
const Paragraph = defineComponent({
  name: 'PaCasaText',
  description: descriptions.PaCasaText,
  props: paCasaSchemas.text,
  component: ({ props }) => (
    <Text className={
      props.tone === 'heading' ? 'font-display text-xl leading-7 text-text' :
      props.tone === 'note' ? 'text-sm leading-6 text-text-muted' :
      'text-base leading-7 text-text'
    }>{props.text}</Text>
  ),
});

const Translation = defineComponent({
  name: 'TranslationPair',
  description: descriptions.TranslationPair,
  props: paCasaSchemas.translation,
  component: ({ props }) => (
    <View className="gap-3 rounded-soft border border-border bg-surface-raised p-4">
      <View className="gap-1">
        <Text className="text-xs font-semibold uppercase tracking-wider text-text-muted">
          {props.source === 'en' ? 'English' : 'Español'}
        </Text>
        <Text className="text-base leading-7 text-text-muted">{props.original}</Text>
      </View>
      <View className="h-px bg-border" />
      <View className="gap-1">
        <Text className="text-xs font-semibold uppercase tracking-wider text-accent">
          {props.target === 'en' ? 'English' : 'Español'}
        </Text>
        <Text className="text-lg leading-7 text-text">{props.translated}</Text>
      </View>
    </View>
  ),
});

const FieldReview = defineComponent({
  name: 'FormFieldReview',
  description: descriptions.FormFieldReview,
  props: paCasaSchemas.field,
  component: function FormFieldReviewComponent({ props }) {
    const triggerAction = useTriggerAction();
    return (
      <View className="gap-3 rounded-soft border border-border bg-surface-raised p-4">
        <Text className="text-xs font-semibold uppercase tracking-wider text-accent">
          Revisar · {props.englishLabel}
        </Text>
        <Text className="text-lg leading-7 text-text">{props.spanishQuestion}</Text>
        <Text className="text-base leading-7 text-text-muted">
          Respuesta propuesta: {props.proposedAnswer || 'Sin respuesta'}
        </Text>
        <Text className="text-sm leading-6 text-text-muted">
          La confirmación solo prepara un mensaje. No se completa ni envía el formulario.
        </Text>
        <View className="flex-row flex-wrap gap-3">
          <Pressable role="button" accessibilityLabel={'Confirmar respuesta de ' + props.englishLabel}
            onPress={() => triggerAction('Confirmar para revisar el campo ' + props.fieldId + ': ' + props.proposedAnswer)}
            className="min-h-12 flex-1 items-center justify-center rounded-soft border border-transparent bg-cta px-3">
            <Text className="text-sm font-semibold text-on-cta">Revisar y confirmar</Text>
          </Pressable>
          <Pressable role="button" accessibilityLabel={'Corregir respuesta de ' + props.englishLabel}
            onPress={() => triggerAction('Necesito corregir el campo ' + props.fieldId + '.')}
            className="min-h-12 flex-1 items-center justify-center rounded-soft border border-border bg-surface-sunken px-3">
            <Text className="text-sm font-semibold text-text">Corregir</Text>
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
  component: function FollowUpSuggestionComponent({ props }) {
    const triggerAction = useTriggerAction();
    return (
      <Pressable role="button" accessibilityLabel={'Sugerencia: ' + props.label}
        onPress={() => triggerAction(props.prompt)}
        className="min-h-12 self-start justify-center rounded-soft border border-accent bg-surface-raised px-4">
        <Text className="text-base font-semibold text-text">{props.label}</Text>
      </Pressable>
    );
  },
});


const MAP_ENDPOINT = Platform.OS === 'web'
  ? process.env.NEXT_PUBLIC_PACASA_ASSISTANT_URL
  : process.env.EXPO_PUBLIC_PACASA_ASSISTANT_URL;

const Directions = defineComponent({
  name: 'DirectionsMap',
  description: descriptions.DirectionsMap,
  props: paCasaSchemas.directions,
  component: ({ props }) => {
    // Strict Zod coordinates above: no arbitrary model-supplied URL can execute here.
    const coordinates = props.latitude + ',' + props.longitude;
    const mapUrl = MAP_ENDPOINT?.replace(/\/assistant\/?$/, '/assistant/map') +
      '?lat=' + props.latitude + '&lng=' + props.longitude;
    const destination = 'https://www.google.com/maps/dir/?api=1&destination=' + coordinates;
    return (
      <View className="w-full min-w-0 overflow-hidden rounded-soft border border-border bg-surface-raised">
        {MAP_ENDPOINT ? (
          // Fixed height: h-* utilities are not mapped on this style path.
          <View style={{ height: 192 }} className="w-full overflow-hidden">
            <Image framed={false} fill className="h-full w-full" src={mapUrl} alt={'Mapa para ' + props.name} />
          </View>
        ) : (
          <View className="min-h-24 items-center justify-center bg-surface-sunken px-4">
            <Text role="status" className="text-center text-sm text-text-muted">
              Vista del mapa no disponible sin servidor de mapas.
            </Text>
          </View>
        )}
        <View className="gap-3 p-4">
          <Text className="font-display text-lg leading-7 text-text">{props.name}</Text>
          <Text className="text-base leading-6 text-text-muted">{props.address}</Text>
          <Pressable role="button" accessibilityLabel={'Cómo llegar a ' + props.name}
            onPress={() => { void Linking.openURL(destination); }}
            className="min-h-12 flex-row items-center justify-center rounded-soft border border-transparent bg-cta px-4">
            <Text className="text-base font-semibold text-on-cta">Cómo llegar · Abrir ruta</Text>
          </Pressable>
          <Text className="text-xs leading-5 text-text-muted">
            Se abrirá Google Maps para elegir transporte y confirmar la ruta.
          </Text>
        </View>
      </View>
    );
  },
});

const Response = defineComponent({
  name: 'PaCasaResponse',
  description: descriptions.PaCasaResponse,
  props: z.object({
    children: z.array(z.union([Paragraph.ref, Translation.ref, FieldReview.ref, Suggestion.ref, Directions.ref])).max(12),
  }),
  component: ({ props, renderNode }) => (
    <View className="w-full min-w-0 gap-4">{renderNode(props.children)}</View>
  ),
});

/** The matching backend model library is in modelLibrary.ts (shared Zod schemas). */
export const library = createLibrary({
  root: 'PaCasaResponse',
  components: [Response, Paragraph, Translation, FieldReview, Suggestion, Directions],
  componentGroups: [
    { name: 'Bilingual assistance', components: ['PaCasaText', 'TranslationPair'], notes: ['Explain English forms in plain Spanish.'] },
    { name: 'Real places and directions', components: ['DirectionsMap'], notes: ['Destination location must originate from verified places geocoding, never the model.'] },
    { name: 'User-controlled form review', components: ['FormFieldReview', 'FollowUpSuggestion'], notes: ['No action can submit, save or commit an answer.'] },
  ],
});
