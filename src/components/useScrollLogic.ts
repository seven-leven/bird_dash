// src/composables/useScrollLogic.ts
import { nextTick, type Ref, ref, watch } from 'vue';

interface VueComponentInstance {
  $el: HTMLElement;
}

interface UIExpose {
  scrollContainer: HTMLElement | null;
  sidebarRefs: Record<string, HTMLElement | null>;
  headerRefs: Record<string, HTMLElement | null>;
  // Replace 'any' with the Component Instance interface
  cardRefs: Record<string, VueComponentInstance | null>;
}

// Define the shape of the UI component's exposed refs
interface UIExpose {
  scrollContainer: HTMLElement | null;
  sidebarRefs: Record<string, HTMLElement | null>;
  headerRefs: Record<string, HTMLElement | null>;
}

interface DataState {
  families: string[];
}

interface UIState {
  mobile: boolean;
  sidebarOpen: boolean;
}

export function useScrollLogic(
  uiRef: Ref<UIExpose | null>,
  data: DataState,
  ui: UIState,
) {
  const activeFamily = ref<string>('');

  const updateActiveFamily = () => {
    if (!uiRef.value || !data.families.length) return;

    const container = uiRef.value.scrollContainer;
    if (!container) return;

    const offset = container.scrollTop + 100;
    let best = '';

    for (const family of data.families) {
      const el = uiRef.value.headerRefs[family];
      if (el && el.offsetTop <= offset) {
        best = family;
      }
    }

    activeFamily.value = best || data.families[0];
  };

  const goToFamily = (family: string) => {
    if (!uiRef.value) return;

    const el = uiRef.value.headerRefs[family];
    const container = uiRef.value.scrollContainer;

    if (el && container) {
      const headerOffset = 80;
      const elementPosition = el.getBoundingClientRect().top;
      const offsetPosition = elementPosition + container.scrollTop - headerOffset;

      container.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }

    // Auto-close sidebar on mobile after navigation
    if (ui.mobile && ui.sidebarOpen) {
      ui.sidebarOpen = false;
    }
  };

  const goToBird = (birdId: string) => {
    if (!uiRef.value) return;

    const comp = uiRef.value.cardRefs[birdId];
    if (!comp) return;

    // Now TypeScript knows comp has an $el property without using 'any'
    const el = comp.$el;
    const container = uiRef.value.scrollContainer;

    if (el && container) {
      {
        const observer = new IntersectionObserver(
          (entries, obs) => {
            if (entries[0].isIntersecting) {
              const cls = [
                'ring-4',
                'ring-blue-500',
                'ring-offset-4',
                'dark:ring-offset-slate-900',
                'z-10',
                'transition-all',
                'duration-500',
              ];
              el.classList.add(...cls);
              setTimeout(() => el.classList.remove(...cls), 2000);
              obs.disconnect();
            }
          },
          { root: container, threshold: 0.5 },
        );
        observer.observe(el);
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  const handleHash = () => {
    const hash = globalThis.location.hash;
    if (hash) {
      const birdId = hash.substring(1);
      if (birdId) nextTick(() => goToBird(birdId));
    }
  };

  // Logic to sync sidebar scroll with active family
  watch(activeFamily, (newFamily) => {
    if (!uiRef.value || !newFamily) return;

    nextTick(() => {
      const el = uiRef.value?.sidebarRefs[newFamily];
      if (el?.scrollIntoView) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  });

  return {
    activeFamily,
    updateActiveFamily,
    goToFamily,
    goToBird,
    handleHash,
  };
}
