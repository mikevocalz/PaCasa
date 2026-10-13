# 04 — Revisar `/game`

**Workflow:** review, correct, and confirm every answer before the visit
document is produced — "the heart of Pa'Casa" (source comment).
**Slug:** `/game` (locked). Shared slug currently renders `GameScreen`
(Pulse Catch) — `apps/web/app/game/page.tsx`, `apps/mobile/app/game.tsx`.
**Reference implementation:** `src/pages/Revisar.jsx`

## References

- [Amazon — Place Your Order](https://mobbin.com/screens/f9ab6f96-9416-4eb3-9970-672c42355ef5): full review scroll + per-group "Change" affordances. Do not copy CTA-above-content ordering.
- [Warby Parker — prescription form](https://mobbin.com/screens/e4cc01ab-bdd0-4100-a29a-d85e2c5dadaa): explicit "I confirm this information is correct" gate before Continue.
- [Babbel — dialogue review](https://mobbin.com/screens/f0e0b694-4aa8-4ee0-bb4c-45dde034c095): source line + translation pairing.
- [Noom — log list](https://mobbin.com/screens/f8e308a2-251f-4050-881c-75a9c83a8f97): one edit affordance per row, one finish action.

## Findings (source audit)

`src/pages/Revisar.jsx`:

- **Honest empty state** — no form or zero confirmed answers →
  "Todavía no hay respuestas." + a path back to start (`Revisar.jsx:25-37`).
- **Per-answer card:** `sourceLabel` kicker (English as printed) →
  `questionEs` heading → value or "Pendiente" → "Escuchar" (reads
  question + answer, gated by `canSpeak()`) + "Editar" (lines 84-141).
- **Inline edit** sets `confirmed=false` via `setAnswer`
  (`store.js:174-185` — "a corrected answer is unconfirmed again until
  Pa'Casa reads it back") then "Guardar" confirms it again
  (`Revisar.jsx:103-110`). This is the confirmation invariant working as
  designed.
- **Completion is a patient action:** "Crear PDF" → `completeForm` +
  summary view with all confirmed answers as a `dl` (lines 40-60, 145-156).
  No auto-submit anywhere.
- **Print is honest:** "Crear PDF" only renders when `canPrint()`
  (`Revisar.jsx:53`); on native `canPrint()=false`
  (`packages/app/session/print.native.ts`) — the completed view must still
  show the confirmed summary with an honest note.

Gaps:

- Empty-state "no form" branch picks `forms[0]` even when `activeFormId` is
  null (lines 17-21) — acceptable for demo; on the shared app prefer the
  form the patient was actually working on and say which form is being
  reviewed (title + clinic already in the lead).
- Editing an answer while `hearing`/speech state is unsettled — no conflict
  handling needed since Edit is local, but "Escuchar" during edit isn't
  offered; fine.
- "Crear PDF" label overpromises slightly on web — `window.print()` opens
  the print dialog ("Guardar como PDF" is a print-destination choice).
  Copy tweak below.
- No way to go back to a specific question in Hablar from a review row —
  "Editar" covers text correction; acceptable.

## Decisions

1. **Review is per-answer cards, not a table.** Each card: provenance
   kicker → Spanish question → current answer → Escuchar + Editar.
   (Babbel pairing pattern; already the impl.)
2. **The confirmation gate is the only "submit":** "Crear PDF" /
   "Confirmar y crear el documento" is disabled conceptually until the
   patient has looked at the list — implement as: the completion panel
   sits *below* all answer cards (current order, correct), never a
   sticky-first CTA (Amazon anti-pattern for this context).
3. **Corrected answers re-enter unconfirmed state** and show a subtle
   "revise otra vez" affordance — keep `confirmed` semantics; on the card,
   an unconfirmed-but-filled answer shows "Por confirmar" chip until
   Escuchar/confirm happens in Hablar. **New state to visualize:**
   currently a corrected answer is indistinguishable from confirmed until
   re-confirmed — add a quiet "Sin confirmar" label when
   `value && !confirmed` (tracks `patient.ts` semantics).
4. **Native print:** completed view shows the confirmed summary + honest
   line "En este dispositivo no se puede crear el PDF; recepción puede
   imprimirlo." — mirrors `print.native.ts`.
5. **"Escuchar" reads question + answer** in es-MX — keep; it doubles as
   the low-literacy verification path.

## Copy

| Slot | Copy |
|---|---|
| Kicker / title | "Revisar" / "Revise sus respuestas" (keep) |
| Lead | "{form.title} · {form.clinic}" (keep) |
| Empty | "Todavía no hay respuestas." / "Cuando conteste algunas preguntas, aquí las verá todas juntas." (keep) |
| Progress | "{done} de {total} respuestas confirmadas" (keep) |
| Answer empty | "Pendiente" (keep) |
| Answer unconfirmed (new) | "Sin confirmar" — chip when `value` set but `confirmed=false` |
| Edit field label | "Respuesta para {questionEs}" (existing aria-label; make it a visible label too) |
| Edit actions | "Guardar" / "Cancelar" (keep; sentence case) |
| Completion panel | "Todo está correcto" · "Si sus respuestas están bien, Pa'Casa genera el documento de la visita." (keep) |
| Primary complete | "Crear PDF" → **rename "Crear el documento"** on shared/native where there's no print; keep "Crear PDF" on web where `canPrint()` is true |
| Completed title | "Todo está correcto" (keep) |
| Completed actions | "Crear PDF" (web only) / "Volver a revisar" / "Ir a Formularios" (keep) |
| Native no-print note | "En este dispositivo no se puede crear el PDF. Recepción puede imprimirlo." — **new** |
| Clinician handoff note (new) | "El personal de la clínica revisará este documento con usted." — reassurance that output is a draft, not a submission |

## Accessibility risks

- `Escuchar`/`Editar` buttons at `min-h-11` (44 px) — keep ≥44; verify native.
- Edit input needs a **visible** label, not only `aria-label`
  (`Revisar.jsx:99-100`) — WCAG 3.3.2 labels-or-instructions.
- `aria-live` on completed view: the summary swap is a route-level change;
  ensure heading focus moves to "Todo está correcto" on transition.
- "Sin confirmar" chip must not rely on color alone — text label carries it.
- Whole-card tap vs. per-button actions: keep separate buttons (current) —
  row-level tap targets that also contain buttons create nested-interactive
  problems.

## Open questions

- Should Revisar support **voice correction** ("say it again") inline, or is
  sending the patient back to Hablar acceptable? Current: edit is typed
  only. Older-adult lane (D02) should validate whether typing is a barrier
  worth a "Corregir hablando" affordance.
- Multi-form review: when `forms.length > 1`, Revisar currently picks one.
  Design proposes a form selector strip only when >1 form exists — confirm
  with D01 whether that stays inside Revisar or is Formularios' job.
- Legal/clinical review copy: does the completed document need a
  "draft/not a medical record" watermark line? (D03 + E11 — likely yes on
  the printed artifact; needs real reviewer input.)
