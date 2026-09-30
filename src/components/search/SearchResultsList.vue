<template>
  <div
    v-for="{ group, rows } in indexed"
    :key="group.collection.id"
    role="group"
    :aria-label="group.collection.label"
  >
    <!-- Group Header (the group's aria-label already names it) -->
    <div
      class="flex items-center justify-between px-4 py-1.5 sticky top-0 z-10
                bg-slate-50 border-b border-slate-100 dark:bg-slate-800/70 dark:border-slate-800"
      aria-hidden="true"
    >
      <div class="flex items-center gap-2">
        <span class="text-sm leading-none">{{ group.collection.emoji }}</span>
        <span class="caps-label text-muted">{{ group.collection.label }}</span>
      </div>
      <span class="text-[10px] font-semibold tabular-nums px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400">{{ group.count }}</span>
    </div>

    <!-- Results: options of the combobox's listbox. Focus stays in the input, so
         they are not tab stops; the input points at the active one. -->
    <button
      v-for="{ result, flat } in rows"
      :key="result.item.itemId"
      :id="`search-result-${flat}`"
      role="option"
      tabindex="-1"
      :aria-selected="focusedIndex === flat"
      :data-result-idx="flat"
      @mouseenter="$emit('mouseenter', flat)"
      @click="$emit('select', result)"
      class="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors duration-150
             hover:bg-slate-50 dark:hover:bg-slate-800/60"
      :class="{ 'bg-slate-50 dark:bg-slate-800/60': focusedIndex === flat }"
    >
      <img :src="result.item.imageUrl" alt="" class="w-8 h-8 rounded-md object-cover shrink-0 bg-slate-100 dark:bg-slate-800" loading="lazy" />
      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium truncate text-slate-800 dark:text-slate-100" v-html="highlight(result.item.commonName)" />
        <p class="text-xs text-muted italic truncate mt-0.5" v-html="highlight(result.item.scientificName)" />
        <p
          v-if="result.item.meta?.dhiv_script"
          class="font-dhivehi text-xs text-muted truncate mt-0.5"
          dir="rtl"
        >{{ result.item.meta.dhiv_script }}</p>
      </div>
      <IdBadge variant="surface" class="shrink-0">
        <span v-html="highlight(`#${result.item.itemId}`)" />
      </IdBadge>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import IdBadge from '../ui/IdBadge.vue';
import type { GlobalSearchCollectionGroup, GlobalSearchResult } from '../../types';

const props = defineProps<{
  results: GlobalSearchCollectionGroup[];
  focusedIndex: number;
  getFlatIndex: (collectionId: string, idx: number) => number;
  highlight: (text: string) => string;
}>();

defineEmits<{
  mouseenter: [index: number];
  select: [result: GlobalSearchResult];
}>();

// Each row's position in the flat keyboard-navigation order, computed once per
// results change rather than several times per row per render.
const indexed = computed(() =>
  props.results.map((group) => ({
    group,
    rows: group.results.map((result, idx) => ({
      result,
      flat: props.getFlatIndex(group.collection.id, idx),
    })),
  }))
);
</script>
