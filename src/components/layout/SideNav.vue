<!-- components/layout/SideNav.vue -->
<template>
  <aside
    id="appSidebar"
    class="fixed inset-y-0 left-0 z-50 w-64 shrink-0 flex flex-col
           border-r transition-transform duration-300 ease-out
           lg:static lg:translate-x-0
           bg-white border-slate-200
           dark:bg-slate-950 dark:border-slate-800"
    :class="ui.sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'"
  >
    <!-- Header -->
    <div class="sticky top-0 z-10 px-5 pt-5 pb-4 border-b border-slate-100 dark:border-slate-800/60">
      <h1 class="text-base font-semibold tracking-tight text-slate-800 dark:text-slate-100">
        {{ ui.viewMode === 'group'
            ? `${activeCollection?.groupLabel ?? ''} Groups`
            : 'Timeline' }}
      </h1>
      <p class="text-xs text-slate-400 dark:text-slate-500 mt-0.5 tabular-nums">
        <template v-if="ui.viewMode === 'group'">
          {{ activeData.stats?.drawn ?? 0 }} drawn &middot; {{ activeData.stats?.total ?? 0 }} total
        </template>
        <template v-else>
          {{ activeData.stats?.filtered ?? 0 }} drawings
        </template>
      </p>
    </div>

    <!-- List -->
    <div class="flex-1 overflow-y-auto px-3 py-3 custom-scrollbar">
      <ul v-if="activeData.sidebarItems.length" class="space-y-0.5">
        <li v-for="item in activeData.sidebarItems" :key="item.id">
          <button
            class="focus-ring relative w-full rounded-md px-3 py-2 text-sm text-left transition-colors duration-150 flex items-center justify-between"
            :class="getItemClass(item)"
            :disabled="item.disabled"
            @click="goToSection(item.id)"
          >
            <!-- Active accent bar -->
            <span
              v-if="item.id === activeSection && !item.disabled"
              class="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-r-full bg-accent-500"
            />
            <span class="truncate pr-2 font-medium">{{ item.label }}</span>
            <span class="text-xs shrink-0 tabular-nums font-normal opacity-50">
              <template v-if="ui.viewMode === 'group' && item.total">{{ item.count }}/{{ item.total }}</template>
              <template v-else>{{ item.count }}</template>
            </span>
          </button>
        </li>
      </ul>
      <EmptyState
        v-else-if="!data.loading && !data.error"
        title="No items found"
        hint="Nothing matches in this view."
      />
    </div>

    <!-- Global progress -->
    <div
      v-if="!data.loading"
      class="shrink-0 px-5 py-4 border-t border-slate-100 dark:border-slate-800/60"
      :title="`${globalStats.drawn} drawn out of ${globalStats.total} total`"
    >
      <div class="flex items-baseline justify-between mb-1.5">
        <span class="caps-label text-slate-400 dark:text-slate-500">Overall progress</span>
        <span class="text-xs tabular-nums text-slate-400 dark:text-slate-500">
          <span class="font-semibold text-slate-700 dark:text-slate-200">{{ globalStats.drawn }}</span>
          / {{ globalStats.total }}
        </span>
      </div>
      <div class="h-1 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-800">
        <div
          class="h-full rounded-full bg-accent-600 dark:bg-accent-500 transition-all duration-700 ease-out"
          :style="{ width: globalStats.total > 0 ? `${(globalStats.drawn / globalStats.total) * 100}%` : '0%' }"
        />
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import EmptyState from '../ui/EmptyState.vue';
import { useAppContext } from '../../composables';
import type { SidebarItem } from '../../types/index.ts';

const {
  activeCollection,
  activeSection,
  ui,
  data,
  activeData,
  globalStats,
  goToSection,
} = useAppContext();

function getItemClass(item: SidebarItem): string {
  if (item.disabled) {
    return 'text-slate-300 dark:text-slate-700 cursor-not-allowed';
  }
  if (item.id === activeSection.value) {
    return 'cursor-pointer text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800/80';
  }
  return 'cursor-pointer text-slate-500 hover:text-slate-800 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/50';
}
</script>
