import { defineConfig } from 'vite';
import deno from '@deno/vite-plugin';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

/**
 * Derived app version: major/minor from version.json, patch = commit count,
 * +count = total drawn illustrations across all collections.
 * Mirrors script/version/compute.ts (kept in node APIs so the Vite config
 * works in any runtime).
 */
function computeAppVersion(): string {
  const { major, minor } = JSON.parse(readFileSync('./version.json', 'utf-8'));

  let patch = 0;
  try {
    patch = Number(execSync('git rev-list --count HEAD', { encoding: 'utf-8' }).trim());
  } catch {
    // Shallow or missing git history (e.g. fetch-depth 1) — leave patch at 0.
  }

  let drawn = 0;
  const collections: Array<{ id: string }> = JSON.parse(
    readFileSync('./public/collections.json', 'utf-8'),
  );
  for (const col of collections) {
    try {
      const groups: Record<string, Array<{ drawn?: string }>> = JSON.parse(
        readFileSync(`./public/lists/${col.id}.json`, 'utf-8'),
      );
      for (const items of Object.values(groups)) {
        drawn += items.filter((i) => i.drawn).length;
      }
    } catch {
      // list may not exist yet for a new collection
    }
  }

  const z = String(patch).padStart(3, '0');
  const w = String(drawn).padStart(3, '0');
  return `${major}.${minor}.${z}+${w}`;
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [deno(), vue(), tailwindcss()],
  publicDir: 'public',
  base: './',
  define: {
    __APP_VERSION__: JSON.stringify(computeAppVersion()),
    // We use only the Composition API — drop the Options-API compat layer and
    // dev-only tooling from the production runtime.
    __VUE_OPTIONS_API__: false,
    __VUE_PROD_DEVTOOLS__: false,
    __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false,
  },
  build: {
    rollupOptions: {
      output: {
        // Keep the Vue runtime in its own chunk so it caches across app deploys.
        manualChunks(id: string) {
          if (id.includes('/vue@') || id.includes('/@vue/')) return 'vue';
        },
      },
    },
  },
});
