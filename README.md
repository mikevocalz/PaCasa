<div align="center">

# Pa'Casa

**Tu voz. Tus respuestas. A tu ritmo.**

Spanish-first questions, translation, and careful form assistance,
built for older adults who would rather speak than navigate an English form.

[Product & assistant contract](docs/PACASA_ASSISTANT.md) ·
[Architecture](docs/ARCHITECTURE.md) ·
[Platform matrix](docs/PLATFORMS.md) ·
[Original spatial lab](#spatial-lab)

</div>

## Product navigation

| Surface | Where | Purpose |
| --- | --- | --- |
| Inicio | `/` | Start a conversation or translation |
| Mi Plan | `/mi-plan` | Prepare a step-by-step plan without claiming data was saved |
| Citas | `/citas` | Prepare for an appointment (no calendar connection yet) |
| Apoyo | `/apoyo` | Help, limitations, accessible language |
| **Pa'Casa** raised center button | Root-level overlay, **not a tab** | **Preguntar** (Chat) and **Traducir** (English ↔ Spanish) |

The center action is visible in the phone dock (native and narrow web), in
the physical-right rail on tablets/foldables/headsets, and in the desktop
web header. Closing the full-screen assistant returns to the prior tab.

The former center **Scan** button is no longer part of global navigation.
The existing Camera Lab is accessible from inside the native assistant,
explicitly labelled as a preview: **it does not yet read forms.**

The assistant currently supports a text request/response contract and local
voice-note recording/review on native. It does **not** invent translation
results, automatically transcribe recordings, fill an English PDF or submit
documents. The text service requires a separately hosted backend URL and
informed user opt-in. Conversations are ephemeral and cleared on close.
See [the implementation contract](docs/PACASA_ASSISTANT.md) before enabling
live services.

## Goal and non-goals

Future healthcare form flow:

```text
English form/PDF → extracted fields → Spanish-first voice or typed interview
→ field-by-field review and confirmation → populated English form → review/PDF
```

The user must confirm every answer. No external form submission, account
creation, or persistence of personal answers is in scope for this initial MVP.
Healthcare information deserves extra privacy and security review before
any production processing.

## Platform and architecture

This repository retains the existing Expo SDK 58 / Next.js 16 universal
monorepo, Solito routing, Uniwind/Tailwind 4, Zustand application state,
Kinetrell motion, Rive and Viro/Eskiu capabilities.

```text
apps/mobile         Expo (native phones, tablets, foldables, headset flavors)
apps/web            Next.js, Base44 static export
apps/storybook      UI component stories
packages/app        Product screens, global shell, ephemeral assistant
packages/ui         Cross-platform semantic components and VoiceRecorder
packages/theme      Shared tokens
packages/camera     Native Camera Lab (existing detector, not form OCR)
packages/spatial    Native/XR-capability infrastructure
```

Respect `AGENTS.md`: use Zustand rather than React `useState`;
only ordinary native phones get bottom tabs, with physical-right rails on
foldables/tablets/headsets. Web has no rail; it has a header and compact
bottom navigation. Keep the Quest window and existing native plugin
contracts intact.

## Build

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm --filter web dev
pnpm --filter mobile dev
pnpm --filter storybook dev
pnpm verify:routes
pnpm typecheck
pnpm test
```

Native microphone recording requires a development build; Expo Go alone
cannot validate the full native dependency graph. For voice recording,
microphone permission is requested only on the user's Record action.
Camera permission is separate.

### AI endpoint

```env
NEXT_PUBLIC_PACASA_ASSISTANT_URL=https://your-secure-api.example/assistant
EXPO_PUBLIC_PACASA_ASSISTANT_URL=https://your-secure-api.example/assistant
```

These are **public endpoint URLs**, not secrets. Set actual values only
in private environment configuration; the values above are illustrative.
A secure service must be deployed separately: Base44's static Next export
does not host Next API routes. The UI disables sending and displays an
honest message when the service is absent.

Never put Gemini, OpenUI Gateway or other model API keys in public env vars.

## Base44

[Live deployment](https://pacasa-83490010.base44.app) ·
[Project dashboard](https://app.base44.com/apps/6aca5ff33ab16f3383490010/editor/workspace/overview)

The repo is the source of truth. Base44 hosts the exported **web** build;
Expo produces independent native builds.

```bash
pnpm base44:setup
npm exec --prefix tooling/base44-cli -- base44 login
npm exec --prefix tooling/base44-cli -- base44 link --projectId 6aca5ff33ab16f3383490010
pnpm build:base44
pnpm base44:deploy
```

Never commit Base44 credentials or local link state.

## Spatial lab

The previous five-screen starter remains accessible as a development
reference under `/lab`, `/native`, `/hybrid`, `/game`, and
`/immersive`. It is not part of the four-tab product navigation.

See [spatial architecture](docs/ARCHITECTURE.md),
[adaptive layouts](docs/RESPONSIVE-SHELL.md),
[camera/XR limitations](docs/CAMERA_AND_XR.md), and
[testing requirements](docs/TESTING.md).

## License

MIT. See [LICENSE](LICENSE) and [third-party notices](THIRD_PARTY_NOTICES.md).
