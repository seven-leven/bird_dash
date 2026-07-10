import { nextTick, readonly, ref } from 'vue';
import { useBreakpoints, useScrollLogic, useTheme } from '../composables/index.ts';
import { defineInjection } from '../composables/core/injection.ts';
import type { ViewMode } from '../types/index.ts';

/**
 * Chrome/UI state: sidebar, theme, viewport, group/date view, and the
 * scroll-spy (active section + its scroll-container/header-ref targets).
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
  // registers section headers into headerRefs.
  const scrollContainer = ref<HTMLElement | null>(null);
  const headerRefs = ref<Record<string, HTMLElement | null>>({});
  const { activeSection, updateActiveSection, goToSection } = useScrollLogic(
    scrollContainer,
    headerRefs,
    { isMobile, closeSidebar },
  );

  const toggleViewMode = (): void => {
    viewMode.value = viewMode.value === 'group' ? 'date' : 'group';
    nextTick(updateActiveSection);
  };

  // Reset the header set (before a collection switch repopulates it).
  const resetHeaders = (): void => {
    headerRefs.value = {};
  };
  // After a collection's data is in place: jump to top and recompute the spy.
  const afterSwitch = (): void => {
    if (scrollContainer.value) scrollContainer.value.scrollTop = 0;
    updateActiveSection();
  };

  return {
    sidebarOpen: readonly(sidebarOpen),
    viewMode: readonly(viewMode),
    theme,
    isMobile: readonly(isMobile),
    activeSection: readonly(activeSection),
    // Writable ref targets bound via `ref="…"` in the template.
    scrollContainer,
    headerRefs,
    toggleSidebar,
    closeSidebar,
    toggleTheme,
    toggleViewMode,
    goToSection,
    updateActiveSection,
    resetHeaders,
    afterSwitch,
  };
}

export type UiStore = ReturnType<typeof createUiStore>;
export const [provideUi, useUi] = defineInjection<UiStore>('ui');
