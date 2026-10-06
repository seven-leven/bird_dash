/// <reference lib="deno.ns" />
import { assertEquals, assertThrows } from '@std/assert';
import { createRenderer, defineComponent, h } from 'vue';
import { defineInjection } from './injection.ts';

// provide/inject only work inside a component, so these mount real components —
// with a renderer that draws nothing, which needs no DOM at all.
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
const root = (): Node => ({ parent: null });

interface Counter {
  count: number;
}

Deno.test('a value provided by a parent is what a child component uses', () => {
  const [provideCounter, useCounter] = defineInjection<Counter>('counter');
  const store = { count: 3 };
  let seen: Counter | undefined;

  const Child = defineComponent({
    setup() {
      seen = useCounter();
      return () => null;
    },
  });
  const app = createApp(defineComponent({
    setup() {
      provideCounter(store);
      return () => h(Child);
    },
  }));
  app.mount(root());

  assertEquals(seen === store, true, 'the child got a copy, not the provided object');
  app.unmount();
});

Deno.test('using a store with no provider above throws, naming the store', () => {
  const [, useCounter] = defineInjection<Counter>('counter');
  let error: unknown;

  const app = createApp(defineComponent({
    setup() {
      try {
        useCounter();
      } catch (e) {
        error = e;
      }
      return () => null;
    },
  }));
  // Vue warns that the injection was not found; that is the situation under test.
  app.config.warnHandler = () => {};
  app.mount(root());

  assertThrows(
    () => {
      throw error;
    },
    Error,
    'use(counter) called outside its provider',
  );
  app.unmount();
});

Deno.test('two injections with the same name do not collide', () => {
  const [provideA, useA] = defineInjection<string>('same');
  const [provideB, useB] = defineInjection<string>('same');
  let seen: string[] = [];

  const Child = defineComponent({
    setup() {
      seen = [useA(), useB()];
      return () => null;
    },
  });
  const app = createApp(defineComponent({
    setup() {
      provideA('a');
      provideB('b');
      return () => h(Child);
    },
  }));
  app.mount(root());

  assertEquals(seen, ['a', 'b']);
  app.unmount();
});
