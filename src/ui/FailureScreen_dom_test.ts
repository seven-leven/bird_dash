import { test } from 'vitest';
import { assertEquals } from '@std/assert';
import { h } from 'vue';
import FailureScreen from './FailureScreen.vue';
import { mountComponent } from '../testing/mount.ts';

test('the whole screen says what failed and why, and asks to try again', () => {
  const retries: string[] = [];
  const host = mountComponent(() =>
    h(FailureScreen, {
      title: "Couldn't load the gallery",
      hint: 'offline',
      onRetry: () => retries.push('retry'),
    })
  );
  const alert = host.querySelector('[role="alert"]')!;
  assertEquals(alert.querySelector('h2')!.textContent!.trim(), "Couldn't load the gallery");
  assertEquals(alert.querySelector('p')!.textContent!.trim(), 'offline');
  alert.querySelector('button')!.click();
  assertEquals(retries, ['retry']);
});
