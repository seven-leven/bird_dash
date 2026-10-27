<!-- components/layout/Chrome.vue — top-level layout shell.
     State comes from the domain stores; the only wiring left here is the
     LightBox overlay (props-based so it stays reusable). -->
<template>
  <div class="flex flex-col h-screen w-full overflow-hidden bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">

    <TopBar />

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
      <SideNav v-if="page === 'gallery'" />

      <!-- Main content -->
      <main class="relative flex flex-1 flex-col overflow-hidden">

        <!-- Active search filter. The section in view is named by its own sticky
             heading (GalleryContent), so this bar only appears while searching. -->
        <div
          v-if="page === 'gallery' && !loadState.loading && !loadState.error && query"
          class="shrink-0 flex items-center gap-3 px-6 py-1.5 border-b text-xs font-medium tracking-wide transition-colors
                 bg-white/95 border-slate-100 text-slate-500
                 dark:bg-slate-950/95 dark:border-slate-800/60 dark:text-slate-400"
        >
          <button
            v-if="query"
            @click="clear()"
            class="focus-ring ml-auto flex items-center gap-1.5 rounded-full py-0.5 pl-2.5 pr-1.5 text-micro font-medium
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
          <component :is="currentPage.component" v-if="currentPage" />
          <GalleryContent v-else />
        </div>

      </main>
    </div>

    <!-- Expanded image overlay -->
    <LightBox
      v-if="activeCollection"
      :is-open="isOpen"
      :item="item"
      :drawn-items="drawnItems"
      :full-image-base-url="activeCollection.fullImageBase"
      :collection="activeCollection"
      @close="close()"
      @update:item="show($event)"
      @go-to-group="showGroup"
    />

  </div>
</template>

<script setup lang="ts">
import { defineAsyncComponent, nextTick, watch } from 'vue';
import TopBar from './TopBar.vue';
import SideNav from './SideNav.vue';
import GalleryContent from '../gallery/GalleryContent.vue';
import Icon from '../icons/Icon.vue';
import { useCollectionsStore } from '../../gallery/collectionsStore.ts';
import { useViewStore } from '../../gallery/viewStore.ts';
import { useSearchStore } from '../../search/searchStore.ts';
import { useLayoutStore } from '../../shell/layoutStore.ts';
import { useViewerStore } from '../../viewer/viewerStore.ts';
import { matches, matchesDrawn } from '../../domain/countWords.ts';

// Code-split the viewer: its zoom/pan/drag/keyboard machinery (and ItemSheet)
// are only needed after the first tile click, so keep them out of first paint.
const LightBox = defineAsyncComponent(() => import('../gallery/LightBox.vue'));

const { loadState, activeCollection } = useCollectionsStore();
const { counts, viewMode, setViewMode, goToSection, updateActiveSection } = useViewStore();
const { query, clear } = useSearchStore();
// The scroll container is handed to the layout store (for the scroll-spy) as a function ref.
const { isNarrow, sidebarOpen, page, currentPage, bindScrollEl, closeSidebar, scrollToTop } =
  useLayoutStore();
const { isOpen, item, drawnItems, close, show } = useViewerStore();

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
