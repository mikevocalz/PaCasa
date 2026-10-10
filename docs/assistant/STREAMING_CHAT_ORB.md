# Chat streaming and animated Three.js orb

## Scope
- The center Chat tab renders a lazily loaded \`@acme/ui/three/ThreeCanvas\` glass orb. One GPU renderer and its lifecycle stay in the existing cross-platform UI package. The renderer respects reduced-motion and falls back to accessible text.
- Reuses Moyo Learn's split transport: browser native fetch, native \`react-native-nitro-fetch\` using \`stream: true\` so partial responses actually appear.
- Node Gemini endpoint \`POST /assistant/stream\` consumes upstream \`streamGenerateContent?alt=sse\` and emits only bounded \`delta\`, \`done\` or \`error\` events. The server constructs deterministic safe OpenUI Lang only after a complete answer. No dynamic model-selected actions.
- Text-only Chat stream. Talk's translation request retains the pre-existing JSON endpoint; real-time microphone/speaker integration is separate.
- Switching tabs, leaving, or closing aborts requests; partial messages are not promoted to completed responses.

## Release blockers
1. Regenerate \`pnpm-lock.yaml\` after \`pnpm install\` because \`react-native-nitro-fetch\` 1.8.0 was added and only GitHub API file authoring was available. Verify Expo SDK 58 peers and frozen install.
2. Run \`pnpm --filter assistant-api test\`, \`pnpm --filter @acme/app test\`, \`pnpm --filter @acme/app typecheck\`, and full web/mobile builds.
3. Run iOS+Android real device streamed response / abort / slow-network cases, WebGPU/WebGL2 and assistive-reduced-motion tests.
4. Deploy the assistant service separately: Base44 is static. Do not put Gemini keys in client variables.
5. Production PHI needs signed-in role validation, verified privacy controls, vendor BAA and clinical review. Current service is NOT patient-data ready.

## Skills and references
Read project \`AGENTS.md\`, Margelo \`api-design\`, Vercel \`ai-sdk\` and React best practices. Compared Moyo Learn's \`stream-fetch.native.ts\` and \`stream-fetch.web.ts\` on its main branch; drew the JS API/transport architecture from verified code. Other linked skill sets were not installed here, so no execution is claimed.
