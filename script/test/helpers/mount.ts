import { createRenderer, defineComponent } from 'vue';

// A renderer that draws nothing. It lets a test mount a real component — so
// onMounted / onUnmounted and provide / inject behave exactly as in the app —
// without needing a DOM for Vue itself.
type Node = { parent: Node | null };
const { createApp } = createRenderer<Node, Node>({
  insert: (el, parent) => (el.parent = parent),
  remove: (el) => (el.parent = null),
  createElement: () => ({ parent: null }),
  createText: () => ({ parent: null }),
  createComment: () => ({ parent: null }),
  setText: () => {},
  setElementText: () => {},
  parentNode: (node) => node.parent,
  nextSibling: () => null,
  patchProp: () => {},
});

/**
 * Run a composable inside a mounted component and return what it returned.
 * `onMounted` hooks have run by the time this returns; `unmount()` runs the
 * `onUnmounted` hooks. Use this (not `runInScope`) when the code under test
 * registers lifecycle hooks that must actually fire.
 */
export function mountComposable<T>(composable: () => T): { result: T; unmount: () => void } {
  let result!: T;
  const app = createApp(defineComponent({
    setup() {
      result = composable();
      return () => null;
    },
  }));
  app.mount({ parent: null });
  return { result, unmount: () => app.unmount() };
}
