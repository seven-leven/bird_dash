import { test } from 'vitest';
import { assertEquals } from '@std/assert';
import { showCrash } from './showCrash.ts';

test('the crash takes the place of what the root held: what broke, and a way to load again', () => {
  const root = document.createElement('div');
  root.innerHTML = '<p>half a page</p>';
  let reloads = 0;
  showCrash(root, 'App failed to start', () => reloads++);
  const alert = root.querySelector('[role="alert"]')!;
  assertEquals(root.children.length, 1);
  assertEquals(alert.querySelector('h2')!.textContent, 'Something went wrong');
  assertEquals(alert.querySelector('p')!.textContent, 'App failed to start');
  alert.querySelector('button')!.click();
  assertEquals(reloads, 1);
});

test('with no root to write into, it does nothing', () => {
  showCrash(null, 'nowhere', () => {}); // no throw
});
