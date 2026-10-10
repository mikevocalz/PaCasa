/** Three mutually exclusive full-screen stages. Not three new bottom tabs. */
export type AssistantSurfaceMode = 'chat' | 'scan' | 'talk';

export const ASSISTANT_STAGES = [
  { mode: 'chat', label: 'Chat', hint: 'Preguntar a Pa’Casa' },
  { mode: 'scan', label: 'Escanear', hint: 'Documentos y formularios' },
  { mode: 'talk', label: 'Hablar', hint: 'Conversación bilingüe' },
] as const satisfies readonly {
  mode: AssistantSurfaceMode;
  label: string;
  hint: string;
}[];

export function isAssistantSurfaceMode(value: unknown): value is AssistantSurfaceMode {
  return value === 'chat' || value === 'scan' || value === 'talk';
}
