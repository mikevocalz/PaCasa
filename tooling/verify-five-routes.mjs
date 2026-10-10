import { readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Four product tab routes plus the five preserved starter/demo routes.
 * Chat/Translate and Camera Lab are root overlays, not routes.
 * Fails when web and native screens diverge.
 */
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const expected = ['/', '/apoyo', '/citas', '/game', '/hybrid', '/immersive', '/lab', '/mi-plan', '/native'];

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

// Expo Router: every .tsx under app/ except layouts and +special files is a route.
const mobileApp = join(root, 'apps/mobile/app');
const mobile = walk(mobileApp)
  .map((f) => relative(mobileApp, f))
  .filter((f) => /\.tsx?$/.test(f) && !/(^|\/)(_layout|\+[^/]+)\.tsx?$/.test(f))
  .map((f) => `/${f.replace(/\.tsx?$/, '').replace(/(^|\/)index$/, '').replace(/\([^)]+\)\//g, '')}`.replace(/\/$/, '') || '/');

// Next.js App Router: every page.tsx is a route.
const webApp = join(root, 'apps/web/app');
const web = walk(webApp)
  .map((f) => relative(webApp, f))
  .filter((f) => /(^|\/)page\.tsx?$/.test(f))
  .map((f) => `/${f.replace(/(^|\/)page\.tsx?$/, '').replace(/\([^)]+\)\/?/g, '')}`.replace(/\/$/, '') || '/');

let failed = false;
for (const [app, routes] of [['mobile', mobile], ['web', web]]) {
  const got = [...new Set(routes)].sort();
  if (JSON.stringify(got) !== JSON.stringify(expected)) {
    console.error(`[verify-five-routes] ${app} routes are ${got.join(', ')}; expected ${expected.join(', ')}`);
    failed = true;
  }
}
if (failed) process.exit(1);
console.log(`[verify-five-routes] mobile and web both have exactly ${expected.join(', ')}`);
