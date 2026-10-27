<!-- components/gallery/Gallery.vue -->
<template>
  <div class="space-y-12">
    <!-- Loading: tiles shaped like the real ones (image and caption), so nothing jumps -->
    <div
      v-if="loadState.loading"
      class="tile-grid"
      aria-busy="true"
    >
      <div
        v-for="n in 10"
        :key="n"
        class="rounded-card overflow-hidden animate-pulse bg-slate-200 dark:bg-slate-800"
      >
        <div class="aspect-square" />
        <div class="h-14" />
      </div>
    </div>

    <!-- Failed to load: name what failed, and offer to try again -->
    <EmptyState
      v-else-if="loadState.error"
      class="mt-10"
      :title="`Couldn't load ${activeCollection?.label ?? 'this collection'}`"
      :hint="loadState.error"
    >
      <template #icon>
        <Icon name="close" class="size-6" />
      </template>
      <RetryButton @retry="reloadPage()" />
    </EmptyState>

    <!-- A search that matches nothing -->
    <EmptyState
      v-else-if="isEmpty && query"
      class="mt-10"
      :title="`No matches for '${query}'`"
    >
      <template #icon>
        <Icon name="noResults" class="size-6" />
      </template>
      <button class="btn-ghost focus-ring mt-2 px-3 py-1.5 text-sm font-medium" @click="clear()">
        Clear search
      </button>
    </EmptyState>

    <!-- Nothing drawn yet: say so instead of a wall of identical icons -->
    <EmptyState
      v-else-if="nothingDrawn"
      class="mt-10"
      title="Nothing drawn yet"
      :hint="plannedLabel"
    >
      <template #icon>
        <CollectionIcon v-if="activeCollection" :collection="activeCollection" class="size-6" />
      </template>
      <button
        v-if="viewMode === 'group'"
        class="btn-ghost focus-ring mt-2 px-3 py-1.5 text-sm font-medium"
        @click="showUndrawn()"
      >
        Show what's planned
      </button>
    </EmptyState>

    <!-- Main Content -->
    <template v-else>
      <!-- The collection's count, which is also the filter while there are gaps. From lg it
           sits under the collection's name in the sidebar; below it the sidebar is a
           drawer, so it is here. -->
      <div v-if="counts.drawn > 0" class="lg:hidden flex items-center min-h-9 -mt-1 mb-6">
        <DrawnFilter
          v-if="showsDrawnFilter"
          class="-ml-2.5"
          :drawn="counts.drawn"
          :total="loadState.items.length"
          :drawn-only="drawnOnly"
          @choose="setDrawnOnly"
        />
        <p v-else class="text-sm text-muted tabular-nums">
          {{ viewMode === 'group' ? drawnOf(counts.drawn, loadState.items.length) : drawings(counts.drawn) }}
        </p>
      </div>

      <!-- Grouped Sections. The section is what the scroll-spy watches; its heading
           sticks to the top while you are in it, so it is the only label it needs. -->
      <section
        v-for="(items, groupName, groupIndex) in activeData.grouped"
        :key="groupName"
        :ref="el => registerHeader(String(groupName), el)"
        class="mb-12"
      >
        <!-- A stuck element stays clear of its scroll container's padding (p-4 / sm:p-6 in
             AppShell.vue), so the negative top cancels it and the heading meets the top edge. -->
        <h2
          class="sticky -top-4 sm:-top-6 z-10 -mx-4 sm:-mx-6 px-4 sm:px-6 py-2.5 mb-4 text-base font-semibold
                 flex items-center justify-between gap-3 border-b transition-colors duration-fast
                 bg-slate-50/95 text-slate-800 border-slate-200 backdrop-blur-sm
                 dark:bg-slate-950/95 dark:text-slate-100 dark:border-slate-800"
        >
          <span class="truncate">{{ groupName }}</span>
          <span class="with-icon shrink-0 text-xs font-normal tabular-nums text-muted">
            <Icon name="pencil" aria-hidden="true" />
            {{ sectionCount(String(groupName), items.length) }}
          </span>
        </h2>

        <div class="tile-grid">
          <ItemTile
            v-for="(item, itemIndex) in items"
            :key="item.id"
            :item="item"
            :dark="theme.isDark"
            :eager="groupIndex === 0 && itemIndex < 6"
            @card-click="openItem($event)"
          />
        </div>
      </section>

      <AppFooter />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import ItemTile from './ItemTile.vue';
import EmptyState from '../ui/EmptyState.vue';
import RetryButton from '../ui/RetryButton.vue';
import DrawnFilter from '../ui/DrawnFilter.vue';
import Icon from '../ui/Icon.vue';
import AppFooter from '../shell/AppFooter.vue';
import CollectionIcon from '../ui/CollectionIcon.vue';
import { useCollectionsStore } from './collectionsStore.ts';
import { useViewStore } from './viewStore.ts';
import { useSearchStore } from '../search/searchStore.ts';
import { useThemeStore } from '../shell/themeStore.ts';
import { useViewerStore } from '../viewer/viewerStore.ts';
import { drawings, drawnOf } from '../domain/countWords.ts';
import { reloadPage } from '../browser/reloadPage.ts';

const { loadState, activeCollection } = useCollectionsStore();
// The template registers each section with the view store for the scroll-spy.
const {
  activeData,
  counts,
  viewMode,
  drawnOnly,
  showPlanned,
  showsDrawnFilter,
  registerHeader,
  setDrawnOnly,
  showUndrawn,
} = useViewStore();
const { query, clear } = useSearchStore();
const { theme } = useThemeStore();
const { open: openItem } = useViewerStore();

// ---------------------------------------------------------------------------
// COMPUTED
// ---------------------------------------------------------------------------
const isEmpty = computed(() => Object.keys(activeData.value.grouped).length === 0);

// A collection with nothing drawn shows "Nothing drawn yet"; in the family view the
// visitor can still ask to see the planned list (the ui store's, until the collection changes).
const nothingDrawn = computed(() =>
  counts.value.drawn === 0 && (viewMode.value === 'month' || !showPlanned.value)
);
const plannedLabel = computed(() => `${loadState.items.length} planned`);

// Drawn count per group: the sidebar computation already produced these numbers, one
// row for every group shown.
const drawnCounts = computed(() => {
  const counts: Record<string, number> = {};
  for (const s of activeData.value.sidebarItems) counts[s.id] = s.count;
  return counts;
});

// Group view: how many of the group are drawn. Month view: every item in a month is
// drawn, so its size is the count (a month after the current one has no sidebar row).
const sectionCount = (name: string, total: number): string =>
  viewMode.value === 'group' ? drawnOf(drawnCounts.value[name], total) : drawings(total);
</script>
