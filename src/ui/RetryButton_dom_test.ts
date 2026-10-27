import { test } from 'vitest';
import { assertEquals } from '@std/assert';
import { h } from 'vue';
import RetryButton from './RetryButton.vue';
import { mountComponent } from '../testing/mount.ts';

test('"Try again" says so, and asks its caller to retry', () => {
  let retried = 0;
  const host = mountComponent(() => h(RetryButton, { onRetry: () => retried++ }));
  const button = host.querySelector('button')!;
  assertEquals(button.textContent?.trim(), 'Try again');
  button.click();
  assertEquals(retried, 1);
});
