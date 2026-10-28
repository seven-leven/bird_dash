<!-- gallery/ViewSwitch.vue: the gallery's two views, by group or by month, both always shown
     and the current one marked. The app places it in the top bar. -->
<template>
  <div class="flex items-center gap-0.5" role="group" aria-label="View">
    <button
      v-for="view in views"
      :key="view.mode"
      @click="setViewMode(view.mode)"
      class="nav-item marker-b focus-ring flex items-center justify-center gap-1.5 px-2 sm:px-2.5 py-1.5 max-md:min-h-9 max-md:min-w-9"
      :aria-pressed="viewMode === view.mode"
      :aria-label="`${view.label} view`"
      :title="`${view.label} view`"
    >
      <Icon :name="view.icon" class="size-4" />
      <span class="hidden lg:inline">{{ view.label }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import Icon from '../ui/Icon.vue';
import { useCollectionsStore } from './collectionsStore.ts';
import { useViewStore } from './viewStore.ts';
import { viewName } from '../domain/viewName.ts';

const { activeCollection } = useCollectionsStore();
const { viewMode, setViewMode } = useViewStore();

const views = computed(() => [
  {
    mode: 'group' as const,
    icon: 'taxonomy' as const,
    label: viewName('group', activeCollection.value?.groupLabel ?? 'Group'),
  },
  { mode: 'month' as const, icon: 'calendar' as const, label: viewName('month', '') },
]);
</script>
