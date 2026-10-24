<!-- components/layout/SideNav.vue -->
<template>
  <aside
    id="appSidebar"
    class="fixed inset-y-0 left-0 z-50 w-64 shrink-0 flex flex-col
           border-r transition-transform duration-slow ease-out
           lg:static lg:translate-x-0
           bg-white border-slate-200
           dark:bg-slate-950 dark:border-slate-800"
    :class="sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'"
    :inert="isMobile && !sidebarOpen"
    @keydown.escape="closeSidebar()"
  >
    <!-- Header -->
    <div class="sticky top-0 z-10 px-5 pt-5 pb-4 border-b border-slate-100 dark:border-slate-800/60">
      <h1 class="text-base font-semibold tracking-tight text-slate-800 dark:text-slate-100">
        {{ viewMode === 'group'
            ? `${activeCollection?.groupLabel ?? ''} Groups`
            : 'Timeline' }}
      </h1>
      <!-- No count until it is known: "0 of 0 drawn" would read as a real answer. -->
      <p v-if="data.loading" class="h-3 w-24 mt-1.5 rounded-full animate-pulse bg-slate-200 dark:bg-slate-800" />
      <p v-else class="text-xs text-muted mt-0.5 tabular-nums">
        {{ viewMode === 'group' ? drawnOf(stats.drawn, stats.total) : drawings(stats.filtered) }}
      </p>
    </div>

    <!-- List -->
    <div class="flex-1 overflow-y-auto px-3 py-3 custom-scrollbar">
      <!-- Loading: rows shaped like the real ones, as the grid does -->
      <ul v-if="data.loading" class="space-y-0.5" aria-busy="true">
        <li v-for="n in 8" :key="n" class="flex items-center justify-between px-3 py-2.5">
          <span class="h-3 w-32 rounded-full animate-pulse bg-slate-200 dark:bg-slate-800" />
          <span class="h-3 w-8 rounded-full animate-pulse bg-slate-200 dark:bg-slate-800" />
        </li>
      </ul>
      <ul v-else-if="activeData.sidebarItems.length" class="space-y-0.5">
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

const { activeCollection, data, activeData, stats, globalStats } = useCollectionsStore();
// Off-screen on small screens until opened: `inert` keeps it out of the tab order.
const { sidebarOpen, isMobile, viewMode, activeSection, goToSection, closeSidebar } = useUi();
const { query } = useSearch();

</script>
