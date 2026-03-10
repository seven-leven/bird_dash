<script setup lang="ts">
/// <reference types="vite/client" />
import { ref, reactive, computed, onMounted, watch, nextTick, toRefs } from 'vue';
import UI from './components/UI.vue';
import { useScrollLogic } from './composables/useScrollLogic';
import { useCollectionData } from './composables/useCollectionData';
import { useCollections } from './composables/useCollections';
import { type CollectionItem } from './types/collections';

// =============================================================================
// STATE
// =============================================================================
const uiRef = ref<any>(null);


  
const search = reactive({ query: '' });
const ui = reactive({
  sidebarOpen: false,
  mobile:      false,
  client:      false,
  viewMode:    'group' as 'group' | 'date',
});
const theme = reactive({ isDark: false });
const expandedImage = reactive({
  isOpen: false,
  item:   undefined as CollectionItem | undefined,
});

// =============================================================================
// COMPOSABLES
// =============================================================================
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
const { query } = toRefs(search);
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

const openOverlay = (item: CollectionItem) => {
  if (item.imageUrl === item.placeholderUrl) return;
  expandedImage.item = item;
  expandedImage.isOpen = true;
};

// =============================================================================
// LIFECYCLE
// =============================================================================
onMounted(async () => {
  ui.client = true;
  ui.mobile = window.innerWidth < 1024;
  window.addEventListener('resize', () => { ui.mobile = window.innerWidth < 1024; });
  window.addEventListener('hashchange', handleHash);

  await init();

  theme.isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
});

watch(() => data.items, () => {
  nextTick(() => {
    updateActiveSection();
    handleHash();
  });
});

watch(() => theme.isDark, (val) => document.documentElement.classList.toggle('dark', val), { immediate: true });
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
      @toggle-theme="theme.isDark = !theme.isDark"
      @toggle-view-mode="toggleViewMode"
      @go-to-section="goToSection"
      @scroll="updateActiveSection"
      @card-click="openOverlay"
      @update-search="search.query = $event"
      @close-overlay="expandedImage.isOpen = false"
      @update-overlay-item="expandedImage.item = $event"
    />
  </div>
  <div v-else class="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
    <p class="text-slate-500 animate-pulse font-medium">Loading Experience...</p>
  </div>
</template>