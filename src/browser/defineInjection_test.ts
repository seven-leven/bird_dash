import { test } from 'vitest';
import { assertEquals, assertThrows } from '@std/assert';
import { defineComponent, h } from 'vue';
import { defineInjection } from './defineInjection.ts';
import { mountWithoutDom } from '../testing/mount.ts';

// provide/inject only work inside a component, so these mount real components, with the
// kit's renderer that draws nothing (no DOM needed).

interface Counter {
  count: number;
}

test('a value provided by a parent is what a child component uses', () => {
  const [provideCounter, useCounter] = defineInjection<Counter>('counter');
  const store = { count: 3 };
  let seen: Counter | undefined;

  const Child = defineComponent({
    setup() {
      seen = useCounter();
      return () => null;
    },
  });
  mountWithoutDom(defineComponent({
    setup() {
      provideCounter(store);
      return () => h(Child);
    },
  }));

  assertEquals(seen === store, true, 'the child got a copy, not the provided object');
});

test('using a store with no provider above throws, naming the store', () => {
  const [, useCounter] = defineInjection<Counter>('counter');
  let error: unknown;

  const warnings: string[] = [];
  mountWithoutDom(
    defineComponent({
      setup() {
        try {
          useCounter();
        } catch (e) {
          error = e;
        }
        return () => null;
      },
    }),
    // Vue warns that the injection was not found; that is the situation under test.
    { onWarn: (message) => warnings.push(message) },
  );

  assertEquals(warnings.length, 1);
  assertThrows(
    () => {
      throw error;
    },
    Error,
    'use(counter) called outside its provider',
  );
});

test('two injections with the same name do not collide', () => {
  const [provideA, useA] = defineInjection<string>('same');
  const [provideB, useB] = defineInjection<string>('same');
  let seen: string[] = [];

  const Child = defineComponent({
    setup() {
      seen = [useA(), useB()];
      return () => null;
    },
  });
  mountWithoutDom(defineComponent({
    setup() {
      provideA('a');
      provideB('b');
      return () => h(Child);
    },
  }));

  assertEquals(seen, ['a', 'b']);
});
