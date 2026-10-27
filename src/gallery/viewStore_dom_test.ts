import { test } from 'vitest';
import { assertEquals } from '@std/assert';
import { nextTick, ref } from 'vue';
import { createViewStore } from './viewStore.ts';
import { createLayoutStore } from '../shell/layoutStore.ts';
import { mountComposable } from '../testing/mount.ts';
import { at, makeItem } from '../testing/fixtures.ts';
import type { Item } from '../types/index.ts';

const drawn = makeItem({ drawnTime: at(2025, 1) });
const undrawn = makeItem({ isDrawn: false });

/** The view store over `items`, with a real layout store, mounted as the app mounts them. */
function setup(
  { width = 1400, items = [drawn, undrawn] }: { width?: number; items?: Item[] } = {},
) {
  Object.defineProperty(globalThis, 'innerWidth', { value: width, configurable: true });
  const observers = { created: 0 };
  globalThis.IntersectionObserver = class {
    constructor() {
      observers.created++;
    }
    observe() {}
    disconnect() {}
  } as unknown as typeof IntersectionObserver;

  const { result } = mountComposable(() => {
    const layout = createLayoutStore();
    const view = createViewStore({
      items: ref(items),
      query: ref(''),
      scrollEl: layout.scrollEl,
      isNarrow: layout.isNarrow,
      closeSidebar: layout.closeSidebar,
    });
    return { layout, view };
  });
  return { ...result, observers };
}

const header = (top: number) => {
  const el = document.createElement('h2');
  el.getBoundingClientRect = () => ({ top }) as DOMRect;
  return el;
};

/** A scroll element at the top of the window, bound as the shell binds it. */
const scroller = (layout: ReturnType<typeof setup>['layout']) => {
  const el = document.createElement('div');
  el.getBoundingClientRect = () => ({ top: 0 }) as DOMRect;
  el.scrollTo = (() => {}) as HTMLElement['scrollTo'];
  layout.bindScrollEl(el);
  return el;
};

test('the view starts on groups; choosing the current view again changes nothing', async () => {
  const { layout, view, observers } = setup();
  scroller(layout);
  assertEquals(view.viewMode.value, 'group');

  view.setViewMode('group');
  await nextTick();
  assertEquals(observers.created, 0, 'the scroll-spy was rebuilt for no reason');

  view.setViewMode('month');
  assertEquals(view.viewMode.value, 'month');
  await nextTick();
  assertEquals(observers.created, 1, 'a new view has new headers, so the spy is rebuilt');
});

test('registered headers drive the active section; an unmounted header is forgotten', () => {
  const { layout, view } = setup();
  scroller(layout);
  view.registerHeader('Ducks', header(-200));
  view.registerHeader('Herons', header(50));
  view.updateActiveSection();
  assertEquals(view.activeSection.value, 'Herons');

  // Vue calls the ref function with null when the header unmounts.
  view.registerHeader('Herons', null);
  view.registerHeader('Terns', header(20));
  view.updateActiveSection();
  assertEquals(view.activeSection.value, 'Terns');
});

test('resetHeaders forgets every header, so a stale one cannot win after a switch', () => {
  const { layout, view } = setup();
  scroller(layout);
  view.registerHeader('Old', header(90));
  view.updateActiveSection();
  assertEquals(view.activeSection.value, 'Old');

  view.resetHeaders();
  view.registerHeader('New', header(10));
  view.updateActiveSection();
  assertEquals(view.activeSection.value, 'New');
});

test('on a phone, jumping to a section closes the sidebar', () => {
  const { layout, view } = setup({ width: 600 });
  scroller(layout);
  view.registerHeader('Ducks', header(0));

  layout.toggleSidebar();
  view.goToSection('Ducks');
  assertEquals(layout.sidebarOpen.value, false);
  assertEquals(view.activeSection.value, 'Ducks');
});

test('"Drawn only" is set, rebuilding the scroll-spy; setting it as it is changes nothing', async () => {
  const { layout, view, observers } = setup();
  scroller(layout);
  assertEquals(view.drawnOnly.value, false);
  view.setDrawnOnly(false);
  await nextTick();
  assertEquals(observers.created, 0);

  view.setDrawnOnly(true);
  assertEquals(view.drawnOnly.value, true);
  await nextTick();
  assertEquals(observers.created, 1, 'the set of sections changed');
});

test('the drawn filter is offered only where it filters: the family view, partly drawn', () => {
  assertEquals(setup().view.showsDrawnFilter.value, true);
  assertEquals(setup({ items: [drawn] }).view.showsDrawnFilter.value, false); // all drawn
  assertEquals(setup({ items: [undrawn] }).view.showsDrawnFilter.value, false); // none drawn

  const { view } = setup();
  view.setViewMode('month');
  assertEquals(view.showsDrawnFilter.value, false);
});

test('showUndrawn brings back what is not drawn: the family view, every item, the plan', () => {
  const { view } = setup();
  view.setViewMode('month');
  view.setDrawnOnly(true);
  view.showUndrawn();
  assertEquals([view.viewMode.value, view.drawnOnly.value, view.showPlanned.value], [
    'group',
    false,
    true,
  ]);
  view.hidePlanned();
  assertEquals(view.showPlanned.value, false);
});
