<!-- app/AppShell.vue: the frame. It places each feature: the top bar with the search box and
     the view switch in it, the sidebar, the gallery or a page with the footer after it, and the
     viewer over them. It is the one component that reads every store: what a feature needs of
     another's (the collections in the top bar, the query in the grid, a tile opening the viewer)
     it hands over here, as props and events, so each feature injects only its own. -->
<template>
  <div class="flex flex-col h-screen w-full overflow-hidden bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">

    <TopBar :collections="collections" :active="activeCollection" @select="selectCollection">
      <template #search><SearchBox @select="selectGlobalResult" /></template>
      <template #view><ViewSwitch /></template>
    </TopBar>

    <!-- Body -->
    <div class="flex flex-1 overflow-hidden">

      <!-- Mobile overlay -->
      <div
        v-if="isNarrow && page === 'gallery'"
        class="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity"
        :class="sidebarOpen ? 'opacity-100 visible' : 'opacity-0 invisible'"
        @click="closeSidebar()"
        aria-hidden="true"
      />

      <!-- Only the gallery has sections to list. -->
      <SideNav v-if="page === 'gallery'" :query="query" />

      <!-- Main content -->
      <main class="relative flex flex-1 flex-col overflow-hidden">

        <!-- Active search filter. The section in view is named by its own sticky
             heading (Gallery), so this bar only appears while searching. While the results
             are open over it, it keeps its place but is not drawn: their ✕ is the search's. -->
        <div
          v-if="page === 'gallery' && !loadState.loading && !loadState.error && query"
          :class="dropdownOpen && 'invisible'"
          class="shrink-0 flex items-center gap-3 px-6 py-1.5 border-b text-xs font-medium tracking-wide transition-colors
                 bg-white/95 border-slate-100 text-slate-500
                 dark:bg-slate-950/95 dark:border-slate-800/60 dark:text-slate-400"
        >
          <button
            v-if="query"
            @click="clear()"
            class="focus-ring ml-auto flex items-center gap-1.5 rounded-full py-0.5 pl-2.5 pr-1.5 text-xs font-medium
                   bg-accent-50 text-accent-700 hover:bg-accent-100
                   dark:bg-accent-950/60 dark:text-accent-300 dark:hover:bg-accent-900/60
                   transition-colors duration-fast"
            :aria-label="`Clear filter ${query}`"
          >
            <span class="max-w-48 truncate tabular-nums">{{ viewMode === 'group' ? matchesDrawn(counts.filtered, counts.filteredDrawn) : matches(counts.filtered) }} for &ldquo;{{ query }}&rdquo;</span>
            <Icon name="close" class="size-3" />
          </button>
        </div>

        <!-- Scrollable grid (scroll-spy is driven by an IntersectionObserver) -->
        <div
          :ref="bindScrollEl"
          class="flex-1 overflow-y-auto p-4 sm:p-6 scroll-smooth custom-scrollbar"
        >
          <component :is="currentPage.component" v-if="currentPage"><AppFooter :build="buildInfo" /></component>
          <Gallery v-else :query="query" @clear-query="clear()" @open="open">
            <AppFooter :build="buildInfo" />
          </Gallery>
        </div>

      </main>
    </div>

    <!-- Expanded image overlay -->
    <Viewer
      v-if="activeCollection"
      :is-open="isOpen"
      :item="item"
      :drawn-items="drawnItems"
      :full-image-base-url="activeCollection.fullImageBase"
      :collection="activeCollection"
      :query="query"
      @close="close()"
      @update:item="show($event)"
      @go-to-group="showGroup"
    />

  </div>
</template>

<script setup lang="ts">
import { defineAsyncComponent, nextTick, watch } from 'vue';
import TopBar from '../shell/TopBar.vue';
import SideNav from '../shell/SideNav.vue';
import AppFooter from '../shell/AppFooter.vue';
import SearchBox from '../search/SearchBox.vue';
import Gallery from '../gallery/Gallery.vue';
import ViewSwitch from '../gallery/ViewSwitch.vue';
import Icon from '../ui/Icon.vue';
import { useCollectionsStore } from '../gallery/collectionsStore.ts';
import { useViewStore } from '../gallery/viewStore.ts';
import { useSearchStore } from '../search/searchStore.ts';
import { useLayoutStore } from '../shell/layoutStore.ts';
import { useViewerStore } from '../viewer/viewerStore.ts';
import { matches, matchesDrawn } from '../domain/countWords.ts';
import { buildInfo } from './buildInfo.ts';
import { useActions } from './actions.ts';

// Code-split the viewer: its zoom/pan/drag/keyboard machinery (and ViewerDetails)
// are only needed after the first tile click, so keep them out of first paint.
const Viewer = defineAsyncComponent(() => import('../viewer/Viewer.vue'));

const { collections, loadState, activeCollection } = useCollectionsStore();
const { counts, viewMode, setViewMode, goToSection, updateActiveSection } = useViewStore();
const { query, dropdownOpen, clear } = useSearchStore();
// The scroll container is handed to the layout store (for the scroll-spy) as a function ref.
const { isNarrow, sidebarOpen, page, currentPage, bindScrollEl, closeSidebar, scrollToTop } =
  useLayoutStore();
const { isOpen, item, drawnItems, open, close, show } = useViewerStore();
const { selectCollection, selectGlobalResult } = useActions();

// Each page opens at its top; back in the gallery, its sections have just mounted again,
// so the scroll-spy measures them afresh.
watch(page, async (now) => {
  scrollToTop();
  if (now === 'gallery') {
    await nextTick();
    updateActiveSection();
  }
});

// "Ducks, Geese, and Swans" in the viewer: close it and show that group in the grid,
// switching to the family view first if the month view is showing.
async function showGroup(group: string): Promise<void> {
  close();
  setViewMode('group');
  await nextTick();
  await nextTick(); // the family view's sections mount, then register
  goToSection(group);
}
</script>
