import { nextTick, readonly, ref } from 'vue';
import { useBreakpoints } from '../composables/core/useBreakpoints.ts';
import { useTheme } from '../composables/core/useTheme.ts';
import { useScrollLogic } from '../composables/ui/useScrollLogic.ts';
import { defineInjection } from '../composables/core/injection.ts';
import type { ViewMode } from '../types/index.ts';

/**
 * Chrome/UI state: sidebar, theme, viewport, group/date view, and the
 * scroll-spy (active section). The scroll-spy needs two kinds of DOM element —
 * the scroll container and each section header — which components hand over
 * through `bindScrollContainer` / `registerHeader`; the elements themselves stay
 * private to this store.
 */
export function createUiStore() {
  const sidebarOpen = ref(false);
  const viewMode = ref<ViewMode>('group');
  const { theme, toggleTheme } = useTheme();
  const { isMobile } = useBreakpoints(1024);

  const toggleSidebar = (): void => {
    sidebarOpen.value = !sidebarOpen.value;
  };
  const closeSidebar = (): void => {
    sidebarOpen.value = false;
  };

  // Scroll-spy targets — Chrome binds the scroll container, GalleryContent
  // registers section headers. Both are used as template function refs, which Vue
  // calls with the element on mount and with null on unmount.
  const scrollContainer = ref<HTMLElement | null>(null);
  const headerRefs = ref<Record<string, HTMLElement | null>>({});
  const { activeSection, updateActiveSection, goToSection } = useScrollLogic(
    scrollContainer,
    headerRefs,
    { isMobile, closeSidebar },
  );

  const bindScrollContainer = (el: unknown): void => {
    scrollContainer.value = el as HTMLElement | null;
  };
  const registerHeader = (name: string, el: unknown): void => {
    if (el) headerRefs.value[name] = el as HTMLElement;
    else delete headerRefs.value[name]; // unmounted: don't let the spy measure a detached node
  };

  const toggleViewMode = (): void => {
    viewMode.value = viewMode.value === 'group' ? 'date' : 'group';
    nextTick(updateActiveSection);
  };

  // Reset the header set (before a collection switch repopulates it).
  const resetHeaders = (): void => {
    headerRefs.value = {};
  };
  const scrollToTop = (): void => {
    if (scrollContainer.value) scrollContainer.value.scrollTop = 0;
  };

  return {
    sidebarOpen: readonly(sidebarOpen),
    viewMode: readonly(viewMode),
    theme,
    isMobile: readonly(isMobile),
    activeSection: readonly(activeSection),
    bindScrollContainer,
    registerHeader,
    toggleSidebar,
    closeSidebar,
    toggleTheme,
    toggleViewMode,
    goToSection,
    updateActiveSection,
    resetHeaders,
    scrollToTop,
  };
}

export type UiStore = ReturnType<typeof createUiStore>;
export const [provideUi, useUi] = defineInjection<UiStore>('ui');
