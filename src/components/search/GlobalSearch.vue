<!-- components/search/GlobalSearch.vue -->
<template>
  <div class="relative shrink-0" ref="searchWrapperRef">
    <!-- ==================== INPUT FIELD ==================== -->
    <div
      class="relative w-44 sm:w-56 md:w-72 transition-all duration-200"
      :class="{ 'md:w-96': dropdownOpen }"
    >
      <!-- Search Icon -->
      <div class="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
        <Icon name="search" class="h-3.5 w-3.5 text-muted" />
      </div>

      <!-- Input -->
      <input
        ref="searchInputRef"
        type="text"
        :value="query"
        @input="onInput(($event.target as HTMLInputElement).value)"
        @focus="openDropdown"
        @keydown.escape="closeDropdown"
        @keydown.down.prevent="moveFocus(1)"
        @keydown.up.prevent="moveFocus(-1)"
        @keydown.enter.prevent="selectFocused"
        placeholder="Search all collections…"
        autocomplete="off"
        class="block w-full pl-7 pr-12 py-1.5 rounded-md text-sm border transition-colors duration-150
               focus:outline-none focus:ring-1 focus:ring-accent-500 focus:border-accent-500
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
        <kbd class="kbd-hint">{{ shortcutLabel }}</kbd>
      </div>

      <!-- Clear Button -->
      <button
        v-if="hasQuery"
        @click="clearSearch"
        class="absolute inset-y-0 right-0 pr-2 flex items-center text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        tabindex="-1"
        aria-label="Clear search"
      >
        <Icon name="close" class="h-3.5 w-3.5" />
      </button>
    </div>

    <!-- ==================== DROPDOWN ==================== -->
    <Transition v-bind="dropdownTransition">
      <div
        v-if="shouldShowDropdown"
        class="absolute right-0 top-full mt-1.5 w-full min-w-90 max-w-130
               rounded-xl border shadow-xl z-50 overflow-hidden
               bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-700"
        role="listbox"
        aria-label="Search results"
      >
        <!-- Header -->
        <SearchDropdownHeader :count="globalResultCount" />

        <!-- States -->
        <EmptyState v-if="globalResultCount === 0" title="No matches found" class="py-6">
          <template #icon>
            <Icon name="noResults" class="w-6 h-6" />
          </template>
        </EmptyState>

        <div
          v-else
          class="overflow-y-auto max-h-105 custom-scrollbar divide-y divide-slate-100 dark:divide-slate-800"
        >
          <SearchResultsList
            :results="globalResults"
            :focused-index="focusedIndex"
            :get-flat-index="getFlatIndex"
            :highlight="highlight"
            @mouseenter="focusedIndex = $event"
            @select="onSelectResult"
          />
        </div>

        <!-- Keyboard Hints -->
        <SearchKeyboardHints />
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import type { GlobalSearchResult } from '../../types/index.ts';

// Composables
import { useSearchNavigation } from '../../composables/search/useSearchNavigation.ts';
import { useSearchHighlight } from '../../composables/search/useSearchHighlight.ts';
import { useClickOutside } from '../../composables/search/useClickOutside.ts';

// Stores
import { useSearch } from '../../stores/search.ts';
import { useCollectionsStore } from '../../stores/collections.ts';
import { useActions } from '../../stores/actions.ts';

// Shared UI
import Icon from '../icons/Icon.vue';
import EmptyState from '../ui/EmptyState.vue';
import SearchDropdownHeader from './SearchDropdownHeader.vue';
import SearchResultsList from './SearchResultsList.vue';
import SearchKeyboardHints from './SearchKeyboardHints.vue';

// ---------------------------------------------------------------------------
// STORES
// ---------------------------------------------------------------------------
const { query, dropdownOpen, setQuery, setDropdown } = useSearch();
const { globalResults, globalResultCount } = useCollectionsStore();
const { selectGlobalResult } = useActions();

// ---------------------------------------------------------------------------
// REFS
// ---------------------------------------------------------------------------
const searchInputRef = ref<HTMLInputElement | null>(null);
const searchWrapperRef = ref<HTMLElement | null>(null);

// ---------------------------------------------------------------------------
// COMPOSABLES
// ---------------------------------------------------------------------------
const { focusedIndex, getFlatIndex, moveFocus, resetFocus, getFocusedResult } =
  useSearchNavigation(() => globalResults.value, () => searchWrapperRef.value);

const { highlightText } = useSearchHighlight();
const highlight = (text: string) => highlightText(text, query.value);
useClickOutside(() => searchWrapperRef.value, closeDropdown);

// ---------------------------------------------------------------------------
// KEYBOARD SHORTCUT (Ctrl/Cmd + K)
// ---------------------------------------------------------------------------
const isMac = typeof navigator !== 'undefined' && /Mac/.test(navigator.platform);
const shortcutLabel = isMac ? '⌘K' : 'Ctrl K';

function onGlobalKeydown(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    searchInputRef.value?.focus();
  }
}

onMounted(() => window.addEventListener('keydown', onGlobalKeydown));
onUnmounted(() => window.removeEventListener('keydown', onGlobalKeydown));

// ---------------------------------------------------------------------------
// COMPUTED
// ---------------------------------------------------------------------------
const hasQuery = computed(() => query.value.length > 0);
const shouldShowDropdown = computed(() => dropdownOpen.value && query.value.trim());

const dropdownTransition = {
  enterActiveClass: 'transition duration-150 ease-out',
  enterFromClass: 'opacity-0 translate-y-1 scale-95',
  enterToClass: 'opacity-100 translate-y-0 scale-100',
  leaveActiveClass: 'transition duration-150 ease-in',
  leaveFromClass: 'opacity-100 translate-y-0 scale-100',
  leaveToClass: 'opacity-0 translate-y-1 scale-95',
} as const;

// ---------------------------------------------------------------------------
// HANDLERS
// ---------------------------------------------------------------------------
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
  searchInputRef.value?.focus();
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

function onSelectResult(result: GlobalSearchResult) {
  selectGlobalResult(result.collection.id, result.item.itemId);
  closeDropdown();
}
</script>
