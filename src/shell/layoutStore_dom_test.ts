import { test } from 'vitest';
import { assertEquals } from '@std/assert';
import { createLayoutStore } from './layoutStore.ts';
import { mountComposable } from '../testing/mount.ts';

/** The pages the app hands the store (app/pages.ts); one is enough. */
const PAGES = [{ id: 'about', label: 'About', component: {} }];

/** The layout store, mounted so its window listeners are really attached. */
function setup(width = 1400) {
  Object.defineProperty(globalThis, 'innerWidth', { value: width, configurable: true });
  const { result: layout } = mountComposable(() => createLayoutStore(PAGES));
  return layout;
}

test('the sidebar opens, toggles and closes', () => {
  const layout = setup();
  assertEquals(layout.sidebarOpen.value, false);
  layout.toggleSidebar();
  assertEquals(layout.sidebarOpen.value, true);
  layout.toggleSidebar();
  assertEquals(layout.sidebarOpen.value, false);
  layout.toggleSidebar();
  layout.closeSidebar();
  assertEquals(layout.sidebarOpen.value, false);
});

test('isNarrow follows the window width', () => {
  assertEquals(setup(600).isNarrow.value, true);
  assertEquals(setup(1400).isNarrow.value, false);
});

test('scrollToTop resets the bound element, and is safe before one is bound', () => {
  const layout = setup();
  layout.scrollToTop(); // nothing bound yet: must not throw

  const scroller = document.createElement('div');
  scroller.scrollTop = 900;
  layout.bindScrollEl(scroller);
  assertEquals(layout.scrollEl.value, scroller);
  layout.scrollToTop();
  assertEquals(scroller.scrollTop, 0);

  layout.bindScrollEl(null); // the element unmounted
  layout.scrollToTop();
});

test('showPage switches between gallery and About, and the About page closes the sidebar', () => {
  const layout = setup();
  assertEquals(layout.page.value, 'gallery');
  layout.toggleSidebar();
  layout.showPage('about');
  assertEquals([layout.page.value, layout.sidebarOpen.value], ['about', false]);
  layout.toggleSidebar();
  layout.showPage('gallery');
  assertEquals([layout.page.value, layout.sidebarOpen.value], ['gallery', true]); // left as it was
});

test('currentPage is the page shown instead of the gallery, if any', () => {
  const layout = setup();
  assertEquals(layout.currentPage.value, undefined);
  layout.showPage('about');
  assertEquals(layout.currentPage.value?.label, 'About');
});
