<!-- The search's dropdown under the box: how many results and how many drawn, then the results
     grouped by collection (or "No matches"), then the keys that work. The box keeps the focus and
     the keys; this draws what they choose among. -->
<template>
  <Transition v-bind="TRANSITION">
    <div
      v-if="open"
      class="absolute right-0 top-full mt-1.5 w-full md:min-w-90 max-w-130
             rounded-card border shadow-float z-50 overflow-hidden
             bg-white border-stone-200 dark:bg-stone-900 dark:border-stone-700"
    >
      <SearchSummary :count="count" :drawn="drawn" />

      <EmptyState v-if="count === 0" :title="`No matches for '${query}'`" class="py-6">
        <template #icon>
          <Icon name="noResults" class="size-6" />
        </template>
      </EmptyState>

      <div
        v-else
        :id="listboxId"
        role="listbox"
        aria-label="Search results"
        class="overflow-y-auto max-h-105 custom-scrollbar divide-y divide-stone-100 dark:divide-stone-800"
      >
        <SearchResults
          :id-prefix="listboxId"
          :results="results"
          :focused-index="focusedIndex"
          :get-flat-index="getFlatIndex"
          :highlight="highlight"
          @mouseenter="emit('focus', $event)"
          @select="emit('select', $event)"
          @expand="emit('expand', $event)"
        />
      </div>

      <SearchKeyHints />
    </div>
  </Transition>
</template>

<script setup lang="ts">
import Icon from '../ui/Icon.vue';
import EmptyState from '../ui/EmptyState.vue';
import SearchSummary from './SearchSummary.vue';
import SearchResults from './SearchResults.vue';
import SearchKeyHints from './SearchKeyHints.vue';
import type { SearchResult, VisibleGroup } from './useSearchResults.ts';

const TRANSITION = {
  enterActiveClass: 'transition duration-fast ease-out',
  enterFromClass: 'opacity-0 translate-y-1 scale-95',
  enterToClass: 'opacity-100 translate-y-0 scale-100',
  leaveActiveClass: 'transition duration-fast ease-in',
  leaveFromClass: 'opacity-100 translate-y-0 scale-100',
  leaveToClass: 'opacity-0 translate-y-1 scale-95',
} as const;

defineProps<{
  /** The list's id, which the box's `aria-controls` names; each option's is it and its index. */
  listboxId: string;
  open: boolean;
  query: string;
  /** The results as listed: long groups folded. */
  results: VisibleGroup[];
  /** Every result, and how many of them are drawn, folded or not. */
  count: number;
  drawn: number;
  focusedIndex: number;
  getFlatIndex: (collectionId: string, idx: number) => number;
  highlight: (text: string) => string;
}>();

const emit = defineEmits<{
  /** The pointer moved onto a result: focus it, as the arrow keys would. */
  focus: [index: number];
  select: [result: SearchResult];
  /** Open a folded group in full. */
  expand: [collectionId: string];
}>();
</script>
