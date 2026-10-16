import { test } from 'vitest';
import { assertEquals } from '@std/assert';
import { nextTick } from 'vue';
import { createUiStore } from './ui.ts';
import { mountComposable } from '../../script/test/helpers/mount.ts';
import { withDom } from '../../script/test/helpers/dom.ts';

/** The ui store, mounted so its window listeners are really attached. */
function setup(width = 1400) {
  Object.defineProperty(globalThis, 'innerWidth', { value: width, configurable: true });
  globalThis.matchMedia = (() => ({ matches: false })) as unknown as typeof matchMedia;
  const observers = { created: 0 };
  globalThis.IntersectionObserver = class {
    constructor() {
      observers.created++;
    }
    observe() {}
    disconnect() {}
  } as unknown as typeof IntersectionObserver;

  const { result: ui, unmount } = mountComposable(() => createUiStore());
  return { ui, unmount, observers };
}

const header = (top: number) => {
  const el = document.createElement('h2');
  el.getBoundingClientRect = () => ({ top }) as DOMRect;
  return el;
};

test('the sidebar opens, toggles and closes', () =>
  withDom(() => {
    const { ui, unmount } = setup();
    assertEquals(ui.sidebarOpen.value, false);
    ui.toggleSidebar();
    assertEquals(ui.sidebarOpen.value, true);
    ui.toggleSidebar();
    assertEquals(ui.sidebarOpen.value, false);
    ui.toggleSidebar();
    ui.closeSidebar();
    assertEquals(ui.sidebarOpen.value, false);
    unmount();
  }));

test('the view starts on groups; choosing the current view again changes nothing', () =>
  withDom(async () => {
    const { ui, unmount, observers } = setup();
    ui.bindScrollContainer(document.createElement('div'));
    assertEquals(ui.viewMode.value, 'group');

    ui.setViewMode('group');
    await nextTick();
    assertEquals(observers.created, 0, 'the scroll-spy was rebuilt for no reason');

    ui.setViewMode('date');
    assertEquals(ui.viewMode.value, 'date');
    await nextTick();
    assertEquals(observers.created, 1, 'a new view has new headers, so the spy is rebuilt');
    unmount();
  }));

test('the theme toggle flips the page class and remembers the choice', () =>
  withDom(async () => {
    const { ui, unmount } = setup();
    assertEquals(ui.theme.isDark, false);
    ui.toggleTheme();
    await nextTick();
    assertEquals(ui.theme.isDark, true);
    assertEquals(document.documentElement.classList.contains('dark'), true);
    assertEquals(localStorage.getItem('theme'), 'dark');
    unmount();
  }));

test('isMobile follows the window width', () =>
  withDom(() => {
    const narrow = setup(600);
    assertEquals(narrow.ui.isMobile.value, true);
    narrow.unmount();

    const wide = setup(1400);
    assertEquals(wide.ui.isMobile.value, false);
    wide.unmount();
  }));

test('registered headers drive the active section; an unmounted header is forgotten', () =>
  withDom(() => {
    const { ui, unmount } = setup();
    const container = document.createElement('div');
    container.getBoundingClientRect = () => ({ top: 0 }) as DOMRect;
    ui.bindScrollContainer(container);

    ui.registerHeader('Ducks', header(-200));
    ui.registerHeader('Herons', header(50));
    ui.updateActiveSection();
    assertEquals(ui.activeSection.value, 'Herons');

    // Vue calls the ref function with null when the header unmounts.
    ui.registerHeader('Herons', null);
    ui.registerHeader('Terns', header(20));
    ui.updateActiveSection();
    assertEquals(ui.activeSection.value, 'Terns');
    unmount();
  }));

test('resetHeaders forgets every header, so a stale one cannot win after a switch', () =>
  withDom(() => {
    const { ui, unmount } = setup();
    const container = document.createElement('div');
    container.getBoundingClientRect = () => ({ top: 0 }) as DOMRect;
    ui.bindScrollContainer(container);
    ui.registerHeader('Old', header(90));
    ui.updateActiveSection();
    assertEquals(ui.activeSection.value, 'Old');

    ui.resetHeaders();
    ui.registerHeader('New', header(10));
    ui.updateActiveSection();
    assertEquals(ui.activeSection.value, 'New');
    unmount();
  }));

test('scrollToTop resets the bound container, and is safe before one is bound', () =>
  withDom(() => {
    const { ui, unmount } = setup();
    ui.scrollToTop(); // nothing bound yet: must not throw

    const container = document.createElement('div');
    container.scrollTop = 900;
    ui.bindScrollContainer(container);
    ui.scrollToTop();
    assertEquals(container.scrollTop, 0);

    ui.bindScrollContainer(null); // the container unmounted
    ui.scrollToTop();
    unmount();
  }));

test('on a phone, jumping to a section closes the sidebar', () =>
  withDom(() => {
    const { ui, unmount } = setup(600);
    const container = document.createElement('div');
    container.scrollTo = (() => {}) as HTMLElement['scrollTo'];
    ui.bindScrollContainer(container);
    ui.registerHeader('Ducks', header(0));

    ui.toggleSidebar();
    ui.goToSection('Ducks');
    assertEquals(ui.sidebarOpen.value, false);
    assertEquals(ui.activeSection.value, 'Ducks');
    unmount();
  }));
