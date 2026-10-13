import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

const require = createRequire(new URL('../packages/app/package.json', import.meta.url));
const manifest = require.resolve('@native-springs/shaders/package.json');
const root = dirname(manifest);
const pkg = JSON.parse(readFileSync(manifest, 'utf8'));
assert.equal(pkg.name, '@native-springs/shaders');
assert.match(readFileSync(join(root, pkg.main), 'utf8'), /export \{ OrbOverlay \}/);
assert.match(readFileSync(join(root, pkg.types), 'utf8'), /export \{ OrbOverlay \}/);
assert.match(readFileSync(join(root, 'build/utils/conversational.d.ts'), 'utf8'), /export type ConversationState/);
for (const path of ['build/components/OrbOverlay.js', 'build/components/OrbOverlay.d.ts', 'android', 'ios', 'expo-module.config.json', 'LICENSE']) {
  assert.ok(existsSync(join(root, path)), `Native Springs artifact is missing ${path}`);
}
console.log(`[verify-talk-shaders] ${pkg.name}@${pkg.version} ships the OrbOverlay runtime, types and native module files`);
