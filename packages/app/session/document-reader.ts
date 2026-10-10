import { Platform } from 'react-native';
import type { PickedDocument } from './document-picker';

/**
 * Consent-gated document reading through the standalone assistant service.
 * The browser sends the picked file's bytes; the service returns only the
 * text Gemini could see, and the caller decides whether the document joins
 * the session read or unread. Nothing is stored server-side.
 */

const ENDPOINT = Platform.OS === 'web'
  ? process.env.NEXT_PUBLIC_PACASA_ASSISTANT_URL
  : process.env.EXPO_PUBLIC_PACASA_ASSISTANT_URL;

export const documentReaderUrl = ENDPOINT
  ? ENDPOINT.replace(/\/assistant\/?$/, '/assistant/document')
  : null;

export const canReadDocument = (picked: PickedDocument | null): boolean =>
  Boolean(documentReaderUrl && picked?.dataBase64 && picked.mimeType);

export async function readPickedDocument(picked: PickedDocument): Promise<string> {
  if (!documentReaderUrl || !picked.dataBase64 || !picked.mimeType) {
    throw new Error('El lector de documentos no está disponible en esta versión.');
  }
  const response = await fetch(documentReaderUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      imageBase64: picked.dataBase64,
      mimeType: picked.mimeType,
      consent: true,
    }),
  });
  if (!response.ok) throw new Error('No se pudo leer el documento con el servicio de prueba.');
  const data: unknown = await response.json();
  if (!data || typeof data !== 'object' || !('text' in data) || typeof data.text !== 'string') {
    throw new Error('El servicio no devolvió texto válido.');
  }
  return data.text.slice(0, 9000);
}
