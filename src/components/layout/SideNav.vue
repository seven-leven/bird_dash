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
    :inert="isMobile && !sidebarOpen"
    @keydown.escape="closeSidebar()"
  >
    <!-- Header -->
    <div class="sticky top-0 z-10 px-5 pt-5 pb-4 border-b border-slate-100 dark:border-slate-800/60">
      <!-- The collection, how much of it is drawn, and the switch to hide the rest. The
           count sits under the collection's name so it can only be counting its items
           (not the groups listed below). Below lg the sidebar is a drawer, so the grid
           repeats them there. -->
      <div class="flex items-center justify-between gap-2">
        <h1 class="text-base font-semibold tracking-tight text-slate-800 dark:text-slate-100">
          {{ activeCollection?.label }}
        </h1>
        <button
          v-if="!data.loading && viewMode === 'group' && stats.drawn > 0 && stats.drawn < data.items.length"
          class="nav-item marker-b focus-ring shrink-0 px-2 py-1 text-xs max-md:min-h-9"
          :aria-pressed="drawnOnly"
          @click="toggleDrawnOnly()"
        >
          Drawn only
        </button>
      </div>
      <!-- No count until it is known: "0 of 0 drawn" would read as a real answer. -->
      <p v-if="data.loading" class="h-3 w-24 mt-1.5 rounded-full animate-pulse bg-slate-200 dark:bg-slate-800" />
      <p v-else-if="stats.drawn > 0" class="with-icon mt-1 text-xs text-muted tabular-nums">
        <Icon name="pencil" aria-hidden="true" />{{
          viewMode === 'group' ? drawnOf(stats.drawn, data.items.length) : drawings(stats.drawn)
        }}
      </p>
    </div>

    <!-- List, labelled with the view's name as the header's tab says it -->
    <div class="flex-1 overflow-y-auto px-3 py-3 custom-scrollbar">
      <h2 id="sidebar-list-label" class="caps-label text-muted px-3 pt-1 pb-2">
        {{ viewName(viewMode, activeCollection?.groupLabel ?? 'Group') }}
      </h2>
      <!-- Loading: rows shaped like the real ones, as the grid does -->
      <ul v-if="data.loading" class="space-y-0.5" aria-busy="true">
        <li v-for="n in 8" :key="n" class="flex items-center justify-between px-3 py-2.5">
          <span class="h-3 w-32 rounded-full animate-pulse bg-slate-200 dark:bg-slate-800" />
          <span class="h-3 w-8 rounded-full animate-pulse bg-slate-200 dark:bg-slate-800" />
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
            <span class="text-xs shrink-0 tabular-nums font-normal opacity-60">
              {{ viewMode === 'group' && item.total ? ratio(item.count, item.total) : item.count }}
            </span>
          </button>
        </li>
      </ul>
      <!-- The same words as the main area (docs/DESIGN.md §11), without its buttons -->
      <EmptyState
        v-else-if="!data.error"
        :title="query ? `No matches for '${query}'` : 'Nothing drawn yet'"
      />
    </div>

    <!-- Global progress -->
    <div
      v-if="!data.loading"
      class="shrink-0 px-5 py-4 border-t border-slate-100 dark:border-slate-800/60"
    >
      <div class="flex items-baseline justify-between mb-1.5">
        <span class="caps-label with-icon text-muted">
          <Icon name="layers" aria-hidden="true" />All collections
        </span>
        <span class="text-xs tabular-nums text-muted">
          {{ drawnOf(globalStats.drawn, globalStats.total) }}
        </span>
      </div>
      <div class="h-1 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-800">
        <div
          class="h-full rounded-full bg-accent-600 dark:bg-accent-500 transition-all duration-slow ease-out"
          :style="{ width: globalStats.total > 0 ? `${(globalStats.drawn / globalStats.total) * 100}%` : '0%' }"
        />
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import EmptyState from '../ui/EmptyState.vue';
import Icon from '../icons/Icon.vue';
import { useCollectionsStore } from '../../stores/collections.ts';
import { useUi } from '../../stores/ui.ts';
import { useSearch } from '../../stores/search.ts';
import { drawings, drawnOf, ratio } from '../../lib/formatCount.ts';
import { viewName } from '../../lib/viewName.ts';

const { activeCollection, data, activeData, stats, globalStats } = useCollectionsStore();
// Off-screen on small screens until opened: `inert` keeps it out of the tab order.
const {
  sidebarOpen,
  isMobile,
  viewMode,
  activeSection,
  drawnOnly,
  goToSection,
  closeSidebar,
  toggleDrawnOnly,
} = useUi();
const { query } = useSearch();

</script>
