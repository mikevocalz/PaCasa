import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

test('Talk icons are exported by both platform adapters', () => {
  const workspace = readFileSync(new URL('./TalkWorkspace.tsx', import.meta.url), 'utf8');
  const imports = workspace.match(/import\s*\{([^{}]+)\}\s*from\s*'@acme\/ui\/icons'/);
  assert.ok(imports, 'TalkWorkspace should use the shared icon adapters');
  const names = imports[1]!.split(',').map((name) => name.trim());
  const web = readFileSync(new URL('../../ui/icons.web.ts', import.meta.url), 'utf8');
  const native = readFileSync(new URL('../../ui/icons.native.tsx', import.meta.url), 'utf8');
  const webExports = new Set(web.match(/export\s*\{([^{}]+)\}\s*from\s*'lucide-react'/)?.[1]
    ?.split(',').map((name) => name.trim()));
  const nativeExports = new Set([...native.matchAll(/export const (\w+) = icon\(/g)]
    .map((match) => match[1]));
  for (const name of names) {
    assert.ok(webExports.has(name), `Missing web icon: ${name}`);
    assert.ok(nativeExports.has(name), `Missing native icon: ${name}`);
  }
});
