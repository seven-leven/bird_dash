/// <reference types="vite/client" />

/** Injected by vite.config.ts at build time — see computeAppVersion() */
declare const __APP_VERSION__: string;

declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  // PropsOrPropOptions: Replaced {} with Record<string, unknown>
  // RawBindings: Replaced {} with Record<string, unknown>
  // D (Data, etc.), C (Computed), M (Methods): Replaced any with unknown
  const component: DefineComponent<
    Record<string, unknown>,
    Record<string, unknown>,
    unknown
  >;
  export default component;
}
