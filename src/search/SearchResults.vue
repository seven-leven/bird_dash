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
        <CollectionIcon :collection="group.collection" class="size-3 text-muted" />
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
      <img v-if="result.item.isDrawn" :src="result.item.smallImageUrl" alt="" class="w-8 h-8 rounded-control object-cover shrink-0 bg-slate-100 dark:bg-slate-800" loading="lazy" />
      <!-- Not drawn yet: its collection's icon, faint on the tile grey, as in the grid. -->
      <span
        v-else
        class="w-8 h-8 rounded-control shrink-0 flex items-center justify-center bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600"
      >
        <CollectionIcon :collection="result.collection" class="size-5 stroke-[1.5]" />
      </span>
      <div class="flex-1 min-w-0">
        <!-- The names a query can match first (English, then Latin), then the Thaana -->
        <template v-for="(line, l) in resultLines(result.item)" :key="line.lang">
          <p
            v-if="line.lang === 'dv'"
            class="font-dhivehi text-xs text-muted truncate mt-0.5"
            dir="rtl"
          >{{ line.text }}</p>
          <p
            v-else
            :class="l === 0 ? 'text-sm font-medium truncate text-slate-800 dark:text-slate-100'
              : `text-xs text-muted truncate mt-0.5${line.lang === 'la' ? ' italic' : ''}`"
            v-html="highlight(line.text)"
          />
        </template>
        <!-- Why it matched, when the names do not show it (only the group matched) -->
        <p
          v-if="result.matchedFields.length === 1 && result.matchedFields[0] === 'group'"
          class="text-xs text-muted truncate mt-0.5"
          v-html="`in ${highlight(result.item.group)}`"
        />
      </div>
      <span
        v-if="!result.item.isDrawn"
        class="shrink-0 text-xs text-muted whitespace-nowrap"
      >Not drawn yet</span>
      <IdBadge class="shrink-0">
        <span v-html="highlight(`#${result.item.itemId}`)" />
      </IdBadge>
    </button>

    <!-- A long group is cut short so the next collection stays in reach. -->
    <button
      v-if="group.hidden > 0"
      type="button"
      @click="$emit('expand', group.collection.id)"
      class="focus-ring w-full px-4 py-2 text-left text-xs font-medium text-accent-700 transition-colors duration-fast
             hover:bg-slate-50 dark:text-accent-300 dark:hover:bg-slate-800/60"
    >
      Show {{ group.hidden }} more in {{ group.collection.label }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import IdBadge from '../ui/IdBadge.vue';
import CollectionIcon from '../ui/CollectionIcon.vue';
import { nameLines } from '../domain/itemNames.ts';
import type { Item } from '../domain/toCollectionItems.ts';
import type { SearchResult, VisibleGroup } from './useSearchResults.ts';

// A result's names, the ones a query matches (English, Latin) before the Thaana.
const resultLines = (item: Item) => {
  const lines = nameLines(item.names);
  return [...lines.filter((l) => l.lang !== 'dv'), ...lines.filter((l) => l.lang === 'dv')];
};

const props = defineProps<{
  results: VisibleGroup[];
  focusedIndex: number;
  getFlatIndex: (collectionId: string, idx: number) => number;
  highlight: (text: string) => string;
}>();

defineEmits<{
  mouseenter: [index: number];
  select: [result: SearchResult];
  expand: [collectionId: string];
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
