import { computed, readonly, ref, shallowReadonly } from 'vue';
import { useBreakpoint } from '../browser/useBreakpoint.ts';
import { defineInjection } from '../browser/defineInjection.ts';
import { findPage } from '../pages.ts';
import type { Page } from '../types/index.ts';

/**
 * The frame around what is shown: whether the window is narrow, whether the sidebar drawer
 * is open, which page shows, and the element the content scrolls in (the shell hands it
 * over with `bindScrollEl`, a template function ref).
 */
export function createLayoutStore() {
  const sidebarOpen = ref(false);
  const page = ref<Page>('gallery');
  const { isNarrow } = useBreakpoint();
  const scrollEl = ref<HTMLElement | null>(null);

  const toggleSidebar = (): void => {
    sidebarOpen.value = !sidebarOpen.value;
  };
  const closeSidebar = (): void => {
    sidebarOpen.value = false;
  };
  /** Show the gallery or another page; only the gallery has a sidebar to leave open. */
  const showPage = (next: Page): void => {
    page.value = next;
    if (next !== 'gallery') sidebarOpen.value = false;
  };
  /** The page shown instead of the gallery, if any (src/pages.ts). */
  const currentPage = computed(() => findPage(page.value));

  const bindScrollEl = (el: unknown): void => {
    scrollEl.value = el as HTMLElement | null;
  };
  const scrollToTop = (): void => {
    if (scrollEl.value) scrollEl.value.scrollTop = 0;
  };

  return {
    sidebarOpen: readonly(sidebarOpen),
    page: readonly(page),
    isNarrow: readonly(isNarrow),
    currentPage,
    scrollEl: shallowReadonly(scrollEl),
    bindScrollEl,
    toggleSidebar,
    closeSidebar,
    showPage,
    scrollToTop,
  };
}

export type LayoutStore = ReturnType<typeof createLayoutStore>;
export const [provideLayoutStore, useLayoutStore] = defineInjection<LayoutStore>('layout');
