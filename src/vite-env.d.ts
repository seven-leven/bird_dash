/// <reference types="vite/client" />

// Injected by vite.config.ts at build time from script/version/compute.ts.
/** `major.minor.patch`, e.g. "0.9.161". */
declare const __APP_VERSION__: string;
/** Illustrations marked drawn across all collections. */
declare const __APP_DRAWN__: number;
/** Short hash of the commit built from, or "unknown" without git. */
declare const __APP_COMMIT__: string;

// Lets `deno check` resolve `.vue` imports from `.ts` files (e.g. main.ts →
// App.vue). Deno type-checks `.ts` only and treats each `.vue` module as this
// opaque component type — the SFC internals (templates, <script setup>) are not
// checked by the Deno toolchain.
declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<
    Record<string, unknown>,
    Record<string, unknown>,
    unknown
  >;
  export default component;
}
