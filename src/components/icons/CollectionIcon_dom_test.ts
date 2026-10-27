import { test } from 'vitest';
import { assertEquals } from '@std/assert';
import { h } from 'vue';
import CollectionIcon from './CollectionIcon.vue';
import { mountComponent } from '../../testing/mount.ts';

test('CollectionIcon draws the named line icon, or the emoji when the name is not an icon', () => {
  const host = mountComponent(() =>
    h('div', [
      h(CollectionIcon, { collection: { icon: 'shark', emoji: '🦈' } }),
      h(CollectionIcon, { collection: { icon: 'unicorn', emoji: '🦄' } }),
      h(CollectionIcon, { collection: { emoji: '🐚' } }),
    ])
  );
  assertEquals(host.querySelectorAll('svg').length, 1);
  assertEquals([...host.querySelectorAll('span')].map((s) => s.textContent), ['🦄', '🐚']);
});
