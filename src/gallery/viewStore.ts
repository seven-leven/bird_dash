import { computed, nextTick, readonly, type Ref, ref } from 'vue';
import { defineInjection } from '../browser/defineInjection.ts';
import { useCollectionView } from './useCollectionView.ts';
import { useScrollSpy } from './useScrollSpy.ts';
import type { Item, View } from '../types/index.ts';

/**
 * How the gallery shows the collection on screen: by group or by month, drawn only or not,
 * the planned list of a collection with nothing drawn; the sections and counts that come of
 * it; and the scroll-spy that marks the section in view. The sections hand over their heading
 * elements with `registerHeader`, a template function ref.
 */
export function createViewStore(deps: {
  /** The items of the collection on screen. */
  items: Ref<Item[]>;
  /** The search query, debounced. */
  query: Ref<string>;
  /** From the layout store: where the content scrolls, and the narrow sidebar to close. */
  scrollEl: Readonly<Ref<HTMLElement | null>>;
  isNarrow: Readonly<Ref<boolean>>;
  closeSidebar: () => void;
}) {
  const viewMode = ref<View>('group');
  // Family view: show only what has been drawn (docs/DESIGN.md §11, a collection that is mostly gaps).
  const drawnOnly = ref(false);
  // A collection with nothing drawn says so instead of listing its gaps; asked, it lists
  // what is planned, until another collection is chosen.
  const showPlanned = ref(false);

  const { activeData, stats, searchedDrawnItems } = useCollectionView(
    deps.items,
    deps.query,
    viewMode,
    drawnOnly,
  );

  const headerRefs = ref<Record<string, HTMLElement | null>>({});
  const { activeSection, updateActiveSection, goToSection } = useScrollSpy(
    deps.scrollEl,
    headerRefs,
    { isNarrow: deps.isNarrow, closeSidebar: deps.closeSidebar },
  );
  const registerHeader = (name: string, el: unknown): void => {
    if (el) headerRefs.value[name] = el as HTMLElement;
    else delete headerRefs.value[name]; // unmounted: don't let the spy measure a detached node
  };
  /** Forget every heading (before another collection's sections mount). */
  const resetHeaders = (): void => {
    headerRefs.value = {};
  };

  const setViewMode = (mode: View): void => {
    if (mode === viewMode.value) return;
    viewMode.value = mode;
    nextTick(updateActiveSection); // the section headers are different in each view
  };
  const setDrawnOnly = (only: boolean): void => {
    if (only === drawnOnly.value) return;
    drawnOnly.value = only;
    nextTick(updateActiveSection); // the set of sections changes
  };
  /** The drawn filter is offered where it filters something: the family view, part drawn. */
  const showsDrawnFilter = computed(() =>
    viewMode.value === 'group' && stats.value.drawn > 0 &&
    stats.value.drawn < deps.items.value.length
  );

  /** Make the grid show what is not drawn yet: the family view, every item, the planned list. */
  const showUndrawn = (): void => {
    showPlanned.value = true;
    setDrawnOnly(false);
    setViewMode('group');
  };
  const hidePlanned = (): void => {
    showPlanned.value = false;
  };

  return {
    viewMode: readonly(viewMode),
    drawnOnly: readonly(drawnOnly),
    showPlanned: readonly(showPlanned),
    showsDrawnFilter,
    activeData,
    counts: stats,
    /** The drawings shown, in time order: what the viewer pages through. */
    drawnItems: searchedDrawnItems,
    activeSection,
    setViewMode,
    setDrawnOnly,
    showUndrawn,
    hidePlanned,
    registerHeader,
    resetHeaders,
    goToSection,
    updateActiveSection,
  };
}

export type ViewStore = ReturnType<typeof createViewStore>;
export const [provideViewStore, useViewStore] = defineInjection<ViewStore>('view');
