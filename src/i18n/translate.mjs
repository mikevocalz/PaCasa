import { translatePhrase } from '../session/domain.js';
import { normalizeLanguage } from './locale.mjs';

const MAX_LENGTH = 2000;
/**
 * Translate a single, explicitly submitted message. Never pass off the
 * original as a translation, even if the configured service is unavailable.
 *
 * The optional URL MUST be a trusted authenticated server endpoint. Never
 * place third-party translator keys or PHI in a browser environment variable.
 */
export async function translateForRecipient({
  text, sourceLanguage, targetLanguage, endpoint, fetcher = globalThis.fetch, signal,
}) {
  const original = typeof text === 'string' ? text.trim() : '';
  if (!original) return { status: 'empty', text: '' };
  if (original.length > MAX_LENGTH) throw new Error('Message exceeds translation limit');

  const source = normalizeLanguage(sourceLanguage);
  const target = normalizeLanguage(targetLanguage);
  if (source === target) return { status: 'identity', text: original };

  const offline = translatePhrase(original, source === 'en' ? 'en-es' : 'es-en');
  if (offline.matched) return { status: 'translated', text: offline.text, method: 'phrasebook' };
  if (!endpoint) return { status: 'unavailable', text: '' };

  // Reject accidental non-HTTPS deployments; localhost is for development only.
  const base = typeof location === 'undefined' ? 'https://pacasa.invalid' : location.origin;
  const url = new URL(endpoint, base);
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname))) {
    throw new Error('Translation endpoint must use HTTPS');
  }
  const response = await fetcher(url.toString(), {
    method: 'POST',
    credentials: 'include',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ text: original, sourceLanguage: source, targetLanguage: target }),
    signal,
  });
  if (!response.ok) throw new Error('Translation endpoint failed');
  const body = await response.json();
  if (!body || typeof body.translation !== 'string' || !body.translation.trim()) {
    throw new Error('Translation endpoint returned no translation');
  }
  return { status: 'translated', text: body.translation.trim(), method: 'service' };
}
