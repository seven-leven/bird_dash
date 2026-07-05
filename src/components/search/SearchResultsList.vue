<template>
  <div v-for="group in results" :key="group.collection.id">
    <!-- Group Header -->
    <div class="flex items-center justify-between px-4 py-1.5 sticky top-0 z-10
                bg-slate-50 border-b border-slate-100 dark:bg-slate-800/70 dark:border-slate-800">
      <div class="flex items-center gap-2">
        <span class="text-sm leading-none">{{ group.collection.emoji }}</span>
        <span class="caps-label text-muted">{{ group.collection.label }}</span>
      </div>
      <span class="text-[10px] font-semibold tabular-nums px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400">{{ group.count }}</span>
    </div>

    <!-- Results -->
    <button
      v-for="(result, idx) in group.results"
      :key="result.item.itemId"
      :data-result-idx="getFlatIndex(group.collection.id, idx)"
      @mouseenter="$emit('mouseenter', getFlatIndex(group.collection.id, idx))"
      @click="$emit('select', result)"
      class="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors duration-150
             hover:bg-slate-50 dark:hover:bg-slate-800/60"
      :class="{ 'bg-slate-50 dark:bg-slate-800/60': focusedIndex === getFlatIndex(group.collection.id, idx) }"
    >
      <img :src="result.item.imageUrl" class="w-8 h-8 rounded-md object-cover shrink-0 bg-slate-100 dark:bg-slate-800" loading="lazy" />
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
import IdBadge from '../ui/IdBadge.vue';
import type { GlobalSearchCollectionGroup, CollectionItem } from '../../types';

defineProps<{
  results: GlobalSearchCollectionGroup[];
  query: string;
  focusedIndex: number;
  getFlatIndex: (collectionId: string, idx: number) => number;
  highlight: (text: string) => string;
}>();

defineEmits<{
  mouseenter: [index: number];
  select: [result: { collection: { id: string }; item: Pick<CollectionItem, 'itemId' | 'imageUrl' | 'commonName' | 'scientificName'> }];
}>();
</script>
