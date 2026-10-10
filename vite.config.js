import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import base44 from '@base44/vite-plugin';

// The Base44 app surface: a Vite + React build at the repo root, served
// statically. @base44/vite-plugin provides the "@/ → /src/" alias, the sandbox
// runtime and the production analytics injection, so this file stays minimal.
//
// Tailwind is wired here rather than in a postcss.config file: one config for
// the whole build, and no second place to drift. The plugin list is an ARRAY —
// Vite 8's config loader requires that form.
export default defineConfig({
  plugins: [
    react(),
    base44({
      hmrNotifier: true,
      navigationNotifier: true,
      visualEditAgent: true,
    }),
  ],
  css: {
    postcss: {
      plugins: [tailwindcss(), autoprefixer()],
    },
  },
});