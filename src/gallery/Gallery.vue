<!-- gallery/Gallery.vue: the collection on screen, in sections, or why it is not. -->
<template>
  <div class="space-y-12">
    <GallerySkeleton v-if="loadState.loading" aria-busy="true" />

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

      <GallerySection
        v-for="(items, groupName, groupIndex) in activeData.grouped"
        :key="groupName"
        :name="String(groupName)"
        :items="items"
        :count="sectionCount(String(groupName), items.length)"
        :first="groupIndex === 0"
      />

      <!-- What the app places after the drawings: the footer. -->
      <slot />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import GallerySection from './GallerySection.vue';
import GallerySkeleton from './GallerySkeleton.vue';
import EmptyState from '../ui/EmptyState.vue';
import RetryButton from '../ui/RetryButton.vue';
import DrawnFilter from '../ui/DrawnFilter.vue';
import Icon from '../ui/Icon.vue';
import CollectionIcon from '../ui/CollectionIcon.vue';
import { useCollectionsStore } from './collectionsStore.ts';
import { useViewStore } from './viewStore.ts';
import { useSearchStore } from '../search/searchStore.ts';
import { drawings, drawnOf } from '../domain/countWords.ts';
import { reloadPage } from '../browser/reloadPage.ts';

const { loadState, activeCollection } = useCollectionsStore();
const {
  activeData,
  counts,
  viewMode,
  drawnOnly,
  showPlanned,
  showsDrawnFilter,
  setDrawnOnly,
  showUndrawn,
} = useViewStore();
const { query, clear } = useSearchStore();

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
