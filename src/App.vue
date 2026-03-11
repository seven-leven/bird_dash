<script setup lang="ts">
/// <reference types="vite/client" />
import { ref, reactive, computed, onMounted, watch, nextTick, toRefs } from 'vue';

// Components & Types
import UI from './components/layout/Chrome.vue';
import { type CollectionItem } from './types/collections';

// Consolidated Composables Import
import { 
  useCollections, 
  useCollectionData, 
  useScrollLogic, 
  useBreakpoints, 
  useOverlay,
  useGlobalSearch, 
} from './composables'; 
import { type GlobalSearchState  } from './types/composables';
import   {useTheme} from './composables/core/useTheme.ts'

// =============================================================================
// STATE & CORE LOGIC
// =============================================================================
const uiRef = ref<any>(null);
const search = reactive({ query: '' });
const { query } = toRefs(search);

// Initialize Logic
const { theme, toggleTheme } = useTheme();
const { isMobile } = useBreakpoints(1024);
const { expandedImage, openOverlay, closeOverlay, updateOverlayItem } = useOverlay();

const ui = reactive({
  sidebarOpen: false,
  mobile:      isMobile,
  client:      false,
  viewMode:    'group' as 'group' | 'date',
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
const { activeData, stats, searchedDrawnItems } = useCollectionData(items, query, viewMode);

const activeDataWithStats = computed(() => ({ ...activeData.value, stats: stats.value }));
const { activeSection, updateActiveSection, goToSection, handleHash } = useScrollLogic(uiRef, ui);

// =============================================================================
// GLOBAL SEARCH
// =============================================================================
const globalSearchState = ref<GlobalSearchState>({
  query:  '',
  isOpen: false,
});

const {
  globalResults,
  globalResultCount,
} = useGlobalSearch(COLLECTIONS, collectionCache, globalSearchState);

function handleUpdateGlobalSearch(q: string) {
  globalSearchState.value.query = q;
  // Also keep the per-collection search in sync so the grid filters too
  search.query = q;
  if (q.trim()) {
    globalSearchState.value.isOpen = true;
  }
}

function handleOpenGlobalSearchDropdown() {
  globalSearchState.value.isOpen = true;
}

function handleCloseGlobalSearchDropdown() {
  globalSearchState.value.isOpen = false;
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
    el.classList.add('ring-2', 'ring-blue-500', 'ring-offset-2');
    setTimeout(() => el.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-2'), 1800);
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
  <div v-if="isInitialized">
    <UI
      ref="uiRef"
      :collections="COLLECTIONS"
      :active-collection="activeCollection"
      :global-stats="globalStats"
      :ui="ui"
      :theme="theme"
      :data="data"
      :active-data="activeDataWithStats"
      :active-section="activeSection"
      :search="search"
      :global-search-state="globalSearchState"
      :global-results="globalResults"
      :global-result-count="globalResultCount"
      :expanded-image="expandedImage"
      :drawn-items="searchedDrawnItems"
      
      @switch-collection="handleSwitchCollection"
      @close-sidebar="ui.sidebarOpen = false"
      @toggle-sidebar="ui.sidebarOpen = !ui.sidebarOpen"
      @toggle-theme="toggleTheme"
      @toggle-view-mode="toggleViewMode"
      @go-to-section="goToSection"
      @scroll="updateActiveSection"
      @card-click="openOverlay"
      @update-search="search.query = $event"
      @update-global-search="handleUpdateGlobalSearch"
      @open-global-search-dropdown="handleOpenGlobalSearchDropdown"
      @close-global-search-dropdown="handleCloseGlobalSearchDropdown"
      @select-global-result="handleSelectGlobalResult"
      @close-overlay="closeOverlay"
      @update-overlay-item="updateOverlayItem"
    />
  </div>
  
  <div v-else class="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
    <p class="text-slate-500 animate-pulse font-medium">Loading Experience…</p>
  </div>
</template>