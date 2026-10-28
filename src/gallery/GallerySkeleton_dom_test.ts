import { test } from 'vitest';
import { assertEquals } from '@std/assert';
import { h } from 'vue';
import GallerySkeleton from './GallerySkeleton.vue';
import { mountComponent } from '../testing/mount.ts';

test('ten grey tiles on the grid, each shaped like a tile: a square, then a caption', () => {
  const grid = mountComponent(() => h(GallerySkeleton)).querySelector('.tile-grid')!;
  assertEquals(grid.children.length, 10);
  const [image, caption] = [...grid.children[0]!.children];
  assertEquals(image!.className, 'aspect-square');
  assertEquals(caption!.className, 'h-14');
});

test('it says nothing itself: the caller tells screen readers it is loading', () => {
  const host = mountComponent(() => h(GallerySkeleton));
  assertEquals(host.textContent!.trim(), '');
  assertEquals(host.querySelector('[role], [aria-busy]'), null);
});
