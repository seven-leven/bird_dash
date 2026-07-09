import { onScopeDispose, type Ref, ref } from 'vue';
import type { UIState, UseScrollLogicReturn } from '../../types/index.ts';

export function useScrollLogic(
  scrollContainer: Ref<HTMLElement | null>,
  headerRefs: Ref<Record<string, HTMLElement | null>>,
  ui: UIState,
): UseScrollLogicReturn {
  const activeSection = ref<string>('');

  // The active section is the last group header that has scrolled above a line
  // ~100px below the top of the scroll container.
  const computeActive = (): void => {
    const container = scrollContainer.value;
    if (!container) return;

    const line = container.getBoundingClientRect().top + 100;

    let current = '';
    let bestTop = -Infinity;
    for (const [name, el] of Object.entries(headerRefs.value)) {
      if (!el) continue;
      const top = el.getBoundingClientRect().top;
      if (top <= line && top > bestTop) {
        bestTop = top;
        current = name;
      }
    }

    if (current && current !== activeSection.value) {
      activeSection.value = current;
    }
  };

  // Two drivers:
  //  • an IntersectionObserver fires precisely when a header crosses the top
  //    band — cheap, works with `content-visibility`, and needs no scroll
  //    handler for the common case;
  //  • a passive, time-throttled scroll listener is the safety net for fast
  //    flings / programmatic jumps the observer can skip. Throttling keeps the
  //    layout reads (and thus forced reflow) to ~10/second while scrolling.
  let observer: IntersectionObserver | null = null;
  let container: HTMLElement | null = null;
  let lastScroll = 0;

  const onScroll = (): void => {
    const now = performance.now();
    if (now - lastScroll < 100) return;
    lastScroll = now;
    computeActive();
  };

  const teardown = (): void => {
    observer?.disconnect();
    observer = null;
    container?.removeEventListener('scroll', onScroll);
    container = null;
  };

  // Called by App.vue after the header set changes (collection switch, data
  // load, view toggle): re-observe the new headers and recompute immediately.
  const updateActiveSection = (): void => {
    const el = scrollContainer.value;
    if (!el) return;

    teardown();
    container = el;

    // Trigger band spans the top ~100px so the observer fires at the same line
    // computeActive() tests against.
    const h = container.clientHeight;
    const bottom = h > 120 ? `-${h - 100}px` : '-85%';
    observer = new IntersectionObserver(() => computeActive(), {
      root: container,
      rootMargin: `0px 0px ${bottom} 0px`,
      threshold: 0,
    });

    for (const hEl of Object.values(headerRefs.value)) {
      if (hEl) observer.observe(hEl);
    }

    container.addEventListener('scroll', onScroll, { passive: true });
    computeActive();
  };

  const goToSection = (name: string): void => {
    const el = headerRefs.value[name];
    const scroller = scrollContainer.value;

    if (el && scroller) {
      scroller.scrollTo({
        top: el.offsetTop - 80, // account for sticky header
        behavior: 'smooth',
      });
      activeSection.value = name;

      if (ui.mobile) {
        ui.sidebarOpen = false;
      }
    }
  };

  onScopeDispose(teardown);

  return {
    activeSection,
    updateActiveSection,
    goToSection,
  };
}
