# Contributing to Pa'Casa

This folder is a **documentation/engineering specification**, not a completed fork or compiled application. The five-screen starter should be created as a separate fork/derivative of [NYC-Mon](https://github.com/mikevocalz/nyc-mon), with app-specific lore, credentials, backend/admin and private assets stripped out. Retain proper source/third-party licensing and attribution.

## Scope

- Exactly five visible demo routes: `/`, `/native`, `/hybrid`, `/game`, `/immersive`.
- Camera Lab is a raised center-button **modal experience**, never a sixth route.
- Standard and Game layouts are distinct semantic families; Rive is a renderer that can be placed in either family.
- Meta/PICO/visionOS OS windows and Viro engine panels have different ownership.
- No fake/simulated headset camera feed or prerecorded detection results.

## Before writing code

1. Read [Architecture](docs/ARCHITECTURE.md), [Layouts](docs/LAYOUT_SYSTEM.md), [Components](docs/COMPONENTS.md), [Kinetrell](docs/KINETRELL_MOTION.md), [Rive](docs/RIVE.md), [Camera](docs/CAMERA_AND_XR.md), and [Testing](docs/TESTING.md).
2. Apply [Margelo's API Design skill](https://github.com/margelo/react-native-skills/tree/main/skills/api-design): sketch TypeScript contracts; write success/error/disposal examples; use discriminated unions; typed listeners and correct cleanup; separate preference from hard requirements.
3. Verify current official API docs and the actual installed dependency versions. “Latest npm” means **latest compatible and tested stable** for Expo's native graph, not a blanket forced install.
4. Keep UI components and their stories in shared packages. Navigation routes are thin. Avoid extra architecture files, unrelated generated prompts and markdown clutter in code directories.
5. Apply the full skill set in [`prompts/SKILLS.md`](../prompts/SKILLS.md): the standing toolkit (Margelo react-native-skills, Callstack agent-skills, WorldFlowAI everything-claude-code, no-ai-slop, Kinetrell docs, Mobbin per screen), the ordered per-screen UX/design sequence (user-research → design-handoff → design-system → ux-copy → accessibility-review → design-critique → code-review → frontend-design), the `engineering:*` bundle, the ReactVision `viroreact-*` XR pack, Expo / Vercel / Anthropic / Figma skills, and the project-local `uss-*` skills. Record every skill in the PR's skill ledger; mark unavailable ones honestly.
6. Work from the roster in [`prompts/ROSTER.md`](../prompts/ROSTER.md): state which Fellow-level lane you speak from; "Senior" and bare "Principal" are banned role words; oracles are the bar and the reading list, never the reviewers.
7. Use subagents per [`prompts/SUBAGENTS.md`](../prompts/SUBAGENTS.md): one lane, one agent, one evidence file; adversarial reviewers never sign their own work; a handoff missing a section is returned.
8. Standards: no invented APIs (cite installed file + symbol); `tsc --noEmit` is a hard gate; "C++ is Nitro" with Nitrogen output committed first; Zustand is the only app-state authority (bare `useState`/`useReducer` banned for app state); no AI slop and the repo must not read as LLM-authored.

## Pull request description template

```md
### Problem / user impact
### Current contract and compatibility baseline
### New public API sketch (TypeScript)
### Example: success, failure, cleanup
### Platforms, native host and lifecycle ownership
### Screenshots / videos / design comparison
### Tests run and logs (exact command / device / OS)
### Performance and accessibility effects
### Migration / deprecations / license notes
### Known blockers / intentionally unverified targets
### Lanes (from prompts/ROSTER.md) and sign-off chain status
### Skills ledger (docs/evidence/<PR>/SKILLS.md) and subagent run plan executed
```

## Non-negotiable engineering expectations

- Maintain stable public compatibility unless an explicit major migration is approved.
- No platform promises without device evidence; no silent capability downgrade when user intent requires a feature.
- UI semantics must work without relying on an animation or specific sensory modality.
- `kinetrell/core` is server-safe; browser GSAP/Lenis live behind client-only boundaries. Native uses Worklets/Reanimated.
- Native Rive/session/texture resources are owned and disposed. No permanent XR camera sessions when the tool is closed.
- No screenshots/stock footage masquerading as live perception.
- Tests must include rotation, fold/unfold, focus, low-memory/background, permissions and reduced motion.

## Publishing / attribution

Preserve original repo licenses, notices, author attribution and any third-party brand/asset notices (including the NeonBlade-inspired component work). Rebrand the derivative starter without representing NYC-Mon intellectual property as template content. The `viro-external` API playbook is a separate upstream modernization plan; do not quietly copy immature package APIs into the starter as if they were stable.
