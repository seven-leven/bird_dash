<script setup lang="ts">
/// <reference types="vite/client" />
import { ref, reactive, computed, onMounted, watch, nextTick, toRefs } from 'vue';

// Components & Types
import UI from './components/Chrome.vue';
import { type CollectionItem } from './types/collections';

// Consolidated Composables Import
import { 
  useCollections, 
  useCollectionData, 
  useScrollLogic, 
  useTheme, 
  useBreakpoints, 
  useOverlay 
} from './composables'; 

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
  init,
  switchCollection,
} = useCollections();

const { items } = toRefs(data);
const { viewMode } = toRefs(ui);
const { activeData, stats, searchedDrawnItems } = useCollectionData(items, query, viewMode);

const activeDataWithStats = computed(() => ({ ...activeData.value, stats: stats.value }));
const { activeSection, updateActiveSection, goToSection, handleHash } = useScrollLogic(uiRef, ui);

// =============================================================================
// ACTIONS
// =============================================================================
async function handleSwitchCollection(id: string) {
  search.query = '';
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
      @close-overlay="closeOverlay"
      @update-overlay-item="updateOverlayItem"
    />
  </div>
  
  <div v-else class="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
    <p class="text-slate-500 animate-pulse font-medium">Loading Experience...</p>
  </div>
</template>