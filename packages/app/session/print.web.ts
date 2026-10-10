/**
 * Turning the completed form into a document you can keep. On web the browser's
 * own print pipeline writes the PDF ("Guardar como PDF"), which is a real file
 * — no viewer chrome and no invented generator.
 */
export const canPrint = (): boolean => typeof window !== 'undefined';

export function printDocument(): void {
  if (canPrint()) window.print();
}