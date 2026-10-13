# Native Springs dependency verification

PaCasa uses the published `@native-springs/shaders@0.5.0` npm artifact.
The former Git dependency ran `expo-module prepare` during installation;
Vercel's build image failed that step because `rsync` was unavailable.
The published artifact already contains the compiled module and does not
require Git dependency preparation.

On 2026-10-13, a byte comparison against the former pinned commit
`a0e45176f87d93f6ce1b84b256233002a062850e` found identical `src/`, `android/`,
`ios/`, `package.json`, `expo-module.config.json` and `LICENSE` contents.
The npm artifact additionally includes `build/index.js`, `build/index.d.ts`,
the OrbOverlay implementation/declarations, and ConversationState types.

- Source: https://github.com/MatthewSRC/native-springs-shaders/tree/a0e45176f87d93f6ce1b84b256233002a062850e
- Registry: https://www.npmjs.com/package/@native-springs/shaders/v/0.5.0
- Registry integrity: `sha512-uk0P61Hb7F+FJVtBAEDswfVH51tIswljUXjvrb6PYQfTpQ3pXe6vK6OqFH/yNHEySq0jFW+r/qgkf7m+QDs4iA==`

`node tooling/verify-talk-shaders.mjs` checks the installed runtime, types,
native module files and license after the frozen install in CI. Keep the
registry version pinned and update the lockfile with any version change.

This packaging check does not establish device compatibility or clear the
separate redistribution/commercial-rights question for Shadertoy-derived
shader assets. The clinical, license and physical-device gates in
`BILINGUAL_TALK_ORB.md` still apply.
