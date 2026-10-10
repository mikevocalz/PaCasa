/**
 * Pa'Casa assistant: application-owned, ephemeral request contract.
 * No model-generated components, remote URLs, or untrusted tools cross this boundary.
 */
export type AssistantMode = 'chat' | 'translate';
export type AssistantLanguage = 'es' | 'en';
export type AssistantRole = 'user' | 'assistant';
export interface AssistantMessage {
  readonly id: number;
  readonly mode: AssistantMode;
  readonly role: AssistantRole;
  readonly text: string;
}
export interface AssistantRequest {
  readonly mode: AssistantMode;
  readonly text: string;
  readonly sourceLanguage: AssistantLanguage;
  readonly targetLanguage: AssistantLanguage;
  readonly history: readonly { role: AssistantRole; text: string }[];
}
export const MAX_MESSAGE_CHARS = 2000;
export const MAX_HISTORY = 6;
export const PRODUCT_PATHS = ['/', '/mi-plan', '/citas', '/apoyo'] as const;

export function makeAssistantRequest(input: {
  mode: AssistantMode;
  draft: string;
  sourceLanguage: AssistantLanguage;
  messages: readonly AssistantMessage[];
}): AssistantRequest | null {
  const text = input.draft.trim();
  if (!text || text.length > MAX_MESSAGE_CHARS) return null;
  const history = input.mode === 'chat'
    ? input.messages
        .filter((m) => m.mode === 'chat' && m.text.length <= MAX_MESSAGE_CHARS)
        .slice(-MAX_HISTORY)
        .map(({ role, text: value }) => ({ role, text: value }))
    : [];
  return {
    mode: input.mode,
    text,
    sourceLanguage: input.sourceLanguage,
    targetLanguage: input.sourceLanguage === 'es' ? 'en' : 'es',
    history,
  };
}

export function assistantReplyFromResponse(value: unknown): string | null {
  if (!value || typeof value !== 'object') return null;
  const reply = (value as { reply?: unknown }).reply;
  return typeof reply === 'string' && reply.trim().length > 0 && reply.length <= 10000
    ? reply.trim()
    : null;
}
