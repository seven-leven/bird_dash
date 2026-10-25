// @vitest-environment happy-dom
import { afterEach, test } from 'vitest';
import { assertEquals } from '@std/assert';
import { createApp, h } from 'vue';
import EmptyState from './EmptyState.vue';
import IdBadge from './IdBadge.vue';
import Icon from '../icons/Icon.vue';
import CollectionIcon from '../icons/CollectionIcon.vue';

let cleanup: (() => void) | undefined;
afterEach(() => cleanup?.());

function mount(render: () => ReturnType<typeof h>) {
  const host = document.createElement('div');
  document.body.append(host);
  const app = createApp({ render });
  app.mount(host);
  cleanup = () => {
    app.unmount();
    host.remove();
  };
  return host;
}

test('EmptyState shows its icon, title, hint and action', () => {
  const host = mount(() =>
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
  const host = mount(() => h(EmptyState, { title: "No matches for 'zz'" }));
  assertEquals(host.textContent?.trim(), "No matches for 'zz'");
  assertEquals(host.querySelector('p'), null);
  assertEquals(host.querySelector('svg'), null);
});

test('Icon draws line icons with a stroke and brand marks filled', () => {
  const host = mount(() => h('div', [h(Icon, { name: 'pin' }), h(Icon, { name: 'github' })]));
  const [line, brand] = [...host.querySelectorAll('svg')];
  assertEquals([line.getAttribute('fill'), line.getAttribute('stroke')], ['none', 'currentColor']);
  assertEquals([brand.getAttribute('fill'), brand.getAttribute('stroke')], [
    'currentColor',
    'none',
  ]);
});

test('IdBadge prints the id, or its slot, on a surface or over a drawing', () => {
  const host = mount(() =>
    h('div', [
      h(IdBadge, { id: '042' }),
      h(IdBadge, { id: '042', variant: 'overlay' }),
      h(IdBadge, null, () => 'custom'),
    ])
  );
  const [surface, overlay, slotted] = [...host.querySelectorAll('span')];
  assertEquals(surface.textContent, '#042');
  assertEquals(surface.className.includes('bg-slate-100'), true);
  assertEquals(overlay.className.includes('bg-black/50'), true);
  assertEquals(slotted.textContent, 'custom');
  assertEquals(slotted.className, surface.className); // one style for every surface
});

test('CollectionIcon draws the named line icon, or the emoji when the name is not an icon', () => {
  const host = mount(() =>
    h('div', [
      h(CollectionIcon, { collection: { icon: 'shark', emoji: '🦈' } }),
      h(CollectionIcon, { collection: { icon: 'unicorn', emoji: '🦄' } }),
      h(CollectionIcon, { collection: { emoji: '🐚' } }),
    ])
  );
  assertEquals(host.querySelectorAll('svg').length, 1);
  assertEquals([...host.querySelectorAll('span')].map((s) => s.textContent), ['🦄', '🐚']);
});
