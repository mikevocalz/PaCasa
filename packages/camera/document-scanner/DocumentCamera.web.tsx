'use client';

import { useEffect, useState } from 'react';
import { Text, View } from '@acme/ui/tw';
import type { DocumentCameraProps } from './types';

/**
 * Next.js prerenders Client Components on the server. Import expo-camera only
 * after hydration so native view-manager initialization cannot run in Node.
 * The actual camera still uses Expo Camera's web CameraView.
 */
export function DocumentCamera(props: DocumentCameraProps) {
  const [BrowserCamera, setBrowserCamera] =
    useState<null | typeof import('./DocumentCameraBrowser.web')['BrowserDocumentCamera']>(null);

  useEffect(() => {
    let cancelled = false;
    void import('./DocumentCameraBrowser.web').then((module) => {
      if (!cancelled) setBrowserCamera(() => module.BrowserDocumentCamera);
    }).catch(() => {
      // Fail closed: do not request camera access or upload images on module failure.
    });
    return () => { cancelled = true; };
  }, []);

  if (!BrowserCamera) {
    return (
      <View role="status" className="rounded-soft border border-border p-4">
        <Text className="text-sm text-text-muted">
          Preparando la cámara del navegador. No se ha capturado ni enviado ninguna imagen.
        </Text>
      </View>
    );
  }
  return <BrowserCamera {...props} />;
}
