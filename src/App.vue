<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, toRefs, useTemplateRef, watch } from 'vue';

import Chrome from './components/layout/Chrome.vue';
import type { GlobalSearchState } from './types/';

import {
  provideAppContext,
  useBreakpoints,
  useCollectionData,
  useCollections,
  useDebouncedRef,
  useGlobalSearch,
  useOverlay,
  useScrollLogic,
  useTheme,
} from './composables';

// =============================================================================
// STATE & CORE LOGIC
// =============================================================================
const uiRef = useTemplateRef<
  { scrollContainer: HTMLElement | null; headerRefs: Record<string, HTMLElement | null> }
>('uiRef');
const search = reactive({ query: '' });
const { query } = toRefs(search);

const { theme, toggleTheme } = useTheme();
const { isMobile } = useBreakpoints(1024);
const { expandedImage, openOverlay, closeOverlay, updateOverlayItem } = useOverlay();

const ui = reactive({
  sidebarOpen: false,
  mobile: isMobile,
  client: false,
  viewMode: 'group' as 'group' | 'date',
});

const {
  isInitialized,
  activeCollection,
  globalStats,
  data,
  COLLECTIONS,
  collectionCache,
  init,
  switchCollection,
} = useCollections();

const { items } = toRefs(data);
const { viewMode } = toRefs(ui);
// Debounce the query feeding the heavy filter → group → sort pipeline so a burst
// of keystrokes recomputes once, not once per character. The input stays
// instant because it binds to the raw query.
const debouncedQuery = useDebouncedRef(query, 120);
const { activeData, stats, searchedDrawnItems } = useCollectionData(items, debouncedQuery, viewMode);

const activeDataWithStats = computed(() => ({ ...activeData.value, stats: stats.value }));
const { activeSection, updateActiveSection, goToSection, handleHash } = useScrollLogic(uiRef, ui);

// =============================================================================
// GLOBAL SEARCH
// =============================================================================
const globalSearchState = ref<GlobalSearchState>({
  query: '',
  isOpen: false,
});

const globalQuery = computed(() => globalSearchState.value.query);
const { globalResults, globalResultCount } = useGlobalSearch(
  COLLECTIONS,
  collectionCache,
  useDebouncedRef(globalQuery, 120),
);

function handleUpdateGlobalSearch(q: string) {
  globalSearchState.value.query = q;
  // Also keep the per-collection search in sync so the grid filters too
  search.query = q;
  if (q.trim()) {
    globalSearchState.value.isOpen = true;
  }
}

/**
 * User clicked / keyboard-selected a global search result.
 * 1. Switch to the correct collection (if needed)
 * 2. Close the dropdown
 * 3. Scroll the item into view via its DOM id
 */
async function handleSelectGlobalResult(collectionId: string, itemId: string) {
  globalSearchState.value.isOpen = false;

  // Switch collection first (no-op if already active)
  if (collectionId !== activeCollection.value?.id) {
    await handleSwitchCollection(collectionId);
  }

  // Wait a tick for the grid to render, then scroll to item
  await nextTick();
  const el = document.getElementById(`item-${itemId}`);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    // Brief highlight flash
    el.classList.add('ring-2', 'ring-accent-500', 'ring-offset-2');
    setTimeout(() => el.classList.remove('ring-2', 'ring-accent-500', 'ring-offset-2'), 1800);
  }
}

// =============================================================================
// ACTIONS
// =============================================================================
async function handleSwitchCollection(id: string) {
  search.query = '';
  globalSearchState.value.query = '';
  if (uiRef.value?.headerRefs) uiRef.value.headerRefs = {};

  await switchCollection(id, () => {
    if (uiRef.value?.scrollContainer) uiRef.value.scrollContainer.scrollTop = 0;
    updateActiveSection();
    handleHash();
  });
}

const toggleViewMode = () => {
  ui.viewMode = ui.viewMode === 'group' ? 'date' : 'group';
  nextTick(updateActiveSection);
};

// =============================================================================
// APP CONTEXT — everything the chrome components need, in one place
// =============================================================================
provideAppContext({
  collections: COLLECTIONS,
  activeCollection,
  globalStats,
  data,
  activeData: activeDataWithStats,

  ui,
  theme,
  activeSection,
  search,

  globalSearch: globalSearchState,
  globalResults,
  globalResultCount,

  expandedImage,
  drawnItems: searchedDrawnItems,

  switchCollection: handleSwitchCollection,
  toggleSidebar: () => ui.sidebarOpen = !ui.sidebarOpen,
  closeSidebar: () => ui.sidebarOpen = false,
  toggleTheme,
  toggleViewMode,
  goToSection,
  onScroll: updateActiveSection,
  openItem: openOverlay,
  closeOverlay,
  updateOverlayItem,
  updateSearch: (q: string) => search.query = q,
  updateGlobalSearch: handleUpdateGlobalSearch,
  openGlobalSearchDropdown: () => globalSearchState.value.isOpen = true,
  closeGlobalSearchDropdown: () => globalSearchState.value.isOpen = false,
  selectGlobalResult: handleSelectGlobalResult,
});

// =============================================================================
// LIFECYCLE
// =============================================================================
onMounted(async () => {
  ui.client = true;
  window.addEventListener('hashchange', handleHash);
  await init();
});

// Sync UI markers when data updates
watch(() => data.items, () => {
  nextTick(() => {
    updateActiveSection();
    handleHash();
  });
});
</script>

<template>
  <Chrome v-if="isInitialized" ref="uiRef" />

  <div
    v-else
    class="flex flex-col items-center justify-center gap-3 min-h-screen bg-slate-50 dark:bg-slate-950"
  >
    <div class="w-8 h-8 border-2 border-slate-200 border-t-accent-500 rounded-full animate-spin dark:border-slate-800 dark:border-t-accent-500" />
    <p class="text-xs font-medium text-slate-500 dark:text-slate-400">Loading collections…</p>
  </div>
</template>
