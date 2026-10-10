# Pa'Casa healthcare redesign — design documentation

This folder is the design-lane (D) handoff for the Pa'Casa cross-platform
healthcare redesign. It documents the research, decisions, copy and
accessibility risks for repurposing the five shared-app route slugs into the
patient workflows locked by [ADR 0002](../../adr/0002-pacasa-healthcare-route-map.md).

**Scope:** design and evidence only. No source code is changed here; the
`src/` Base44/Vite patient app is treated as the reference implementation the
shared app (`apps/web`, `apps/mobile`, `packages/app`) converges on.

## Route map (binding)

The five slugs are protected by `tooling/verify-five-routes.mjs`. Slugs stay;
user-facing labels are Spanish workflow names.

| Slug | Workflow | Nav role | Reference impl |
|---|---|---|---|
| `/` | **Inicio** — start or resume the visit | Primary destination | `src/pages/Inicio.jsx` |
| `/native` | **Formularios** — forms and field progress | Primary destination | `src/pages/Formularios.jsx` |
| `/hybrid` | **Documentos** — source documents and analysis | Primary destination | `src/pages/Documentos.jsx` |
| `/game` | **Revisar** — confirm and correct answers | Primary destination | `src/pages/Revisar.jsx` |
| `/immersive` | **Ayuda** — accessibility, privacy, how Pa'Casa works | Secondary route: header menu / drawer / links, **not a bottom tab** | `src/components/PatientShell.jsx` drawer panels (`DrawerPanel`, lines 30–129) |
| — (overlay) | **Pa'Casa Live** — Hablar / Traducir / Preguntar | Raised center action; root-level overlay, not a sixth route | `src/pages/PaCasaLive.jsx` (route `/pacasa` outside `PatientShell`, `src/App.jsx:45`) |

The center action opens the Pa'Casa Live overlay. On `src/` it is the
`/pacasa` route rendered outside `PatientShell`; on the shared app it maps to
the existing raised-center-action pattern (`ScanButton` in
`packages/app/screens/AppShell.tsx:85-99` → `CameraLab` modal,
`AppShell.tsx:216`). The overlay records the origin pathname in the session
(`returnTo`, `packages/app/session/root-screen.ts`; `session.set({ returnTo })`
in `src/session/store.js:170`) and closes back to exactly that screen — the
underlying tab selection never changes.

## Files

| File | Surface |
|---|---|
| `00-references.md` | Mobbin screen research digest, per workflow |
| `01-inicio.md` | `/` — Inicio |
| `02-formularios.md` | `/native` — Formularios |
| `03-documentos.md` | `/hybrid` — Documentos |
| `04-revisar.md` | `/game` — Revisar |
| `05-ayuda.md` | `/immersive` — Ayuda (secondary) |
| `06-pacasa-live.md` | Center overlay — Hablar / Traducir / Preguntar |
| `07-design-system.md` | Daylit token proposal, radius/type, reuse matrix |

## Visual direction (summary — detail in `07-design-system.md`)

Calm, minimal, **daylit** healthcare. The repo already encodes a daylit
scheme in `packages/theme/tokens.ts` (`semantic.light`, "Decision #4: light is
daylit and the default") — the redesign uses those semantic pairs rather than
inventing a new palette. Soft radius, larger body text, no neon/glow,
no game-like styling inside patient workflows. The current patient surface
(`src/index.css:8-21`) is still bound to the night palette (`--page:#00041C`);
flipping the same semantic token names to their daylit values is the token
contract, measured by the existing contrast gate (`packages/theme/contrast.ts`).

## Safety invariants (carry forward — do not redesign away)

- **Provenance:** every extracted/answered field keeps `sourceLabel` (the
  English label as printed) and page number (`DetectedField`,
  `packages/app/session/document-analysis.ts:15-20`).
- **Explicit confirmation:** a dictated or typed answer is a *proposal* the
  patient confirms ("Sí, correcto" / "Corregir", `src/pages/PaCasaLive.jsx:140-157`).
  A corrected answer returns to unconfirmed (`patient.ts:219-226` comment).
- **No auto-submit:** `analyseDocument` never writes a form on its own;
  `formFromDocument` only runs after the patient taps "Usar para formulario".
- **Honest unreadable states:** unknown labels → `needs_review`/`no_fields`,
  never guessed (`document-analysis.ts:57-74`); `unreadable` documents surface
  honestly (`patient.ts:47-52`).
- **No invented translations or medical advice:** `translatePhrase` misses
  honestly (`phrasebook.ts:52-60`); `groundQuestion` only answers from the
  active form (`grounding.ts:43-88`). Interpreter escalation copy lives in
  `05-ayuda.md` and `06-pacasa-live.md`.
- **Capability honesty:** `canSpeak`/`canListen`/`canPrint` gate affordances;
  native speech fork returns all-false rather than pretending
  (`packages/app/speech/speech.native.ts`), native print returns `canPrint()=false`
  (`packages/app/session/print.native.ts`), native has no document picker in
  this build (ADR 0002).

## Bilingual and older-adult rules (all surfaces)

- Spanish-first patient copy, plain sentence case, usted register — matches the
  existing implementation (`¿Cuál es su nombre completo?`).
- **No emoji inside labels** — icons only (`lucide`/`@acme/ui/icons`).
  `src/pages/Inicio.jsx:67-69` currently embeds emoji in labels; strip them.
- English appears verbatim only where it is *provenance*: `sourceLabel` shown
  under "En el formulario dice".
- Interpreter escalation guidance wherever translation could affect care.
- Tap targets ≥ 44–48 pt; the reference kit already uses `min-h-11`/`min-h-12`
  (`src/components/patient-ui.jsx`); keep or grow them.

## Proto-personas (assumptions, not research — need validation)

1. **Rosa, 67, Spanish-first patient** (mirrors the demo data's Rosa
   Velázquez, `patient.ts:74-78`): completing a clinic intake on a phone,
   low vision, low digital literacy, interrupts and resumes. Needs: one
   question at a time, read-aloud, large targets, honest "I couldn't read
   that" states.
2. **Front-desk / bilingual staff member**: uses Traducir for known front-desk
   phrases; needs direction toggle, replay, and a clear "not translated"
   state to fall back to a qualified interpreter.
3. **English-speaking provider/reviewer**: sees the completed form output with
   English `sourceLabel` provenance intact; needs confidence that nothing
   auto-submitted.

These are proto-personas built from the product's own data model and domain
basics — **no user research has run**. Validation needed before clinical use
(blocking per roster lane D02).

## What is NOT here

- No Figma output — no Figma connector is available; Markdown handoff only.
- No device captures — nothing was run on a simulator, device or browser;
  all screen references are Mobbin stills plus the checked-in `src/` code.
- No clinical, legal or privacy approval — unresolved safety/PHI questions are
  listed per screen as open questions for the real reviewers in ROSTER.
