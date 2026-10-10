# Pa'Casa independent text assistant API

A small, stateless development service supplying **real** Gemini-generated
English/Spanish translations and Spanish-first form-question explanations.
It intentionally uses only Node.js built-ins (Node 22+).

It returns both ordinary text and deterministic, allowlisted OpenUI Lang:
`{ "reply": "...", "ui": "root = PaCasaResponse(...)" }`.
The service creates the OpenUI program itself from validated model text;
model output cannot choose arbitrary component names or embed executable
actions. The client can render these cards through `@acme/chat-ui`.

**Not a PHI-ready production service.** Do not submit real patient data until
identity/authentication, formal privacy/security review, monitoring/redaction,
provider/data agreements, abuse controls, consent, and deployment architecture
have been approved. CORS alone is not authentication.

## Local development

```sh
# `dev` loads the repo-root .env.local; GOOGLE_GEMINI is accepted as an
# alias for GEMINI_API_KEY (the moyo env name).
export GEMINI_API_KEY=... # server environment only; never in git or Expo
export GEMINI_MODEL=gemini-3.8-flash
export PACASA_ALLOWED_ORIGINS=http://localhost:3000
pnpm --filter assistant-api test
pnpm --filter assistant-api dev
```

App configuration (point at a trusted HTTPS host or localhost for dev):
```env
NEXT_PUBLIC_PACASA_ASSISTANT_URL=http://localhost:8787/assistant
EXPO_PUBLIC_PACASA_ASSISTANT_URL=https://your-assistant-api-host/assistant
```

For Base44 **static export** the endpoint MUST be hosted separately over
HTTPS with the deployed web origin allowlisted. `apps/web/app/api/**` won't
run when `BASE44_EXPORT=1`.

## Endpoint

`POST /assistant`, JSON:

```json
{ "mode": "translate", "text": "Date of birth?",
  "sourceLanguage": "en", "targetLanguage": "es", "history": [] }
```

Returns `{ "reply": "...", "ui": "..." }`. Chat history contains at
most six validated text-only turns. Translation drops all history.

`POST /assistant/stream` — same body for `mode: "chat"`, replies as SSE
(`delta` events then one `done` with optional OpenUI/directions payloads).

`POST /assistant/document` — `{ "mimeType", "data" (base64), "consent": true }`,
PDF/JPEG/PNG; returns `{ "text", "engine" }`. Demo OCR only, gated by
`PACASA_ENABLE_DEMO_DOC_OCR=1`; never for production PHI.

`POST /assistant/speak` — `{ "text" (≤1200 chars), "consent": true }`, streams
back `audio/mpeg` synthesized by ElevenLabs (`eleven_multilingual_v2`, ES/EN)
when `ELEVENLABS_API_KEY` and `ELEVENLABS_VOICE_ID` are set; otherwise 503 and
clients fall back to device text-to-speech.

`GET /assistant/map?lat&lng&label` — proxied static pin map (Google key first,
then the public Mapbox token); used by the directions card so image URLs
never carry coordinates through third-party page loads.

Limits: 16 KiB body, 2000 characters per turn, in-memory 20 requests /
5 minutes per socket IP, 15 second upstream timeout. No file/voice/photo
retention. No logs of user messages or model replies, no persistent storage.
Check `GET /healthz` for liveness/configuration without disclosing secrets.

## Model

`gemini-3.8-flash` is the 2026-10-10 documented stable model. See:
https://ai.google.dev/gemini-api/docs/generate-content/latest-model

Runs Gemini's `models.generateContent` with JSON response schema.
For diagnosis or specific treatment, the assistant must defer to qualified
professionals. It does not submit forms, store confirmed fields, or have a
calendar/insurance connection.

## Production blockers

- Authenticated and authorized caller identity/rate limiting through a
  trusted edge proxy, including server-issued identity for mobile requests
- HIPAA/applicable privacy obligations and vendor agreements where required
- Real audio transcription pipeline, user-controlled upload/consent
- Form OCR, parsed field schemas, explicit confirmations, PDF generation
- Encrypted operational monitoring with no sensitive payload logging
- Health/safety/red-team tests across English/Spanish dialects
- Deploy and verify real DNS, HTTPS, CORS, auth and device/browser flows
