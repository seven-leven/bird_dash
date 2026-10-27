import { test } from 'vitest';
import { assertEquals } from '@std/assert';
import { h } from 'vue';
import EmptyState from './EmptyState.vue';
import Icon from '../icons/Icon.vue';
import { mountComponent } from '../../testing/mount.ts';

test('EmptyState shows its icon, title, hint and action', () => {
  const host = mountComponent(() =>
    h(EmptyState, { title: 'Nothing drawn yet', hint: '42 planned' }, {
      icon: () => h(Icon, { name: 'shark' }),
      default: () => h('button', "Show what's planned"),
    })
  );
  assertEquals(host.querySelector('h2')?.textContent, 'Nothing drawn yet');
  assertEquals(host.querySelector('p')?.textContent, '42 planned');
  assertEquals(host.querySelectorAll('svg').length, 1);
  assertEquals(host.querySelector('button')?.textContent, "Show what's planned");
});

test('EmptyState with only a title shows just the title', () => {
  const host = mountComponent(() => h(EmptyState, { title: "No matches for 'zz'" }));
  assertEquals(host.textContent?.trim(), "No matches for 'zz'");
  assertEquals(host.querySelector('p'), null);
  assertEquals(host.querySelector('svg'), null);
});
