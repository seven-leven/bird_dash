import { afterEach, test } from 'vitest';
import { assertEquals } from '@std/assert';
import { withViewTransition } from './withViewTransition.ts';

/** A browser with view transitions: it runs the update it is given, and keeps it. */
function fakeViewTransitions() {
  const updates: (() => Promise<void>)[] = [];
  Object.defineProperty(document, 'startViewTransition', {
    configurable: true,
    value: (update: () => Promise<void>) => updates.push(update),
  });
  return updates;
}
afterEach(() => {
  Reflect.deleteProperty(document, 'startViewTransition');
});

/** Stand in for the visitor's motion preference (domSetup.ts puts the real one back). */
function prefersReducedMotion(reduce: boolean) {
  globalThis.matchMedia = (() => ({ matches: reduce })) as unknown as typeof matchMedia;
}

test('without view transitions in the browser, the change happens at once', () => {
  let changed = 0;
  withViewTransition(() => changed++);
  assertEquals(changed, 1);
});

test('with them, the change is made inside one, which waits for Vue to draw it', async () => {
  prefersReducedMotion(false);
  const updates = fakeViewTransitions();
  let changed = 0;
  withViewTransition(() => changed++);
  assertEquals([updates.length, changed], [1, 0]); // the browser runs it when ready
  await updates[0]!();
  assertEquals(changed, 1);
});

test('a visitor who asks for reduced motion gets the change with no transition', () => {
  prefersReducedMotion(true);
  const updates = fakeViewTransitions();
  let changed = 0;
  withViewTransition(() => changed++);
  assertEquals([updates.length, changed], [0, 1]);
});
