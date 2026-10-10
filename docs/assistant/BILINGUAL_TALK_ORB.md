# Pa’Casa bilingual Talk + Native Springs orb (draft)

## UX contract
- The raised center button opens a clear-screen \`Chat / Scan / Talk\` modal; **Talk owns its own workspace**.
- Two explicit controls: \`Médico · English → Español\` and \`Paciente · Español → English\`. Either person taps before a turn. This is a **bidirectional, near-real-time turn interpreter**, NOT a full-duplex two-speaker diarization system.
- Permission and informed consent **before activating** the microphone. Partial live captions are local UI only; only the finalized, explicitly consented recognized text is sent to the existing Pa’Casa Gemini \`POST /assistant\` endpoint, with zero chat/session history.
- \`expo-speech-recognition\` recognizes device/browser speech; \`expo-speech\` voices the translation in the opposite language. Microphone stops before voice output to avoid echo feedback.
- Both original and translated text remain visible, plus a Replay button, Mute control, manual text input, and explicit Stop phrase button.
- Closing/switching mode aborts fetch, stops recognition/TTS, wipes ephemeral speaker history and consent.
- Native orb uses \`@native-springs/shaders\` **OrbOverlay** following Matthias Brandolin’s source. Transition \`idle → listening → thinking → speaking\`, plus error state. Web uses the existing Three.js orb.
- **No raw HTML**: \`@acme/ui\`, \`@acme/ui/tw\`, owned GPU, and native-only shader module. Zustand for application session state.

## Dependencies and compatibility
- \`expo-speech@58.0.3\` for SDK58, \`expo-speech-recognition@57.1.1\` (upstream built using Expo56; **SDK58/RN0.88 compatibility unverified**).
- NPM @native-springs/shaders 0.3.2 **does not have OrbOverlay**. Pinned GitHub commit \`a0e45176f87d93f6ce1b84b256233002a062850e\` reporting v0.5.0; run its \`prepare\` and verify iOS/Android native build. Upstream cites a Shadertoy author with unspecified shader license; **clear redistribution/commercial rights before shipping**.
- Run \`pnpm install\`, regenerate \`pnpm-lock.yaml\`, approve Git dependency builds, rebuild iOS pods/Android Gradle, then device test. Authoring was through GitHub connector only, not local builds/CLI.
- Browser speech recognition and TTS voice availability vary; always display text and offer manual fallback.
- Base service env \`NEXT_PUBLIC_PACASA_ASSISTANT_URL\` or \`EXPO_PUBLIC_PACASA_ASSISTANT_URL\`; HTTPS except localhost.
- PHI/clinical production needs verified Supabase Better Auth roles, BAA/vendor review, encryption, audit/retention and consent policies; standalone service currently development-only. Use a qualified medical interpreter for clinical decisions.

## QA gates
- \`pnpm --filter @acme/app test\`, \`pnpm --filter @acme/app typecheck\`, web/mobile builds, physical iOS/Android.
- Doctor→patient, patient→doctor, permission denial, browser STT missing, stale recognition events, abort on switch, background/resume, timeout, TTS echo, missing locale, failures, negation, doses and numeric transcription.
- Validate Native Springs Metal/OpenGL and original shader license; must not claim tested real-time full-duplex interpretation.
- Stacked PRs #6 → #7 → #8 → #9 → this. PR #4 auth and #5 i18n remain independently based; reconcile before production.

## Skills applied
Project \`AGENTS.md\` and skill manifest, Margelo API-design, Vercel React best practices, Expo Speech source, Expo Speech Recognition plugin/README, Native Springs OrbOverlay/ConversationState docs. Device and CLI were not available.
