<template>
  <aside
    id="appSidebar"
    class="fixed inset-y-0 left-0 z-50 w-72 shrink-0 flex flex-col
           border-r transition-all duration-300 ease-out shadow-2xl
           lg:static lg:translate-x-0 lg:shadow-none
           bg-white border-slate-200
           dark:bg-slate-900 dark:border-slate-800"
    :class="ui.sidebarOpen ? 'translate-x-0' : '-translate-x-full'"
  >
    <!-- Header -->
    <div class="sticky top-0 z-10 p-6 pb-4 bg-white dark:bg-slate-900">
      <h1 class="text-2xl font-extrabold tracking-tight text-slate-800 dark:text-white">
        {{ ui.viewMode === 'group'
            ? `${activeCollection?.groupLabel ?? ''} Groups`
            : 'Timeline' }}
      </h1>
      <p class="text-sm text-slate-500 mt-1">
        <template v-if="ui.viewMode === 'group'">
          {{ activeData.stats?.drawn ?? 0 }} drawn / {{ activeData.stats?.total ?? 0 }} total
        </template>
        <template v-else>
          {{ activeData.stats?.filtered ?? 0 }} drawings
        </template>
      </p>
    </div>

    <!-- List -->
    <div class="flex-1 overflow-y-auto px-4 pb-6 custom-scrollbar">
      <ul v-if="activeData.sidebarItems.length" class="space-y-1">
        <li
          v-for="item in activeData.sidebarItems"
          :key="item.id"
          class="rounded-lg px-4 py-2.5 text-sm font-medium transition-colors flex items-center justify-between"
          :class="getItemClass(item)"
          @click="!item.disabled && $emit('goToSection', item.id)"
        >
          <span class="truncate pr-2">{{ item.label }}</span>
          <span class="text-xs shrink-0 opacity-60">
            <template v-if="ui.viewMode === 'group' && item.total">{{ item.count }}/{{ item.total }}</template>
            <template v-else>{{ item.count }}</template>
          </span>
        </li>
      </ul>
      <div v-else-if="!data.loading && !data.error" class="p-4 text-center text-sm text-slate-500 italic">
        No items found.
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { type CollectionConfig } from '../../types/collections';
import { type UIState, type DataState, type SidebarItem, type ActiveData } from '../../types/ui';

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
    return 'text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-60';
  }
  if (item.id === props.activeSection) {
    return 'cursor-pointer bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
  }
  return 'cursor-pointer text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800';
}
</script>