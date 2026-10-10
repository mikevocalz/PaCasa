'use client';

import { useEffect } from 'react';
import { create } from 'zustand';
import { Platform } from 'react-native';
import { RiveStage } from '@acme/spatial/rive';
import { riveFiles } from '@acme/assets/rive';
import { DocumentCamera } from '@acme/camera/document-scanner';
import { useAssistantStore } from '../assistant/store';
import { Pressable, Text, TextInput, View } from '@acme/ui/tw';

interface ScanState {
  phase: 'ready' | 'recognizing' | 'review';
  text: string;
  consent: boolean;
  error: string | null;
  source: string | null;
  setConsent: (value: boolean) => void;
  setPhase: (phase: ScanState['phase']) => void;
  onExtracted: (text: string, source: string) => void;
  onError: (error: string) => void;
  setText: (value: string) => void;
  reset: () => void;
}
const initial = { phase: 'ready' as const, text: '', consent: false, error: null, source: null };
export const useScanStore = create<ScanState>((set) => ({
  ...initial,
  setConsent: (consent) => set({ consent }),
  setPhase: (phase) => set({ phase, error: null }),
  onExtracted: (text, source) => set({ text: text.slice(0, 9000), source, phase: 'review', error: null }),
  onError: (error) => set({ error, phase: 'ready' }),
  setText: (text) => set({ text: text.slice(0, 9000) }),
  reset: () => set(initial),
}));

/** No image is kept; the only mutable document artifact is ephemeral, editable text. */
export function ScanWorkspace({ active }: { active: boolean }) {
  const scan = useScanStore();
  const assistant = useAssistantStore();
  useEffect(() => () => useScanStore.getState().reset(), []);

  const moveToChat = () => {
    if (!scan.text.trim()) return;
    assistant.setDraft('Ayúdame a entender este documento sin completar datos por mí:\n' + scan.text.trim().slice(0, 1800));
    assistant.setMode('chat');
  };
  return (
    <View className="gap-4">
      <View className="overflow-hidden rounded-2xl border border-ink-700 bg-ink-900 p-4">
        <Text role="heading" aria-level={2} className="font-display text-xl text-silver-50">
          Escanear documento
        </Text>
        <Text className="mt-2 text-sm leading-6 text-silver-300">
          {Platform.OS === 'web'
            ? 'En web, Google leerá la imagen solo tras tu autorización. No uses información real de pacientes durante esta demostración.'
            : 'La cámara y el modelo ExecuTorch leerán las palabras en tu dispositivo. Revisa el resultado antes de compartirlo.'}
        </Text>
      </View>
      <View className="relative overflow-hidden rounded-2xl border border-ink-700 bg-ink-950">
        <RiveStage source={riveFiles.signalStudio} artboard="SignalStudio"
          className="h-24 border-0" height={96} autoplay={scan.phase === 'recognizing'} />
        <Text className="py-2 text-center text-sm font-semibold text-royal-300">
          {scan.phase === 'recognizing' ? 'Leyendo y detectando texto…' :
            scan.phase === 'review' ? 'Revisar palabras detectadas' : 'Coloca el documento en el marco'}
        </Text>
      </View>
      {Platform.OS === 'web' ? (
        <Pressable role="checkbox" aria-checked={scan.consent}
          onPress={() => scan.setConsent(!scan.consent)}
          className="min-h-12 flex-row items-center gap-3 rounded-xl border border-ink-700 bg-ink-900 p-3">
          <View className={scan.consent ? 'h-6 w-6 border-2 border-royal-300 bg-royal-500' :
            'h-6 w-6 border-2 border-silver-400'} />
          <Text className="min-w-0 flex-1 text-sm text-silver-200">
            Autorizo enviar esta imagen al lector Google de prueba. No usaré datos reales de pacientes.
          </Text>
        </Pressable>
      ) : null}
      <DocumentCamera active={active && scan.phase !== 'review'} consent={scan.consent}
        onExtracted={scan.onExtracted}
        onError={scan.onError}
        onProgress={scan.setPhase} />
      {scan.error ? <Text role="alert" className="rounded-xl border border-danger p-3 text-sm text-danger">{scan.error}</Text> : null}
      {scan.phase === 'review' ? (
        <View className="gap-3 rounded-2xl border border-royal-400/40 bg-ink-900 p-4">
          <Text role="heading" aria-level={3} className="font-display text-lg text-silver-50">
            Revisa el texto antes de usarlo
          </Text>
          <Text className="text-sm text-silver-300">
            Fuente: {scan.source === 'on-device' ? 'Modelo local ExecuTorch' : 'Google Gemini Vision, prueba'}
          </Text>
          <TextInput multiline value={scan.text} onChangeText={scan.setText}
            maxLength={9000} aria-label="Editar texto reconocido"
            className="min-h-36 rounded-xl border border-ink-500 bg-ink-950 p-3 text-base text-silver-50" />
          <Pressable role="button" accessibilityLabel="Llevar texto revisado al chat para confirmar su envío"
            onPress={moveToChat}
            className="min-h-14 items-center justify-center rounded-xl bg-royal-500 px-4">
            <Text className="font-semibold text-silver-50">Llevar texto al Chat</Text>
          </Pressable>
          <Pressable role="button" onPress={scan.reset} className="min-h-12 items-center justify-center border border-ink-500">
            <Text className="font-semibold text-silver-300">Volver a escanear</Text>
          </Pressable>
        </View>
      ) : null}
      <Text className="text-sm leading-6 text-silver-400">
        Pa’Casa nunca rellena ni envía el formulario automáticamente. Si compartes texto con la IA, tendrás que confirmar en Chat.
      </Text>
    </View>
  );
}
