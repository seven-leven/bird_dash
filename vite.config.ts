import { defineConfig } from 'vite';
import deno from '@deno/vite-plugin';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';
import { computeVersion, formatVersion } from './script/version/compute.ts';

// The version comes from the same function as `deno task version`; there is no
// second copy of the formula here. Lenient so a dev server still starts without git
// (CI stays strict), and it runs under Deno, so the script's Deno APIs are available.
const version = await computeVersion({ lenient: true });

// https://vite.dev/config/
export default defineConfig({
  plugins: [deno(), vue(), tailwindcss()],
  publicDir: 'public',
  base: './',
  define: {
    // Shown in the page footer (see GalleryContent.vue).
    __APP_VERSION__: JSON.stringify(formatVersion(version)),
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
          if (id.includes('/vue@') || id.includes('/@vue/')) return 'vue';
        },
      },
    },
  },
});
