import { test } from 'vitest';
import { assertEquals } from '@std/assert';
import { h } from 'vue';
import Icon from './Icon.vue';
import { mountComponent } from '../../testing/mount.ts';

test('Icon draws line icons with a stroke and brand marks filled', () => {
  const host = mountComponent(() =>
    h('div', [h(Icon, { name: 'pin' }), h(Icon, { name: 'github' })])
  );
  const [line, brand] = [...host.querySelectorAll('svg')];
  assertEquals([line.getAttribute('fill'), line.getAttribute('stroke')], ['none', 'currentColor']);
  assertEquals([brand.getAttribute('fill'), brand.getAttribute('stroke')], [
    'currentColor',
    'none',
  ]);
});
