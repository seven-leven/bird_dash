<!-- components/layout/SideNav.vue -->
<template>
  <aside
    id="appSidebar"
    class="fixed inset-y-0 left-0 z-50 w-64 shrink-0 flex flex-col
           border-r transition-transform duration-slow ease-out
           lg:static lg:translate-x-0
           bg-white border-slate-200
           dark:bg-slate-950 dark:border-slate-800"
    :class="sidebarOpen ? 'translate-x-0 shadow-float' : '-translate-x-full'"
    :inert="isNarrow && !sidebarOpen"
    @keydown.escape="closeSidebar()"
  >
    <!-- Header -->
    <div class="sticky top-0 z-10 px-5 pt-5 pb-4 border-b border-slate-100 dark:border-slate-800/60">
      <!-- Three levels, largest first: the collection's emblem (the biggest icon on the
           page, in the accent that marks where you are), its name, then its count. The
           count sits under the name so it can only be counting the collection's items,
           never the groups listed below. Where there are gaps the count is also the
           filter: "All 204 · Drawn 15". Below lg the sidebar is a drawer, so the grid
           repeats the count there. -->
      <div class="flex items-center gap-3">
        <CollectionIcon
          v-if="activeCollection"
          :collection="activeCollection"
          class="size-10 shrink-0 text-accent-600 dark:text-accent-400"
        />
        <div class="min-w-0">
          <h1 class="text-base font-semibold tracking-tight truncate text-slate-800 dark:text-slate-100">
            {{ activeCollection?.label }}
          </h1>
          <!-- No count until it is known: "0 of 0 drawn" would read as a real answer. -->
          <p v-if="loadState.loading" class="h-3 w-24 mt-2 rounded-full skeleton" />
          <DrawnFilter
            v-else-if="showsDrawnFilter"
            class="-ml-2.5 mt-0.5"
            :drawn="counts.drawn"
            :total="loadState.items.length"
            :drawn-only="drawnOnly"
            @choose="setDrawnOnly"
          />
          <p v-else-if="counts.drawn > 0" class="mt-0.5 text-xs text-muted tabular-nums">
            {{ viewMode === 'group' ? drawnOf(counts.drawn, loadState.items.length) : drawings(counts.drawn) }}
          </p>
        </div>
      </div>
    </div>

    <!-- List, labelled with the view's name as the header's tab says it -->
    <div class="flex-1 overflow-y-auto px-3 py-3 custom-scrollbar">
      <h2 id="sidebar-list-label" class="caps-label text-muted px-3 pt-1 pb-2">
        {{ viewName(viewMode, activeCollection?.groupLabel ?? 'Group') }}
      </h2>
      <!-- Loading: rows shaped like the real ones, as the grid does -->
      <ul v-if="loadState.loading" class="space-y-0.5" aria-busy="true">
        <li v-for="n in 8" :key="n" class="flex items-center justify-between px-3 py-2.5">
          <span class="h-3 w-32 rounded-full skeleton" />
          <span class="h-3 w-8 rounded-full skeleton" />
        </li>
      </ul>
      <ul v-else-if="activeData.sidebarItems.length" class="space-y-0.5" aria-labelledby="sidebar-list-label">
        <li v-for="item in activeData.sidebarItems" :key="item.id">
          <button
            class="nav-item marker-l focus-ring w-full px-3 py-2 text-left flex items-center justify-between
                   disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-transparent
                   dark:disabled:text-slate-700"
            :aria-current="item.id === activeSection && !item.disabled ? 'true' : undefined"
            :disabled="item.disabled"
            @click="goToSection(item.id)"
          >
            <span class="truncate pr-2">{{ item.label }}</span>
            <!-- A row with drawings carries the stronger count, so the eye finds them; an
                 empty one stays muted, still at AA contrast (docs/DESIGN.md §03). -->
            <span
              class="text-xs shrink-0 tabular-nums"
              :class="item.disabled ? '' : item.count ? COUNT_DRAWN : COUNT_EMPTY"
            >
              {{ viewMode === 'group' && item.total ? ratio(item.count, item.total) : item.count }}
            </span>
          </button>
        </li>
      </ul>
      <!-- The same words as the main area (docs/DESIGN.md §11), without its buttons -->
      <EmptyState
        v-else-if="!loadState.error"
        :title="query ? `No matches for '${query}'` : 'Nothing drawn yet'"
      />
    </div>

    <!-- Global progress -->
    <div
      v-if="!loadState.loading"
      class="shrink-0 px-5 py-4 border-t border-slate-100 dark:border-slate-800/60"
    >
      <div class="flex items-baseline justify-between mb-1.5">
        <span class="caps-label with-icon text-muted">
          <Icon name="layers" aria-hidden="true" />All collections
        </span>
        <span class="text-xs tabular-nums text-muted">
          {{ drawnOf(archiveCounts.drawn, archiveCounts.total) }}
        </span>
      </div>
      <div class="h-1 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-800">
        <div
          class="h-full rounded-full bg-accent-600 dark:bg-accent-500 transition-all duration-slow ease-out"
          :style="{ width: archiveCounts.total > 0 ? `${(archiveCounts.drawn / archiveCounts.total) * 100}%` : '0%' }"
        />
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import EmptyState from '../ui/EmptyState.vue';
import DrawnFilter from '../ui/DrawnFilter.vue';
import CollectionIcon from '../ui/CollectionIcon.vue';
import Icon from '../ui/Icon.vue';
import { useCollectionsStore } from '../gallery/collectionsStore.ts';
import { useLayoutStore } from './layoutStore.ts';
import { useViewStore } from '../gallery/viewStore.ts';
import { drawings, drawnOf, ratio } from '../domain/countWords.ts';
import { viewName } from '../domain/viewName.ts';

// The sidebar's counts: slate-700 (10.4:1 on white) where something is drawn, the muted
// slate-500 (4.8:1) where nothing is yet.
const COUNT_DRAWN = 'font-medium text-slate-700 dark:text-slate-300';
const COUNT_EMPTY = 'text-muted';

const { activeCollection, loadState, archiveCounts } = useCollectionsStore();
const {
  activeData,
  counts,
  viewMode,
  activeSection,
  drawnOnly,
  showsDrawnFilter,
  goToSection,
  setDrawnOnly,
} = useViewStore();
// Off-screen on narrow screens until opened: `inert` keeps it out of the tab order.
const { sidebarOpen, isNarrow, closeSidebar } = useLayoutStore();
defineProps<{
  /** The search, which the sections say they are filtered by (the app hands it over). */
  query: string;
}>();

</script>
