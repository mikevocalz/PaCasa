# Three-mode center assistant

- Entry: existing raised center Pa’Casa action, full-screen modal. Four regular product tabs are unchanged.
- Tabs inside modal (NOT bottom tabs): **Chat**, **Escanear**, **Hablar**.
- **Chat** uses the existing Gemini + OpenUI text workflow and does not inherit translation messages.
- **Escanear** currently opens the existing native camera **lab** only; this is *not* document OCR. Web shows explicit unavailability until cross-platform scanner PR.
- **Hablar** retains text-based English↔Spanish translator and local voice-note review; **not** a live interpreting service yet.
- All work is ephemeral and behind consent; switching stage aborts in-flight requests; close restores the previous route.
- Components: ONLY existing \`@acme/ui\`, \`@acme/ui/tw\`, \`@acme/chat-ui\`. No screen-authored HTML or raw DOM.
- Next stacked PRs: streaming route cards and 3D chat orb; document capture/OCR with Rive; bidirectional live interpreting with Native Springs shaders.

## Verification
- \`pnpm --filter @acme/app test\`
- \`pnpm --filter @acme/app typecheck\`
- Verify keyboard focus, screen readers, 320px widths, back/escape, tablet/right-side navigation, iOS/Android, web, and foldables.
- No device, compile, or CI success is claimed from the GitHub API authoring environment.

## Skills applied
Read repo \`AGENTS.md\` and \`docs/spec/prompts/SKILLS.md\`; Margelo \`api-design\`, Vercel React best practices. No third-party slash-command skill claimed to have executed.
