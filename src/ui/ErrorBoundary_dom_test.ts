import { test } from 'vitest';
import { assert, assertEquals } from '@std/assert';
import { defineComponent, h, nextTick, ref } from 'vue';
import ErrorBoundary from './ErrorBoundary.vue';
import { mountComponent } from '../testing/mount.ts';
import { captureConsole } from '../testing/fakes/captureConsole.ts';

/** A part of the page that throws when `broken` is set (on its next render). */
const broken = ref(false);
const Fragile = defineComponent(() => () => {
  if (broken.value) throw new Error('the grid has no items');
  return h('p', { id: 'fine' }, 'All well');
});

test('it shows what it holds, until that throws: then the failure screen, which can try again', async () => {
  broken.value = false;
  using console_ = captureConsole();
  const retries: string[] = [];
  const host = mountComponent(() =>
    h(ErrorBoundary, { onRetry: () => retries.push('retry') }, { default: () => h(Fragile) })
  );
  assert(host.querySelector('#fine'));
  assertEquals(host.querySelector('[role="alert"]'), null);

  broken.value = true;
  await nextTick();
  const alert = host.querySelector('[role="alert"]')!;
  assert(alert.textContent!.includes('Something went wrong'));
  assert(alert.textContent!.includes('the grid has no items'));
  assertEquals(host.querySelector('#fine'), null);
  assert(console_.lines.some((line) => line.text.includes('the grid has no items')), 'logged too');

  alert.querySelector('button')!.click();
  assertEquals(retries, ['retry']);
});

test('what is thrown need not be an Error', async () => {
  using _console = captureConsole();
  const Odd = defineComponent(() => () => {
    throw 'out of paper';
  });
  const host = mountComponent(() => h(ErrorBoundary, null, { default: () => h(Odd) }));
  await nextTick();
  assert(host.querySelector('[role="alert"]')!.textContent!.includes('out of paper'));
});
