<template>
  <aside
    id="appSidebar"
    class="fixed inset-y-0 left-0 z-50 w-64 shrink-0 flex flex-col
           border-r transition-transform duration-300 ease-out
           lg:static lg:translate-x-0
           bg-white border-slate-200/80
           dark:bg-slate-950 dark:border-slate-800/80"
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
        <li
          v-for="item in activeData.sidebarItems"
          :key="item.id"
          class="relative rounded-md px-3 py-2 text-sm transition-all duration-100 flex items-center justify-between"
          :class="getItemClass(item)"
          @click="!item.disabled && $emit('goToSection', item.id)"
        >
          <!-- Active accent bar -->
          <span
            v-if="item.id === activeSection && !item.disabled"
            class="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-r-full bg-slate-800 dark:bg-slate-200"
          />
          <span class="truncate pr-2 font-medium">{{ item.label }}</span>
          <span class="text-xs shrink-0 tabular-nums font-normal opacity-50">
            <template v-if="ui.viewMode === 'group' && item.total">{{ item.count }}/{{ item.total }}</template>
            <template v-else>{{ item.count }}</template>
          </span>
        </li>
      </ul>
      <div v-else-if="!data.loading && !data.error" class="p-4 text-center text-xs text-slate-400 italic">
        No items found.
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { type CollectionConfig, type UIState, type DataState, type SidebarItem, type ActiveData } from '../../types/index.ts';

const props = defineProps<{
  activeCollection?: CollectionConfig;
  activeSection?:    string;
  ui:                UIState;
  data:              DataState;
  activeData:        ActiveData;
}>();

defineEmits<{
  goToSection: [id: string];
}>();

function getItemClass(item: SidebarItem): string {
  if (item.disabled) {
    return 'text-slate-300 dark:text-slate-700 cursor-not-allowed';
  }
  if (item.id === props.activeSection) {
    return 'cursor-pointer text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800/80';
  }
  return 'cursor-pointer text-slate-500 hover:text-slate-800 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/50';
}
</script>