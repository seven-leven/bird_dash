import { ref } from 'vue';
import type { ScrollUI, UIState, UseScrollLogicReturn } from '../../types/index.ts';

// Plain accessor interface instead of Vue's branded Ref<T>, which avoids
// [RefSymbol] incompatibilities when multiple @vue/reactivity versions are
// present in node_modules (e.g. 3.5.26 vs 3.5.30).
interface ScrollUIRef {
  readonly value: ScrollUI | null;
}

export function useScrollLogic(
  uiRef: ScrollUIRef,
  ui: UIState,
): UseScrollLogicReturn {
  const activeSection = ref<string>('');

  // Coalesce scroll events to one layout-reading pass per animation frame.
  let rafId = 0;
  const computeActiveSection = (): void => {
    const container = uiRef.value?.scrollContainer;
    if (!container) return;

    const scrollPos = container.scrollTop + 100; // offset for header

    const headers = uiRef.value?.headerRefs ?? {};
    let current = '';

    for (const [name, el] of Object.entries(headers)) {
      if (el && el.offsetTop <= scrollPos) {
        current = name;
      }
    }

    if (current && current !== activeSection.value) {
      activeSection.value = current;
    }
  };

  const updateActiveSection = (): void => {
    if (rafId) return;
    rafId = requestAnimationFrame(() => {
      rafId = 0;
      computeActiveSection();
    });
  };

  const goToSection = (name: string): void => {
    const el = uiRef.value?.headerRefs?.[name];
    const container = uiRef.value?.scrollContainer;

    if (el && container) {
      container.scrollTo({
        top: el.offsetTop - 80, // account for sticky header
        behavior: 'smooth',
      });
      activeSection.value = name;

      // Close mobile sidebar
      if (ui.mobile) {
        ui.sidebarOpen = false;
      }
    }
  };

  const handleHash = (): void => {
    // Optional: handle URL hash for direct linking
  };

  return {
    activeSection,
    updateActiveSection,
    goToSection,
    handleHash,
  };
}
