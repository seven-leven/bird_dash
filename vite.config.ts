import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';
import { computeVersion, formatVersion } from './script/version/version.ts';
import { realIo } from './script/lib/io.ts';

// The version comes from the same function as `npm run version`; there is no
// second copy of the formula here. Lenient so a dev server still starts without git
// (CI stays strict).
const version = await computeVersion(realIo, { lenient: true });

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), tailwindcss()],
  publicDir: 'public',
  base: './',
  define: {
    // Shown in the page footer (see GalleryContent.vue).
    __APP_VERSION__: JSON.stringify(formatVersion(version)),
    __APP_NAME__: JSON.stringify(version.name),
    __APP_DRAWN__: JSON.stringify(version.drawn),
    __APP_COMMIT__: JSON.stringify(version.commit),
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
          return /\/node_modules\/(vue|@vue\/[^/]+)\//.test(id) ? 'vue' : undefined;
        },
      },
    },
  },
  // Tests: `npm test` (script/testRunner/runTests.ts) runs these and picks the files per tier.
  test: {
    include: ['src/**/*_test.ts', 'script/**/*_test.ts'],
    // Each file in its own process (Vitest isolates files by default), so a fake DOM
    // or a stubbed global never leaks into another file.
    pool: 'forks',
    // The nightly job runs the property tests with FC_RUNS_MULTIPLIER times more inputs
    // (src/testing/propertyRuns.ts), so a test may take that much longer than usual.
    testTimeout: 5_000 * (Number(process.env.FC_RUNS_MULTIPLIER) || 1),
    coverage: {
      provider: 'v8',
      // No `include`: only files a test loads are measured, so the runner can tell
      // which source files no test imports (script/testRunner/areas.ts).
      exclude: ['**/*_test.ts', 'src/testing/**', '**/*.d.ts', 'public/**'],
    },
  },
});
