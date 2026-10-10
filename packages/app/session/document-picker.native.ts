import type { PatientDocument } from './patient';

/**
 * This build ships no document picker or import pipeline on native — no file
 * browser, no camera capture, no OCR. The screens report that honestly rather
 * than pretending the Camera Lab is patient document capture (ADR 0002).
 */

export interface PickedDocument {
  name: string;
  kind: PatientDocument['kind'];
}

export const canPickDocument = (): boolean => false;

/** No picker on this platform: always resolves null. */
export function pickDocument(): Promise<PickedDocument | null> {
  return Promise.resolve(null);
}
