# ADR 0002: Pa'Casa healthcare route map

Date: 2026-02-06
Status: Accepted; reconciled with the merged nine-route workspace

## Context

The repository contains two Pa'Casa surfaces:

- `src/`: the deployed Base44/Vite patient app, with the locked healthcare workflow `Inicio`, `Formularios`, `Documentos`, `Revisar`, and the root-level Pa'Casa Live command surface.
- `apps/web`, `apps/mobile`, and `packages/app`: the shared cross-platform app. After the mainline merge, it has four product routes plus five preserved starter/demo routes.

The shared app is protected by `tooling/verify-five-routes.mjs`, which requires exactly:

- `/`
- `/apoyo`
- `/citas`
- `/game`
- `/hybrid`
- `/immersive`
- `/lab`
- `/mi-plan`
- `/native`

The patient session, document analysis, grounded questions, phrasebook, speech, and print modules exist under `packages/app/session/` and `packages/app/speech/`. The patient workflow screens preserve the technical starter slugs while presenting Spanish workflow names.

## Decision

Keep all nine existing route slugs unchanged. The product tabs are:

| Route | Patient workflow | Navigation role |
| --- | --- | --- |
| `/` | Inicio — start help, translation, or the visit | Primary destination |
| `/mi-plan` | Mi plan — current visit guidance and missing work | Primary destination |
| `/citas` | Citas — appointment preparation | Primary destination |
| `/apoyo` | Apoyo — explanation and translation support | Primary destination |

The preserved starter slugs carry the form-completion workflow:

| Route | Patient workflow | Navigation role |
| --- | --- | --- |
| `/lab` | Visita — form-first entry point and session overview | Secondary route |
| `/native` | Formularios — forms and field progress | Secondary route |
| `/hybrid` | Documentos — source documents and analysis | Secondary route |
| `/game` | Revisar — confirm and correct answers | Secondary route |
| `/immersive` | Ayuda — accessibility, privacy, and how Pa'Casa works | Secondary route |

Replace the raised Camera Lab action with a Pa'Casa Live overlay. The overlay is not a tenth route; it owns Hablar, Traducir, and Preguntar and returns to the underlying pathname through the existing session contract.

Keep `packages/camera`, the assistant internals, and the native Camera Lab implementation intact, but do not present them as patient document capture in the primary shell. Document upload remains honest: web may use the platform file input; native reports that this build has no document picker instead of pretending a capture pipeline exists.

## Consequences

- Deep links and the nine-route verifier remain stable.
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
