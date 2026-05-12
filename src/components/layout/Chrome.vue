<template>
  <div class="flex flex-col h-screen w-full overflow-hidden bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">

    <!-- Header -->
    <AppHeader
      :collections="collections"
      :active-collection="activeCollection"
      :ui="ui"
      :theme="theme"
      :data="data"
      :global-stats="globalStats"
      :search="search"
      :global-search-state="globalSearchState"
      :global-results="globalResults"
      :global-result-count="globalResultCount"
      @toggle-sidebar="$emit('toggleSidebar')"
      @switch-collection="$emit('switchCollection', $event)"
      @update-search="$emit('updateSearch', $event)"
      @update-global-search="$emit('updateGlobalSearch', $event)"
      @open-global-search-dropdown="$emit('openGlobalSearchDropdown')"
      @close-global-search-dropdown="$emit('closeGlobalSearchDropdown')"
      @select-global-result="$emit('selectGlobalResult', $event[0], $event[1])"
      @toggle-view-mode="$emit('toggleViewMode')"
      @toggle-theme="$emit('toggleTheme')"
    />

    <!-- Body -->
    <div class="flex flex-1 overflow-hidden">

      <!-- Mobile overlay -->
      <div
        v-if="ui.client && ui.mobile"
        class="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity"
        :class="ui.sidebarOpen ? 'opacity-100 visible' : 'opacity-0 invisible'"
        @click="$emit('closeSidebar')"
        aria-hidden="true"
      />

      <!-- Sidebar -->
      <AppSidebar
        :active-collection="activeCollection"
        :active-section="activeSection"
        :ui="ui"
        :data="data"
        :active-data="activeData"
        @go-to-section="$emit('goToSection', $event)"
      />

      <!-- Main content -->
      <main class="relative flex flex-1 flex-col overflow-hidden">

        <!-- Active section label -->
        <div
          v-if="!data.loading && !data.error && activeSection"
          class="shrink-0 px-6 py-1.5 border-b text-xs font-medium tracking-wide transition-colors
                 bg-white/95 border-slate-100 text-slate-400
                 dark:bg-slate-950/95 dark:border-slate-800/60 dark:text-slate-500"
        >
          {{ activeSection }}
        </div>

        <!-- Scrollable grid -->
        <div
          ref="scrollContainer"
          class="flex-1 overflow-y-auto p-6 scroll-smooth custom-scrollbar"
          @scroll="$emit('scroll')"
        >
          <!-- Loading skeleton -->
          <div v-if="data.loading" class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
            <div v-for="n in 10" :key="n"
                 class="aspect-square rounded-2xl animate-pulse bg-slate-200 dark:bg-slate-800" />
          </div>

          <!-- Error -->
          <div v-else-if="data.error"
               class="mx-auto mt-10 max-w-lg rounded-xl border p-6 text-center
                      bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800">
            <h2 class="mb-2 text-lg font-bold text-red-700 dark:text-red-400">Error Loading Data</h2>
            <p class="text-red-600 dark:text-red-300">{{ data.error }}</p>
          </div>

          <!-- Empty -->
          <div v-else-if="Object.keys(activeData.grouped).length === 0" class="mt-20 text-center text-slate-500">
            <h2 class="text-xl font-semibold">No drawings found</h2>
            <p class="mt-2">{{ search.query ? 'Try a different search term.' : 'Check back later for new illustrations.' }}</p>
          </div>

          <template v-else>
            <!-- Search info -->
            <div v-if="search.query" class="mb-6 text-xs text-slate-400 dark:text-slate-500">
              {{ activeData.stats?.filtered ?? 0 }} result{{ (activeData.stats?.filtered ?? 0) !== 1 ? 's' : '' }} for
              <span class="font-medium text-slate-600 dark:text-slate-300">"{{ search.query }}"</span>
              <button @click="$emit('updateSearch', '')" class="ml-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 underline underline-offset-2">Clear</button>
            </div>

            <!-- Grouped sections -->
            <section
              v-for="(items, groupName) in activeData.grouped"
              :key="groupName"
              class="mb-12 scroll-mt-10"
            >
              <h2
                :ref="el => { if (el) headerRefs[String(groupName)] = el as HTMLElement }"
                class="mb-5 pb-2 text-base font-semibold flex items-center justify-between transition-colors border-b
                       text-slate-800 border-slate-200/70 dark:text-slate-100 dark:border-slate-800/70"
              >
                <span>{{ groupName }}</span>
                <span class="text-xs font-normal tabular-nums text-slate-400 dark:text-slate-500">
                  {{ items.filter(i => i.imageUrl !== placeholderImage).length }} drawn
                  <template v-if="ui.viewMode === 'group'"> / {{ items.length }}</template>
                </span>
              </h2>

              <div class="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-6 sm:grid-cols-[repeat(auto-fill,minmax(200px,1fr))]">
                <GridItemCard
                  v-for="item in items"
                  :key="item.id"
                  :item="item"
                  :placeholder-image="placeholderImage"
                  @card-click="$emit('cardClick', $event)"
                />
              </div>
            </section>
          </template>

          <footer class="mt-16 pt-6 pb-8 border-t text-center text-xs transition-colors
                         border-slate-100 text-slate-300 dark:border-slate-800/50 dark:text-slate-600">
            <p>Wildlife Illustrated &copy; {{ new Date().getFullYear() }} &middot; v{{ appVersion }}</p>
          </footer>
        </div>
      </main>
    </div>

    <!-- Expanded image overlay -->
    <ExpandedImage
      v-if="activeCollection"
      :is-open="expandedImage.isOpen"
      :item="expandedImage.item"
      :drawn-items="drawnItems"
      :full-image-base-url="activeCollection.fullImageBase"
      :collection="activeCollection"
      @close="$emit('closeOverlay')"
      @update:item="$emit('updateOverlayItem', $event)"
    />

  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import AppHeader from './TopBar.vue';
import AppSidebar from './SideNav.vue';
import GridItemCard from '../gallery/ItemTile.vue';
import ExpandedImage from '../gallery/LightBox.vue';
import type {
  CollectionConfig, 
  CollectionItem,
  UIState,
  ThemeState,
  DataState,
  SearchState,
  GlobalStats,
  ActiveData,
  ExpandedImageState,
  GlobalSearchCollectionGroup, 
  GlobalSearchState } from '../../types';
import versionData from '../../version.json';

const displayVersion = `${versionData.major}.${versionData.minor}.${versionData.patch}`;
const appVersion     = `${displayVersion}+${versionData.count}`;

// ---------------------------------------------------------------------------
// PROPS
// ---------------------------------------------------------------------------
const props = defineProps<{
  collections:       CollectionConfig[];
  activeCollection:  CollectionConfig | undefined;
  globalStats:       GlobalStats;
  ui:                UIState;
  theme:             ThemeState;
  data:              DataState;
  activeData:        ActiveData<CollectionItem>;
  activeSection?:    string;
  search:            SearchState;
  // Global search
  globalSearchState: GlobalSearchState;
  globalResults:     GlobalSearchCollectionGroup[];
  globalResultCount: number;
  expandedImage:     ExpandedImageState<CollectionItem>;
  drawnItems:        CollectionItem[];
}>();

// ---------------------------------------------------------------------------
// EMITS
// ---------------------------------------------------------------------------
defineEmits<{
  switchCollection:         [id: string];
  closeSidebar:             [];
  toggleSidebar:            [];
  toggleTheme:              [];
  toggleViewMode:           [];
  goToSection:              [id: string];
  scroll:                   [];
  cardClick:                [item: CollectionItem];
  updateSearch:             [query: string];
  // Global search
  updateGlobalSearch:       [query: string];
  openGlobalSearchDropdown: [];
  closeGlobalSearchDropdown:[];
  selectGlobalResult:       [collectionId: string, itemId: string];
  closeOverlay:             [];
  updateOverlayItem:        [item: CollectionItem];
}>();

// ---------------------------------------------------------------------------
// COMPUTED
// ---------------------------------------------------------------------------
const placeholderImage = computed(() =>
  props.activeCollection ? `${props.activeCollection.id}-placeholder` : ''
);

// ---------------------------------------------------------------------------
// REFS (exposed for useScrollLogic in App.vue)
// ---------------------------------------------------------------------------
const scrollContainer = ref<HTMLElement | null>(null);
const headerRefs      = ref<Record<string, HTMLElement>>({});

defineExpose({ scrollContainer, headerRefs });
</script>