<!-- components/layout/chrome.vue -->
<template>
  <div class="flex flex-col h-screen w-full overflow-hidden bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">

    <!-- Header -->
    <AppHeader
      :collections="collections"
      :active-collection="activeCollection"
      :ui="ui"
      :theme="theme"
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
        :global-stats="globalStats"
        @go-to-section="$emit('goToSection', $event)"
      />

      <!-- Main content -->
      <main class="relative flex flex-1 flex-col overflow-hidden">

        <!-- Active section label + active filter chip -->
        <div
          v-if="!data.loading && !data.error && (activeSection || search.query)"
          class="shrink-0 flex items-center gap-3 px-6 py-1.5 border-b text-xs font-medium tracking-wide transition-colors
                 bg-white/95 border-slate-100 text-slate-400
                 dark:bg-slate-950/95 dark:border-slate-800/60 dark:text-slate-500"
        >
          <span class="truncate">{{ activeSection }}</span>
          <button
            v-if="search.query"
            @click="$emit('updateSearch', '')"
            class="focus-ring ml-auto flex items-center gap-1.5 rounded-full py-0.5 pl-2.5 pr-1.5 text-[11px] font-medium
                   bg-accent-50 text-accent-700 hover:bg-accent-100
                   dark:bg-accent-950/60 dark:text-accent-300 dark:hover:bg-accent-900/60
                   transition-colors duration-150"
            :aria-label="`Clear filter ${search.query}`"
          >
            <span class="tabular-nums">{{ activeData.stats?.filtered ?? 0 }}</span>
            <span class="max-w-40 truncate">result{{ (activeData.stats?.filtered ?? 0) !== 1 ? 's' : '' }} for &ldquo;{{ search.query }}&rdquo;</span>
            <IconClose class="w-3 h-3" />
          </button>
        </div>

        <!-- Scrollable grid -->
        <div
          ref="scrollContainer"
          class="flex-1 overflow-y-auto p-6 scroll-smooth custom-scrollbar"
          @scroll="$emit('scroll')"
        >
          <GalleryContent
            ref="galleryContentRef"
            :data="data"
            :active-data="activeData"
            :search="search"
            :active-collection="activeCollection"
            :ui="{ viewMode: ui.viewMode }"
            :app-version="appVersion"
            @card-click="$emit('cardClick', $event)"
          />
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
import IconClose from '../icons/IconClose.vue';
import GalleryContent from './GalleryContent.vue';
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
  GlobalSearchState 
} from '../../types';
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
  updateGlobalSearch:       [query: string];
  openGlobalSearchDropdown: [];
  closeGlobalSearchDropdown:[];
  selectGlobalResult:       [collectionId: string, itemId: string];
  closeOverlay:             [];
  updateOverlayItem:        [item: CollectionItem];
}>();

// ---------------------------------------------------------------------------
// REFS
// ---------------------------------------------------------------------------
const scrollContainer = ref<HTMLElement | null>(null);
const galleryContentRef = ref<InstanceType<typeof GalleryContent> | null>(null);

// ---------------------------------------------------------------------------
// EXPOSED FOR PARENT (App.vue scroll-spy logic)
// ---------------------------------------------------------------------------
defineExpose({
  scrollContainer,
  // Proxy headerRefs from child component with explicit typing
  headerRefs: computed((): Record<string, HTMLElement> => 
    galleryContentRef.value?.headerRefs ?? {}
  )
});
</script>