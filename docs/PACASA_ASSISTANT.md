# Pa'Casa assistant: product entry and backend contract

## Navigation

The raised center action on phones and the right hardware rail on foldables/tablets
opens a **root-level full-screen assistant**, outside the tab stack. The four product
destinations are `Inicio`, `Mi Plan`, `Citas`, `Apoyo`.
Web users also see the center action at phone widths and a header action when wide.
Closing returns to the previous route. The original spatial demo routes remain
available at `/lab`, `/native`, `/hybrid`, `/game`, `/immersive`.

Modes: **Preguntar** (Spanish-first question/answer) and **Traducir**
(English ↔ Spanish). The camera / Camera Lab is now reached through
`Escanear formulario` **inside the assistant** on native; it is no longer the
global central action.

## Privacy and service state

The initial PR installs a functional UI and a strict typed text request boundary,
but **no model endpoint is bundled**. An unavailable endpoint explicitly disables
sending rather than displaying fake AI output. The app never persists chats or
form responses. Changing modes preserves messages only in the active session;
closing clears messages and consent.

Set `NEXT_PUBLIC_PACASA_ASSISTANT_URL` for the exported web client and
`EXPO_PUBLIC_PACASA_ASSISTANT_URL` for Expo native. Both must point at a
separately hosted HTTPS backend (a local HTTP URL is allowed only for
localhost/127.0.0.1 development). **Neither variable is a secret.** Never
expose LLM API keys to a mobile/web bundle. Base44 hosts the static Next export,
so `/api/assistant` on that same origin is **not** implicitly available.

Request: `POST` JSON:
```json
{
  "mode": "translate",
  "text": "What is your date of birth?",
  "sourceLanguage": "en",
  "targetLanguage": "es",
  "history": []
}
```

Chat may send the last six **chat-only**, in-memory
`{ "role": "user" | "assistant", "text": "..." }` messages. Translation
never sends conversation history. Text is limited to 2,000 characters;
responses must be JSON `{ "reply": "..." }` (up to 10,000 characters).
No account, file submission, logging, or automatic form filling is added.

The user must explicitly opt in to sending text before the button becomes active.
Do not log sensitive text, persist it, or generate document answers without
user confirmation.

## Voice / form workflow

Native uses the **existing** `@acme/ui` VoiceRecorder with actual microphone
permissions, playback and local review. A recording is **not transcribed or
uploaded** by this PR. The UI explicitly says so, rather than pretending audio
was recognized. Only ask for microphone permission after the person taps record.

Use the existing Camera Lab from within the assistant, with its separate camera
permission. Camera Lab currently detects keyboards; it does **not** parse an
English healthcare form. A future implementation must distinguish camera
preview, document OCR, live Gemini interview, per-field confirmation, and PDF
export, rather than claiming those stages exist now.

## Subsequent implementation

The backend needs authenticated/authorized, privacy-reviewed speech-to-text
and text generation / translation, with appropriate user confirmation flows.
For user-supplied English forms:
form schema → Spanish question → answer → user confirmation → English form
field, with review/PDF as explicit actions. No third-party submission in MVP.
OpenUI component generation is a separate PR; it must not own the authorized
actions, microphone, navigation or document data.

## OpenUI rich response mode (stacked PR)

A text response may additionally carry `ui`: the OpenUI Lang program for
our **restricted** `@acme/chat-ui` registry. It is parsed and rendered only
inside an assistant message. The backend must generate from
`packages/chat-ui/src/modelLibrary.ts`; the client renders with the same
Zod prop schemas.

Example (not a real translation):
```text
root = PaCasaResponse([p, tr])
p = PaCasaText("La siguiente pregunta dice:")
tr = TranslationPair("First name", "Nombre", "en", "es")
```

The browser and native renderer are given **no toolProvider** and all built-in
action/URL expressions are rejected before rendering. Review cards only
**pre-fill** a new chat message: nothing is auto-confirmed, saved, or sent.
The product can continue displaying ordinary `reply` text when `ui` is
absent or invalid.

This is a progressive enhancement over the text contract, not a claim that
live OpenUI generation is configured. A real hosted assistant service must be
deployed and configured before live bilingual answers can be generated.

## Gemini assistant API (third stacked PR)

`apps/assistant-api` supplies a separate, stateless text endpoint. It calls
Google Gemini through server-side `GEMINI_API_KEY` and builds allowed OpenUI
Lang components **deterministically** from validated `{reply}` model output.
Unlike arbitrary model-generated OpenUI code, this service controls both
component selection and parameters. The model can translate and explain,
but cannot run tools or submit documents.

Run `pnpm --filter assistant-api test` and
`pnpm --filter assistant-api dev`. On Base44 static web, deploy the
service separately over HTTPS and configure its URL; it is not live just
because the PR contains a server implementation. See
[service README](../apps/assistant-api/README.md).

This service is for the no-real-patient-data prototype. Add real authentication,
an appropriate healthcare privacy/security assessment, provider agreements,
abuse protection, and a release review before any PHI processing. Neither
CORS nor in-memory rate limiting is an acceptable replacement for auth.
