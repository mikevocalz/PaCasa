# Pa'Casa product documentation

**Start with [Chat / Translate assistant, privacy and backend contract](PACASA_ASSISTANT.md).** The remaining pages describe the preserved spatial starter and its platform rules.

# Documentation map

This documentation is written in **user journey order**, not in dependency order. Start with the intent, then read the component contract, then inspect the implementation adapters. Every page distinguishes **implemented in the source fork**, **to build**, and **requires device verification**.

## Learning path

1. **[Architecture](ARCHITECTURE.md):** Three independent questions—what is the layout, what renders inside each panel, and who hosts the panel?
2. **[Layouts](LAYOUT_SYSTEM.md):** Standard (`master/content/inspector`) and Game (`controls/stage/HUD`) are semantically different. Both survive phone/dual-screen/spatial changes.
3. **[Components](COMPONENTS.md):** A stable React-facing API using Margelo's `api-design` criteria. Props describe requirements and preferences; resolved state is reported.
4. **[Kinetrell Motion](KINETRELL_MOTION.md):** Why motion contracts, native Reanimated and browser GSAP/Lenis are coordinated instead of competing.
5. **[Rive](RIVE.md):** Why a Rive artboard is an interactive renderer, not automatically a native semantic control or an engine panel.
6. **[Camera & XR](CAMERA_AND_XR.md):** Center scan button, frame-based inference **and** native visionOS ARKit reference-object tracking, lifecycle, no simulated XR input.
7. **[Mobile & Foldables](MOBILE_AND_FOLDABLES.md):** Moyo-inspired rail, split panes, inspector, reserved regions and iPhone Duo treatment.
8. **[Platforms](PLATFORMS.md):** What each native adapter must prove, instead of hardcoded universal claims.
9. **[Testing](TESTING.md):** Device test evidence and release gates.

## Five demo routes, no sixth route

| Route | Main lesson | Supporting lesson |
| --- | --- | --- |
| `/` | Composition showcase | Theme / capability diagnostics |
| `/native` | Native standard workspace | Rail, list-detail and inspector |
| `/hybrid` | Native side panels + Rive center | Typed Rive events |
| `/game` | Distinct Game Layout | 30-second playable loop |
| `/immersive` | World engine vs OS windows | Viro/Three.js with Rive HUD |

The **Camera Lab** opens as a modal/full-screen overlay from the raised camera affordance on the phone dock. It is not a route and does not add a sixth demonstration screen. On XR it opens a real sensing tool bound to the supported native camera **or** reference-object tracking API.

## Agent program

The coding-agent program lives at the bundle root: [`prompts/MASTER_PROMPT_V5.md`](../../prompts/MASTER_PROMPT_V5.md) (the one prompt to start from), [`prompts/ROSTER.md`](../../prompts/ROSTER.md) (creator/spec-author-tier lanes E1–E20, D1–D10), [`prompts/SKILLS.md`](../../prompts/SKILLS.md) (every named skill with required outputs, per-screen design sequence, Mobbin protocol, skill → PR matrix) and [`prompts/SUBAGENTS.md`](../../prompts/SUBAGENTS.md) (orchestrator, workers, reviewers, wave DAG, handoff contract). Every page below is an input to those lanes.

## Reading rules

- `Snippet — proposed` means API shape, **not** a shipping npm symbol.
- `Device verified` requires log, video/screenshot evidence, exact device/OS, build and permission states.
- Official sources outrank docs when APIs change; update both implementation and docs in the same PR.
- Never call a passthrough compositing layer a raw frame source.
- No storyboard screenshot or status badge may imply functionality that has not been run.

[Return to README](../README.md)
