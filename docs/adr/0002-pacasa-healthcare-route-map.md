# ADR 0002: Pa'Casa healthcare route map

Date: 2026-02-06
Status: Accepted for this redesign branch

## Context

The repository contains two Pa'Casa surfaces:

- `src/`: the deployed Base44/Vite patient app, with the locked healthcare workflow `Inicio`, `Formularios`, `Documentos`, `Revisar`, and the root-level Pa'Casa Live command surface.
- `apps/web`, `apps/mobile`, and `packages/app`: the shared cross-platform app, still using the spatial-starter routes and visual language.

The shared app is protected by `tooling/verify-five-routes.mjs`, which requires exactly:

- `/`
- `/game`
- `/hybrid`
- `/immersive`
- `/native`

The patient session, document analysis, grounded questions, phrasebook, speech, and print modules already exist under `packages/app/session/` and `packages/app/speech/`, but were not connected to visible screens.

## Decision

Keep the five existing route slugs unchanged and repurpose their shared screens as Pa'Casa workflows:

| Route | Patient workflow | Navigation role |
| --- | --- | --- |
| `/` | Inicio — start or resume the visit | Primary destination |
| `/native` | Formularios — forms and field progress | Primary destination |
| `/hybrid` | Documentos — source documents and analysis | Primary destination |
| `/game` | Revisar — confirm and correct answers | Primary destination |
| `/immersive` | Ayuda — accessibility, privacy, and how Pa'Casa works | Secondary route, linked from home/menu rather than a tab |

Replace the raised Camera Lab action with a Pa'Casa Live overlay. The overlay is not a sixth route; it owns Hablar, Traducir, and Preguntar and returns to the underlying pathname through the existing session contract.

Keep `packages/camera` and the native Camera Lab implementation intact, but do not present it as patient document capture. Document upload remains honest: web may use the platform file input; native reports that this build has no document picker instead of pretending a capture pipeline exists.

## Consequences

- Deep links and the five-route verifier remain stable.
- The patient workflows can share the existing Zustand session store.
- The old starter route names remain technical slugs; user-facing labels must be Spanish workflow names.
- The spatial/game demos are no longer patient-facing destinations. Their contracts and package tests remain protected, but the visible screens should not advertise them as healthcare capabilities.
- A future route rename can be made deliberately in a follow-up PR by moving route files and updating `verify-five-routes.mjs`; this branch intentionally avoids that churn.

## Safety requirements carried forward

- No unverified OCR result may complete a form automatically.
- Every extracted field must keep `sourceLabel` and page provenance.
- Unreadable labels/documents must surface as `needs_review` or honest unsupported states.
- Spanish questions and translations are product copy, not clinical advice.
- Native speech, print, camera, XR, and device posture claims must only describe implemented and tested behavior.
