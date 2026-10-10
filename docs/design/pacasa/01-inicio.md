# 01 — Inicio `/`

**Workflow:** the patient's starting point — "¿Qué necesita hacer ahora?"
**Slug:** `/` (locked, `tooling/verify-five-routes.mjs`)
**Reference implementation:** `src/pages/Inicio.jsx`; shared-app slug currently
renders `ShowcaseScreen` (`apps/web/app/page.tsx`, `apps/mobile/app/index.tsx`)

## References (full digest in `00-references.md`)

- [Ro — Get support](https://mobbin.com/screens/ef315b82-f09c-4047-b3f3-3db0a1583c5b): task-phrased rows under one bold question.
- [Noom — Today](https://mobbin.com/screens/d368daf7-b4c1-4bd1-91ea-1f4a77c7917d): progress first, then next action. Do not copy streaks/gamification.
- [Lovi — Today](https://mobbin.com/screens/c0048d26-0a9c-4575-a954-3f544f206b40): checked/unchecked plan rows; raised center action in bottom nav.

## Findings (source audit)

`src/pages/Inicio.jsx` is already close to the target pattern:

- Frame = question + title + lead (`PatientFrame`,
  `src/components/patient-ui.jsx:5-16`) — matches the NHS "one thing per page"
  principle.
- **Resume-first ordering:** when `activeForm` exists, the top panel is
  "Formulario en curso" with `ProgressRow` and the literal next question
  (`Inicio.jsx:52-64`) — the correct model for interruption/resumption.
- **Cold start:** three `BigAction`s — start with a form (voice), take a
  photo, upload PDF (`Inicio.jsx:66-71`).
- Secondary panels: last document, answers-so-far pointer to Revisar
  (`Inicio.jsx:80-100`). Sensible hierarchy.

Gaps vs. the contract:

- **Emoji inside labels** (`Inicio.jsx:67-69`: "🎤 Empezar con un formulario",
  "📷 Tomar foto", "📄 Subir PDF") — violates the no-emoji-in-labels rule;
  the lucide icons already passed as `icon` props make them redundant.
- "Tomar foto" resolves through the file input with `capture=environment`
  (`src/session/voice.js:69-89`) — honest on web/mobile-web, but **the shared
  native build has no document picker** (ADR 0002): the shared screen must
  show an honest unsupported state instead of this action.
- Every primary action routes into `/pacasa` (`startForm`, `continueTalking`)
  — good: the overlay contract is already the entry point, not a dead CTA.
- Dark theme: inherits the night palette via `src/index.css` — see
  `07-design-system.md`.

## Decisions

1. **Resume is the hero.** If any form is `en_progreso`, Inicio leads with
   the in-progress form, the next pending question, and "Continuar hablando".
   New-work actions demote to secondary (`tone="quiet"`), matching the
   existing layout (`Inicio.jsx:73-78`).
2. **Three start paths max** (voice-first form, photo, PDF) — mapped from the
   Ro single-question + Lovi checklist pattern. No promotional or educational
   content modules on Inicio.
3. **Capability-honest actions:** on the shared native build, "Tomar foto" /
   "Subir PDF" render with `disabled` + `disabledHint` ("No disponible en esta
   versión — pida ayuda en recepción") rather than being hidden, so the
   patient hears the same story everywhere. `BigAction` already supports this
   (`patient-ui.jsx:50-70`).
4. **Strip emoji from labels;** keep the lucide icon + label + hint triple.
5. Sentence case for all action labels (drop `uppercase` text-transform on
   `ActionButton`/`BigAction` — tokenized in `07-design-system.md`).

## Copy (ES primary; EN only as provenance)

| Slot | Copy (existing → proposed) |
|---|---|
| Question kicker | "¿Qué necesita hacer ahora?" (existing — keep) |
| Title, empty session | "¿Qué necesita llenar hoy?" (existing — keep) |
| Title, resuming | "Continuemos" + `{form.title} · {form.clinic}` (existing — keep) |
| Lead, empty | "Suba el formulario de la clínica y Pa'Casa se lo pregunta en español, una pregunta a la vez." (keep) |
| Primary actions | "Empezar con un formulario" / "Tomar foto" / "Subir PDF" — **without emoji**; hints: "Hablando, en español" / "Del formulario en papel" / "El formulario de la clínica" |
| Resume panel | "Formulario en curso" · "Siguiente pregunta: {questionEs}" / "Ya contestó todo. Revise sus respuestas." (keep) |
| Resume actions | "Continuar hablando" (primary) / "Revisar respuestas" (quiet) |
| Last document | "Último documento" · "{title} · {clinic} · PDF/Imagen · N páginas / sin leer todavía" · "Ver" |
| Answers pointer | "Respuestas de esta visita" · "Puede escuchar y corregir cada respuesta antes de terminar el formulario." · "Ir a Revisar" |
| Disabled capture hint (native) | "No disponible en esta versión. Pida ayuda en recepción." — **new string** |

Empty/uncertainty states: there is no error path on Inicio itself; document
failures surface in Documentos (`03-documentos.md`).

## Accessibility risks

- **Emoji in labels** reads inconsistently under VoiceOver/TalkBack and adds
  noise after the icon — remove (risk in current impl).
- `BigAction` hit areas `min-h-24` are good; verify ≥ 48 dp on native and that
  the grid doesn't collapse to two buttons per row at 200% text size (WCAG
  1.4.10 reflow, 1.4.4 resize text).
- "Siguiente pregunta: …" must be inside the live session announcement order —
  heading → lead → progress → next question → actions. Keep DOM order = visual
  order (it already is; verify after any redesign).
- Daylit focus ring: `--accent-soft` (#80ACFC) on daylit panels is <3:1 —
  focus indicator needs the darker royal step (see `07-design-system.md`,
  WCAG 2.4.13).

## Open questions

- Does Inicio need a greeting/identity ("Hola, Rosa")? Demo data implies one
  patient per session; **privacy lane** to confirm whether a name on the home
  screen is appropriate at all on a shared/kiosk device.
- Should "Modo demo" be reachable from Inicio, or drawer-only (current:
  drawer-only, `PatientShell.jsx:34`)? Leaning drawer-only to avoid a patient
  tapping it mid-visit — flag for D01/E15.
- Native document capture: does a real picker/camera land this cycle
  (E03/E05), or does the disabled-hint state ship? Design covers both.
