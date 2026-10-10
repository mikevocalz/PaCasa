'use client';

import { useRef } from 'react';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Pressable, Text, View } from '@acme/ui/tw';
import type { DocumentCameraProps } from './types';

const ENDPOINT = process.env.NEXT_PUBLIC_PACASA_ASSISTANT_URL;
const DEMO_URL = ENDPOINT?.replace(/\/assistant\/?$/, '/assistant/document');

/** Browser camera path. Web never imports ExecuTorch's native runtime. */
export function BrowserDocumentCamera({ active, consent, onExtracted, onError, onProgress }: DocumentCameraProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const camera = useRef<CameraView>(null);
  const busy = useRef(false);
  const capture = async () => {
    if (busy.current || !active || !consent || !DEMO_URL) return;
    busy.current = true;
    onProgress('recognizing');
    try {
      const photo = await camera.current?.takePictureAsync({ quality: 0.7, base64: true });
      const imageBase64 = photo?.base64 ?? '';
      if (!imageBase64 || imageBase64.length > 2_200_000) throw new Error('Foto demasiado grande. Acércate y vuelve a intentar.');
      const response = await fetch(DEMO_URL, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64, mimeType: 'image/jpeg', consent: true }),
      });
      if (!response.ok) throw new Error('No se pudo leer el documento mediante el servicio de prueba.');
      const data: unknown = await response.json();
      if (!data || typeof data !== 'object' || !('text' in data) ||
          typeof data.text !== 'string' || data.text.length > 9000) {
        throw new Error('El servicio no devolvió texto válido.');
      }
      onExtracted(data.text, 'gemini-vision-demo');
    } catch (error) { onError(error instanceof Error ? error.message : 'No se pudo escanear.'); }
    finally { busy.current = false; }
  };
  if (!permission?.granted) return (
    <View className="gap-3 rounded-xl border border-ink-600 p-4">
      <Text className="text-silver-300">Autoriza la cámara para usar el escáner web.</Text>
      <Pressable role="button" onPress={() => { void requestPermission(); }}
        className="min-h-12 items-center justify-center rounded-xl bg-royal-500">
        <Text className="font-semibold text-silver-50">Activar cámara web</Text>
      </Pressable>
    </View>
  );
  return (
    <View className="gap-3">
      <View className="overflow-hidden rounded-2xl border-2 border-royal-400">
        <CameraView ref={camera} active={active} facing="back" style={{ width: '100%', height: 280 }} />
      </View>
      {!DEMO_URL ? <Text role="status" className="text-sm text-silver-300">
        Configura el endpoint seguro de documentos en la web.
      </Text> : null}
      <Pressable role="button" disabled={!active || !consent || !DEMO_URL || busy.current}
        accessibilityLabel="Capturar para reconocimiento de texto web con autorización"
        onPress={() => { void capture(); }}
        className="min-h-14 items-center justify-center rounded-xl bg-royal-500 px-4 disabled:opacity-40">
        <Text className="font-semibold text-silver-50">Capturar · Leer con Google</Text>
      </Pressable>
    </View>
  );
}
