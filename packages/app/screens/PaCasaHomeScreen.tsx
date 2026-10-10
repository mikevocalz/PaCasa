'use client';

import { useAssistantStore } from '../assistant/store';
import { MessageCircle, Mic, ScanLine, Heart } from '@acme/ui/icons';
import { Pressable, ScrollView, Text, View } from '@acme/ui/tw';

function BigAction({ title, description, onPress, icon: Icon }: {
  title: string;
  description: string;
  onPress: () => void;
  icon: typeof MessageCircle;
}) {
  return (
    <Pressable
      role="button"
      accessibilityLabel={title}
      onPress={onPress}
      className="min-h-40 min-w-0 flex-1 gap-3 border border-royal-400/70 bg-ink-900 p-5 shadow-card active:bg-ink-800 focus-visible:outline-2 focus-visible:outline-royal-300"
    >
      <Icon size={28} className="text-royal-300" />
      <Text className="font-display text-2xl text-silver-50">{title}</Text>
      <Text className="text-base leading-6 text-silver-300">{description}</Text>
    </Pressable>
  );
}

export function PaCasaHomeScreen() {
  const openAssistant = useAssistantStore((s) => s.openAssistant);
  return (
    <ScrollView
      className="flex-1 bg-ink-950"
      contentContainerClassName="mx-auto w-full max-w-4xl gap-8 px-4 py-8 md:px-8 md:py-12"
    >
      <View className="gap-4">
        <Text className="text-sm font-semibold uppercase tracking-widest text-royal-300">Pa&apos;Casa · Inicio</Text>
        <Text role="heading" aria-level={1} className="font-display text-4xl leading-tight text-silver-50 md:text-5xl">
          Tu voz. Tus respuestas. A tu ritmo.
        </Text>
        <Text className="max-w-2xl text-lg leading-8 text-silver-300">
          Habla en español, entiende lo que te preguntan y revisa tus respuestas antes de usarlas.
        </Text>
      </View>
      <View className="flex-row flex-wrap gap-3">
        <BigAction
          title="Pregúntale a Pa’Casa"
          description="Abre una conversación para entender una pregunta o un formulario."
          icon={MessageCircle}
          onPress={() => openAssistant('chat')}
        />
        <BigAction
          title="Hablar y traducir"
          description="Abre el modo Hablar para traducir frases entre médico y paciente."
          icon={Mic}
          onPress={() => openAssistant('talk')}
        />
      </View>
      <View className="gap-3 border-l-4 border-royal-400 bg-ink-900/80 p-5">
        <View className="flex-row items-center gap-3">
          <Heart size={22} className="text-royal-300" />
          <Text className="font-display text-xl text-silver-50">Tú tienes la última palabra</Text>
        </View>
        <Text className="text-base leading-7 text-silver-300">
          Nunca completaremos ni enviaremos un formulario por ti sin mostrarte qué dice y pedir tu confirmación.
          No se guardan conversaciones ni respuestas en esta versión.
        </Text>
        <View className="flex-row items-center gap-2">
          <ScanLine size={17} className="text-silver-400" />
          <Text className="text-sm text-silver-400">En el botón central puedes elegir Chat, Escanear o Hablar.</Text>
        </View>
      </View>
    </ScrollView>
  );
}
