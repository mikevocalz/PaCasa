import type { PatientDocument } from './patient';

/**
 * Choosing a source document for the visit. On web the honest answer is the
 * platform's own file input: the patient picks a PDF or a photo. When the
 * file is small enough for the consent-gated reader, its bytes travel with
 * the pick so Documentos can offer a real read; oversized or unreadable
 * files still join the session unread and the screens say so.
 */

const ACCEPT = 'application/pdf,image/jpeg,image/png';
const MIME = new Set(['application/pdf', 'image/jpeg', 'image/png']);
/** Matches apps/assistant-api MAX_IMAGE_BASE64. */
const MAX_BASE64 = 2_200_000;

export interface PickedDocument {
  name: string;
  kind: PatientDocument['kind'];
  /** Sent to the consent-gated reader when present; absent = unread here. */
  mimeType?: string;
  dataBase64?: string;
}

/** True where a real file input can be mounted. */
export const canPickDocument = (): boolean => typeof document !== 'undefined';

const readBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('read-failed'));
    reader.onload = () => {
      const value = typeof reader.result === 'string' ? reader.result : '';
      resolve(value.slice(value.indexOf(',') + 1));
    };
    reader.readAsDataURL(file);
  });

/**
 * Open the system file picker for one PDF or image. Resolves with the file's
 * name, kind and — when it fits the reader's limit — its bytes as base64, or
 * null when the patient cancels or there is no DOM.
 */
export function pickDocument(): Promise<PickedDocument | null> {
  if (!canPickDocument()) return Promise.resolve(null);
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = ACCEPT;
    input.style.display = 'none';
    document.body.appendChild(input);
    input.addEventListener('change', () => {
      const file = input.files?.[0] ?? null;
      input.remove();
      if (!file) return resolve(null);
      const base: PickedDocument = {
        name: file.name || 'Documento',
        kind: file.type === 'application/pdf' ? 'pdf' : 'imagen',
      };
      if (!MIME.has(file.type)) return resolve(base);
      void readBase64(file)
        .then((dataBase64) => resolve(
          dataBase64.length <= MAX_BASE64 ? { ...base, mimeType: file.type, dataBase64 } : base,
        ))
        .catch(() => resolve(base));
    });
    input.click();
  });
}
