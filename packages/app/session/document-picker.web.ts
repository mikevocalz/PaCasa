import type { PatientDocument } from './patient';

/**
 * Choosing a source document for the visit. On web the honest answer is the
 * platform's own file input: the patient picks a PDF or a photo and Pa'Casa
 * records its name and kind. This build has no parser and no OCR, so the file
 * joins the session unread — the Documentos screen says so instead of
 * inventing pages (LOCKED ARCHITECTURE, "Documentos").
 */

export interface PickedDocument {
  name: string;
  kind: PatientDocument['kind'];
}

/** True where a real file input can be mounted. */
export const canPickDocument = (): boolean => typeof document !== 'undefined';

const ACCEPT = 'application/pdf,image/jpeg,image/png';

/**
 * Open the system file picker for one PDF or image. Resolves with the file's
 * name and kind, or null when the patient cancels or there is no DOM.
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
      resolve(
        file
          ? { name: file.name || 'Documento', kind: file.type === 'application/pdf' ? 'pdf' : 'imagen' }
          : null,
      );
    });
    input.click();
  });
}
