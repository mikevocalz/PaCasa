'use client';

import { useRef } from 'react';
import { Camera, useCameraDevice, useCameraPermission, usePhotoOutput } from 'react-native-vision-camera';
import { models, useOpticalCharacterRecognizer } from 'react-native-executorch';
import { Pressable, Text, View } from '@acme/ui/tw';
import { toOcrImageBuffer } from './normalize';
import type { DocumentCameraProps } from './types';

export function DocumentCamera({ active, onExtracted, onError, onProgress }: DocumentCameraProps) {
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back');
  const photos = usePhotoOutput({ qualityPrioritization: 'balanced' });
  const ocr = useOpticalCharacterRecognizer(models.ocr.PADDLE.PPOCRV6_SMALL.DEFAULT);
  const capturing = useRef(false);
  const capture = async () => {
    if (capturing.current || !ocr.isReady || !ocr.recognizeCharacters) return;
    capturing.current = true;
    onProgress('recognizing');
    try {
      const photo = await photos.capturePhoto({ flashMode: 'auto' }, {});
      const image = await photo.toImageAsync();
      const maxWidth = 1600;
      const scaled = image.width > maxWidth
        ? await image.resizeAsync(maxWidth, Math.round(image.height * maxWidth / image.width))
        : image;
      const pixels = await scaled.toRawPixelDataAsync(false);
      const input = toOcrImageBuffer(pixels);
      const lines = await ocr.recognizeCharacters(input, { confidenceThreshold: 0.48 });
      const text = lines.map((line) => line.text).filter(Boolean).join('\n').slice(0, 9000);
      if (!text.trim()) throw new Error('No se encontró texto legible. Intenta mejorar la luz.');
      onExtracted(text, 'on-device');
    } catch (error) {
      onError(error instanceof Error ? error.message : 'No se pudo leer la imagen.');
    } finally { capturing.current = false; }
  };
  if (!hasPermission) {
    return (
      <View className="gap-3 rounded-xl border border-ink-600 p-4">
        <Text className="text-base text-silver-300">Autoriza la cámara para leer el documento localmente.</Text>
        <Pressable role="button" accessibilityLabel="Autorizar cámara" onPress={() => { void requestPermission(); }}
          className="min-h-12 items-center justify-center rounded-xl bg-royal-500 px-4">
          <Text className="font-semibold text-silver-50">Activar cámara</Text>
        </Pressable>
      </View>
    );
  }
  if (!device) return <Text role="alert" className="text-silver-300">No se encontró cámara trasera.</Text>;
  return (
    <View className="gap-3">
      <View className="overflow-hidden rounded-2xl border-2 border-royal-400">
        <Camera device={device} isActive={active} outputs={[photos]}
          style={{ width: '100%', height: 280 }} enableNativeTapToFocusGesture />
      </View>
      <Text className="text-sm text-silver-300">
        OCR en tu dispositivo · {ocr.isReady ? 'Modelo listo' :
          ocr.error ? 'Modelo no disponible' : 'Preparando modelo: ' + Math.round(ocr.downloadProgress) + '%'}
      </Text>
      {ocr.error ? <Text role="alert" className="text-sm text-danger">{ocr.error.message}</Text> : null}
      <Pressable role="button" accessibilityLabel="Capturar y reconocer documento sin subir la imagen"
        disabled={!active || !ocr.isReady || capturing.current} onPress={() => { void capture(); }}
        className="min-h-14 items-center justify-center rounded-xl bg-royal-500 px-4 disabled:opacity-40">
        <Text className="font-semibold text-silver-50">Capturar · Leer en dispositivo</Text>
      </Pressable>
    </View>
  );
}
