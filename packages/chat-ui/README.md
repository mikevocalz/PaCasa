# @acme/chat-ui

A small, allowlisted OpenUI rendering layer for Pa'Casa's **Preguntar /
Traducir** assistant on web and Expo.

- `src/schemas.ts`: shared Zod v4 prop schemas, descriptions and pre-parser
  gate that rejects tool calls, mutations, URLs and state expressions.
- `src/modelLibrary.ts`: **Node-compatible** schema mirror with inert
  renderer callbacks; use for backend prompt/spec generation.
- `src/library.tsx`: actual universal React/React Native component renderers.
- `src/OpenUIMessage.tsx`: embed rich cards inside assistant messages.

Registered components: `PaCasaResponse` root, `PaCasaText`,
`TranslationPair`, `FormFieldReview`, `FollowUpSuggestion`.

**Review is not completion.** Field-review and follow-up buttons only fill
the message composer and require another explicit user action to send.
The model cannot execute arbitrary JS, URLs or backend tools. The OpenUI
renderer receives neither `toolProvider` nor mutation handlers.

## Generate a server contract

Use the CLI from the workspace after installing packages and verifying it
accepts the Node-compatible `modelLibrary.ts`. Inspect the serialized
component names, required props and root before pointing a backend at it.

```bash
npx @openuidev/cli@latest generate --spec \
  ./packages/chat-ui/src/modelLibrary.ts \
  --out ./packages/chat-ui/generated/library-spec.json
```

Generate a trusted system prompt via `@openuidev/lang-core` using that
spec. If using OpenUI Gateway, include `cloud: true`. If using a
self-hosted model, keep the prompt's library spec synchronized with the
client renderer. Never put untrusted form content into trusted system
instructions.

## Non-goals (this PR)

- No arbitrary generated JSX, HTML or code execution.
- No streaming backend introduced in this package; existing
  JSON text responses may optionally include `ui` as OpenUI Lang.
- No automatic field commits, form submission, file storage or database.
- No live transcription or speech playback; separate feature/PR.

See the parent PR for the endpoint, privacy, and navigation contracts.
