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
        <CollectionIcon :collection="group.collection" class="w-3.5 h-3.5 text-muted" />
        <span class="caps-label text-muted">{{ group.collection.label }}</span>
      </div>
      <span class="count-pill">{{ group.count }}</span>
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
      class="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors duration-fast
             hover:bg-slate-50 dark:hover:bg-slate-800/60"
      :class="{ 'bg-slate-50 dark:bg-slate-800/60': focusedIndex === flat }"
    >
      <img :src="tileImage(result.item, theme.isDark)" alt="" class="w-8 h-8 rounded-control object-cover shrink-0 bg-slate-100 dark:bg-slate-800" loading="lazy" />
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
import CollectionIcon from '../icons/CollectionIcon.vue';
import { tileImage } from '../../lib/collectionItems.ts';
import { useUi } from '../../stores/ui.ts';
import type { GlobalSearchCollectionGroup, GlobalSearchResult } from '../../types';

const { theme } = useUi();

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
