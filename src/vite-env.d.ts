/// <reference types="vite/client" />

declare module "*.vue" {
  import type { DefineComponent } from "vue";
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
