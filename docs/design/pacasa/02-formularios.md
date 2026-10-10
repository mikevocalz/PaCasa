# 02 — Formularios `/native`

**Workflow:** the form workspace — what's being filled, progress per form,
ways to start another.
**Slug:** `/native` (locked). Shared slug currently renders `NativeScreen`
(surfaces workspace) — `apps/web/app/native/page.tsx`,
`apps/mobile/app/native.tsx`.
**Reference implementation:** `src/pages/Formularios.jsx`

## References

- [Visible — Participant survey](https://mobbin.com/screens/f8720b40-e869-41fb-9518-94575bfd6277): one question per view, Yes/No pills, sheet picker. Do not copy the dark theme.
- [Visible — symptom tracking](https://mobbin.com/screens/f6b0cbb2-ae52-4f90-98d9-ed6e301d4ae8): sectioned selectable rows + top progress bar.
- [Babbel — Review list](https://mobbin.com/screens/f8949021-6b1d-4e9f-a9b4-fa0c2b6e7d76): source + translation rows with per-row speaker icon.
- [Ro — goals intake](https://mobbin.com/screens/e08f9f36-6a0f-45ee-811b-a0c4ef8e5587): disabled-until-valid primary button.

## Findings (source audit)

`src/pages/Formularios.jsx`:

- Two status buckets — "En progreso" (`en_progreso`) and "Listos" (`listo`) —
  with honest empty copy for each (`Formularios.jsx:49-71`).
- `FormRow` (lines 93-119): whole header opens detail; progress bar; then
  either "Revisar respuestas" (done) or "Continuar" + "Revisar" (in progress).
  Source provenance shown via `FORM_SOURCE_LABEL` — "Dictado por voz" /
  "Tomado con la cámara" / "PDF subido" / "Formulario de ejemplo"
  (`src/session/store.js:37-42`).
- `FormDetail` (lines 121-162) is a **nested screen, not a tab** — correct IA:
  back-link "‹ Formularios", progress panel, then the full question list with
  `sourceLabel` (English as printed) + `questionEs` + value-or-"Pendiente".
- "Nuevo formulario" panel repeats the three start paths including "Usar
  formulario de ejemplo" (`Formularios.jsx:73-88`).

Gaps:

- Emoji-free here already, but `text-xs uppercase` provenance kickers at
  12 px are small for older adults — bump provenance labels to ≥14 px
  (`Formularios.jsx:148`, `patient-ui.jsx` kickers).
- Detail screen back affordance is a small text link ("‹ Formularios",
  `Formularios.jsx:128-130`, `min-h` unset) — target size likely <44 px;
  give it the standard quiet-button treatment.
- On the shared app, this slug must reuse the `NativeScreen` 40/60
  workspace pattern: form list (40) + form detail (60), with the existing
  inspector contract reserved for the detected-fields/provenance view —
  not a new layout (`packages/app/screens/NativeScreen.tsx`,
  `AGENTS.md` workspace rules).
- The list is "forms in this session" only — no historical record framing
  (session is ephemeral, `patient.ts:4-10`); copy must never imply a stored
  history.

## Decisions

1. **Status buckets stay** "En progreso" / "Listos" — two groups, honest
   empties. No third "archived" bucket: the session has no archive.
2. **Detail is nested**, pushed in-place like the current impl (or the
   40/60 detail pane on wide/native). Never a fifth tab.
3. **Every row shows provenance:** `sourceLabel` (English as printed) above
   the Spanish question, and `FORM_SOURCE_LABEL` origin ("PDF subido" etc.)
   in the row subtitle — both already present; make the provenance kicker
   14 px minimum.
4. **"Continuar" always enters Pa'Casa Live** (sets `returnTo` then opens the
   overlay) — voice is the primary completion path; editing text happens in
   Revisar, not here.
5. Wide/native layout: reuse the existing workspace split (list 40 / detail
   60). Compact stacks detail full-width with the back row ≥48 px.

## Copy

| Slot | Copy |
|---|---|
| Kicker / title | "Formularios" / "Sus formularios" (keep) |
| Lead | "Lo que está llenando en esta visita, y las formas de empezar otro." (keep) |
| Buckets | "En progreso" / "Listos" (keep) |
| Empty (in progress) | "No hay ningún formulario en progreso." (keep) |
| Empty (ready) | "Todavía no hay formularios terminados en esta sesión." (keep) |
| Row subtitle | "{clinic} · {FORM_SOURCE_LABEL} · {En progreso|Listo}" (keep) |
| Detail progress | "{done} de {total} respuestas confirmadas · {n} por preguntar / nada pendiente" (keep) |
| Question row | `{sourceLabel}` (EN, as printed) → `{questionEs}` → value or "Pendiente" |
| New form panel | "Nuevo formulario" · "Tomar foto" / "Subir PDF" / "Usar formulario de ejemplo" (hint: "Formulario de paciente nuevo") — no emoji |
| Footer note | "Al terminar, revise sus respuestas en la pestaña Revisar." (keep; sentence case on the button itself) |
| Back link | "‹ Formularios" → consider "‹ Volver a Formularios" for clarity (5 words max still) |

## Accessibility risks

- Back affordance target size (see findings).
- Provenance kicker at 12 px uppercase — resize to ≥14 px; uppercase at that
  size with wide tracking is acceptable per the kickers convention, but body
  and interactive copy stay sentence case.
- Progress bars need `role="progressbar"` + value text (already done,
  `patient-ui.jsx:80-95`) — verify the native port keeps semantic progress,
  not a decorative bar.
- Two-bucket list must announce group headings ("En progreso" as a real
  heading/`accessibilityRole="header"`) so screen-reader users know a second
  group follows.

## Open questions

- Can a patient have >1 active form per visit in the shared app (the store
  allows it — `addForm` pushes and sets `activeFormId`)? If yes, does
  "Continuar" need a disambiguation step? (Design assumes the row-level
  "Continuar" sets the active form first — current behaviour.)
- Is `ejemplo` ("Formulario de ejemplo") an acceptable source in production,
  or demo-only? Needs a clinical/product decision — if kept, label it clearly
  as a sample so it can't be mistaken for the clinic's real form.
- Should staff be able to mark a form "enviado/entregado" after Crear PDF?
  Out of scope for the patient session; provider ops lane (E15) owns.
