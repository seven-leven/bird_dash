<!-- components/search/SearchBox.vue -->
<template>
  <!-- Width is set by the header (full row on phones, capped from md up). -->
  <div class="relative min-w-0 transition-[max-width] duration-fast" ref="wrapperEl">
    <!-- ==================== INPUT FIELD ==================== -->
    <div class="relative w-full">
      <!-- Search Icon -->
      <div class="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
        <Icon name="search" class="size-4 text-muted" />
      </div>

      <!-- Input -->
      <input
        ref="inputEl"
        type="text"
        role="combobox"
        aria-label="Search all collections"
        aria-autocomplete="list"
        aria-controls="global-search-listbox"
        :aria-expanded="shouldShowDropdown"
        :aria-activedescendant="activeOptionId"
        :value="query"
        @input="onInput(($event.target as HTMLInputElement).value)"
        @focus="openDropdown"
        @keydown.escape="closeDropdown"
        @keydown.down.prevent="moveFocus(1)"
        @keydown.up.prevent="moveFocus(-1)"
        @keydown.enter.prevent="selectFocused"
        placeholder="Search all collections…"
        autocomplete="off"
        class="block w-full pl-7 pr-12 py-1.5 rounded-control text-sm border transition-colors duration-fast
               focus:outline-none focus:ring-1 focus:ring-accent-700 focus:border-accent-700
               bg-slate-100/80 border-transparent text-slate-900 placeholder-slate-400
               dark:bg-slate-800/80 dark:border-transparent dark:text-slate-100 dark:placeholder-slate-500
               dark:focus:ring-accent-500 dark:focus:border-accent-500"
      />

      <!-- Shortcut hint (shown when empty) -->
      <div
        v-if="!hasQuery"
        class="absolute inset-y-0 right-0 pr-2 hidden sm:flex items-center pointer-events-none"
        aria-hidden="true"
      >
        <kbd class="kbd-hint inline-flex items-center gap-0.5">
          <Icon v-if="isMac" name="command" class="size-3" />
          <template v-else>Ctrl </template>K
        </kbd>
      </div>

      <!-- Clear Button -->
      <button
        v-if="hasQuery"
        @click="clearSearch"
        class="absolute inset-y-0 right-0 pr-2 flex items-center text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        tabindex="-1"
        aria-label="Clear search"
      >
        <Icon name="close" class="size-4" />
      </button>
    </div>

    <!-- Announces the result count to screen readers as the query changes -->
    <div class="sr-only" role="status" aria-live="polite">{{ liveMessage }}</div>

    <SearchDropdown
      :open="shouldShowDropdown"
      :query="query"
      :results="visibleResults"
      :count="globalResultCount"
      :drawn="globalDrawnCount"
      :focused-index="focusedIndex"
      :get-flat-index="getFlatIndex"
      :highlight="highlight"
      @focus="focusedIndex = $event"
      @select="onSelectResult"
      @expand="expandGroup"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import type { SearchResult } from './useSearchResults.ts';
import { matches } from '../domain/countWords.ts';

import { useResultKeys } from './useResultKeys.ts';
import { useHighlight } from './useHighlight.ts';
import { useClickOutside } from '../browser/useClickOutside.ts';
import { useFocusShortcut } from '../browser/useFocusShortcut.ts';
import { COLLAPSED_SIZE, collapseGroups } from '../domain/collapseGroups.ts';

import { useSearchStore } from './searchStore.ts';
import { useActions } from '../app/actions.ts';

import Icon from '../ui/Icon.vue';
import SearchDropdown from './SearchDropdown.vue';

const {
  query,
  dropdownOpen,
  setQuery,
  setDropdown,
  results: globalResults,
  resultCount: globalResultCount,
  drawnResultCount: globalDrawnCount,
} = useSearchStore();
const { selectGlobalResult } = useActions();

const inputEl = ref<HTMLInputElement | null>(null);
const wrapperEl = ref<HTMLElement | null>(null);

// Long groups start collapsed ("Show 32 more in Birds") so the next collection
// is not buried; a new query collapses them again. The arrow keys move through
// what is listed, so navigation works on the visible groups.
const expandedGroups = ref(new Set<string>());
const visibleResults = computed(() => collapseGroups(globalResults.value, expandedGroups.value));
watch(query, () => {
  if (expandedGroups.value.size) expandedGroups.value = new Set();
});

const { focusedIndex, getFlatIndex, moveFocus, resetFocus, getFocusedResult } =
  useResultKeys(() => visibleResults.value, () => wrapperEl.value);

const { highlightText } = useHighlight();
const highlight = (text: string) => highlightText(text, query.value);
useClickOutside(() => wrapperEl.value, closeDropdown);

// Ctrl+K (⌘K on a Mac) finds the box from anywhere; the hint in it says which.
const isMac = typeof navigator !== 'undefined' && /Mac/.test(navigator.platform);
useFocusShortcut('k', () => inputEl.value);

const hasQuery = computed(() => query.value.length > 0);
const shouldShowDropdown = computed(() => dropdownOpen.value && query.value.trim() !== '');

// The option the keyboard cursor is on (only meaningful while results are listed).
const activeOptionId = computed(() =>
  shouldShowDropdown.value && globalResultCount.value > 0 && focusedIndex.value >= 0
    ? `search-result-${focusedIndex.value}`
    : undefined
);

const liveMessage = computed(() => {
  if (!query.value.trim()) return '';
  const n = globalResultCount.value;
  return n === 0 ? 'No matches found' : matches(n);
});

function onInput(value: string) {
  resetFocus();
  setQuery(value); // opens the dropdown when the query is non-empty
}

function openDropdown() {
  if (query.value.trim()) setDropdown(true);
}

function closeDropdown() {
  resetFocus();
  setDropdown(false);
}

function clearSearch() {
  setQuery('');
  setDropdown(false);
  inputEl.value?.focus();
}

// Reveal the rest of a group, put the keyboard cursor on the first newly shown
// row, and hand focus back to the input (the "show more" button is gone).
async function expandGroup(collectionId: string) {
  expandedGroups.value = new Set([...expandedGroups.value, collectionId]);
  focusedIndex.value = getFlatIndex(collectionId, COLLAPSED_SIZE);
  inputEl.value?.focus();
  await nextTick();
  wrapperEl.value
    ?.querySelector(`[data-result-idx="${focusedIndex.value}"]`)
    ?.scrollIntoView({ block: 'nearest' });
}

function selectFocused() {
  const result = getFocusedResult();
  if (result) {
    onSelectResult(result);
  } else {
    // No result focused: Enter applies the current query as the grid filter
    // (already live-synced) and dismisses the dropdown.
    closeDropdown();
  }
}

function onSelectResult(result: SearchResult) {
  selectGlobalResult(result.collection.id, result.item);
  closeDropdown();
}
</script>
