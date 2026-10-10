/** ElevenLabs text-to-speech proxy: keys stay server-side; only audio leaves. */

export const SPEAK_MAX_CHARS = 1200;
const SPEAK_MODEL = 'eleven_multilingual_v2';
const OUTPUT_FORMAT = 'mp3_44100_128';

export function parseSpeakRequest(body) {
  if (!body || typeof body !== 'object' || body.consent !== true) return null;
  const text = typeof body.text === 'string' ? body.text.trim() : '';
  if (!text || text.length > SPEAK_MAX_CHARS) return null;
  return { text };
}

/**
 * Returns the upstream ElevenLabs response so the caller can stream the
 * audio body straight through. Throws when the voice service is unavailable.
 */
export async function speakWithElevenLabs(text, apiKey, voiceId, fetchImpl = fetch) {
  const response = await fetchImpl(
    `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=${OUTPUT_FORMAT}`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify({ text, model_id: SPEAK_MODEL }),
      signal: AbortSignal.timeout(20_000),
    },
  );
  if (!response.ok || !response.body) throw new Error('voice-unavailable');
  return response;
}
