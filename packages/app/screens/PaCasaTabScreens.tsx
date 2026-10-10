'use client';

import { useAssistantStore } from '../assistant/store';
import { Pressable, ScrollView, Text, View } from '@acme/ui/tw';

interface TabContents {
  title: string;
  intro: string;
  emptyTitle: string;
  emptyText: string;
  action: string;
  mode: 'chat' | 'translate';
}

function ProductTab({ details }: { details: TabContents }) {
  const openAssistant = useAssistantStore((s) => s.openAssistant);
  return (
    <ScrollView className="flex-1 bg-ink-950" contentContainerClassName="mx-auto w-full max-w-4xl gap-7 px-4 py-8 md:px-8 md:py-12">
      <View className="gap-3">
        <Text className="text-sm font-semibold uppercase tracking-widest text-royal-300">Pa&apos;Casa</Text>
        <Text role="heading" aria-level={1} className="font-display text-4xl text-silver-50">{details.title}</Text>
        <Text className="max-w-2xl text-lg leading-8 text-silver-300">{details.intro}</Text>
      </View>
      <View className="gap-4 border border-ink-700 bg-ink-900 p-6">
        <Text className="font-display text-2xl text-silver-50">{details.emptyTitle}</Text>
        <Text className="max-w-xl text-base leading-7 text-silver-300">{details.emptyText}</Text>
        <Pressable
          role="button" accessibilityLabel={details.action}
          onPress={() => openAssistant(details.mode)}
          className="min-h-12 self-start justify-center border border-royal-400 bg-royal-500 px-5 active:bg-royal-600"
        >
          <Text className="text-base font-semibold text-silver-50">{details.action}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

export const MiPlanScreen = () => <ProductTab details={{
  title: 'Mi Plan',
  intro: 'Revisa lo que necesitas completar, paso a paso y sin prisa.',
  emptyTitle: 'Todavía no hay un plan',
  emptyText: 'Esta versión no almacena formularios ni planes. Pa’Casa puede ayudarte a entender una pregunta; tú confirmas cada respuesta.',
  action: 'Pedir ayuda', mode: 'chat',
}} />;

export const CitasScreen = () => <ProductTab details={{
  title: 'Citas',
  intro: 'Un lugar para prepararte para una cita y entender las preguntas que te hagan.',
  emptyTitle: 'No hay citas guardadas',
  emptyText: 'No hay calendario conectado y no se han guardado citas. Pide a Pa’Casa que te ayude a entender instrucciones.',
  action: 'Consultar a Pa’Casa', mode: 'chat',
}} />;

export const ApoyoScreen = () => <ProductTab details={{
  title: 'Apoyo',
  intro: 'Un poco de ayuda, cuando la necesites.',
  emptyTitle: 'Puedes pedir que te lo expliquen de otra manera',
  emptyText: 'Escribe una frase, usa el micrófono del teclado o graba una nota en la app móvil. El asistente no sustituye a un profesional de salud ni envía formularios.',
  action: 'Abrir traducción', mode: 'translate',
}} />;
