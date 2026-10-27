import { test } from 'vitest';
import { assertEquals } from '@std/assert';
import { h } from 'vue';
import LogoMark from './LogoMark.vue';
import { mountComponent } from '../../testing/mount.ts';

test('the mark is drawn in the current colour, and hidden from screen readers', () => {
  const svg = mountComponent(() => h(LogoMark)).querySelector('svg')!;
  assertEquals(svg.querySelector('rect'), null); // no tile behind it
  assertEquals(svg.getAttribute('aria-hidden'), 'true');
});

test('with `tile`, the solid version for small sizes', () => {
  const svg = mountComponent(() => h(LogoMark, { tile: true })).querySelector('svg')!;
  assertEquals(svg.querySelector('rect')!.getAttribute('fill'), 'currentColor');
});
