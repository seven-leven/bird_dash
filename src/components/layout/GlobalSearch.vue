<!-- components/search/GlobalSearch.vue -->
<template>
  <div class="relative shrink-0" ref="searchWrapperRef">
    
    <!-- ==================== INPUT FIELD ==================== -->
    <div
      class="relative w-44 sm:w-56 md:w-72 transition-all duration-200"
      :class="{ 'md:w-96': searchState.isOpen }"
    >
      <!-- Search Icon -->
      <div class="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
        <IconSearch class="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
      </div>

      <!-- Input -->
      <input
        ref="searchInputRef"
        type="text"
        :value="searchState.query"
        @input="onInput(($event.target as HTMLInputElement).value)"
        @focus="openDropdown"
        @keydown.escape="closeDropdown"
        @keydown.down.prevent="moveFocus(1)"
        @keydown.up.prevent="moveFocus(-1)"
        @keydown.enter.prevent="selectFocused"
        placeholder="Search all collections…"
        autocomplete="off"
        class="block w-full pl-7 pr-6 py-1.5 rounded-md text-sm border transition-all duration-150
               focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400
               bg-slate-100/80 border-transparent text-slate-900 placeholder-slate-400
               dark:bg-slate-800/80 dark:border-transparent dark:text-slate-100 dark:placeholder-slate-500
               dark:focus:ring-slate-600 dark:focus:border-slate-600"
      />

      <!-- Clear Button -->
      <button
        v-if="hasQuery"
        @click="clearSearch"
        class="absolute inset-y-0 right-0 pr-2 flex items-center text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
        tabindex="-1"
        aria-label="Clear search"
      >
        <IconClose class="h-3.5 w-3.5" />
      </button>
    </div>

    <!-- ==================== DROPDOWN ==================== -->
    <Transition v-bind="dropdownTransition">
      <div
        v-if="shouldShowDropdown"
        class="absolute right-0 top-full mt-1.5 w-full min-w-90 max-w-130
               rounded-xl border shadow-xl z-200 overflow-hidden
               bg-white border-slate-200/80 dark:bg-slate-900 dark:border-slate-700/80"
        role="listbox"
        aria-label="Search results"
      >
        <!-- Header -->
        <SearchDropdownHeader :count="resultCount" />

        <!-- States -->
        <div v-if="resultCount === 0" class="flex flex-col items-center justify-center py-10 gap-1.5 text-slate-300 dark:text-slate-600">
          <IconNoResults class="w-6 h-6" />
          <p class="text-xs">No matches found</p>
        </div>

        <div v-else class="overflow-y-auto max-h-105 divide-y divide-slate-100 dark:divide-slate-800">
          <SearchResultsList
            :results="results"
            :query="searchState.query"
            :focused-index="focusedIndex"
            :get-flat-index="getFlatIndex"
            :highlight="highlightText"
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
import { ref, computed } from 'vue';
import type { 
  GlobalSearchCollectionGroup, 
  GlobalSearchState,
  CollectionItem 
} from '../../types/index.ts';

// Composables
import { useSearchNavigation } from '../../composables/search/useSearchNavigation.ts';
import { useSearchHighlight } from '../../composables/search/useSearchHighlight.ts';
import { useClickOutside } from '../../composables/search/useClickOutside.ts';

// Inline sub-components (kept in same file)
import IconSearch from './icons/IconSearch.vue';
import IconClose from './icons/IconClose.vue';
import IconNoResults from './icons/IconNoResults.vue';
import SearchDropdownHeader from './SearchDropdownHeader.vue';
import SearchResultsList from './SearchResultsList.vue';
import SearchKeyboardHints from './SearchKeyboardHints.vue';

// ---------------------------------------------------------------------------
// PROPS & EMITS
// ---------------------------------------------------------------------------
const props = defineProps<{
  searchState: GlobalSearchState;
  results: GlobalSearchCollectionGroup[];
  resultCount: number;
}>();

const emit = defineEmits<{
  update: [query: string];
  select: [collectionId: string, itemId: string];
  open: [];
  close: [];
}>();

// ---------------------------------------------------------------------------
// REFS
// ---------------------------------------------------------------------------
const searchInputRef = ref<HTMLInputElement | null>(null);
const searchWrapperRef = ref<HTMLElement | null>(null);

// ---------------------------------------------------------------------------
// COMPOSABLES
// ---------------------------------------------------------------------------
const { focusedIndex, getFlatIndex, moveFocus, resetFocus, getFocusedResult } =
  useSearchNavigation(() => props.results, () => searchWrapperRef.value);

const { highlightText } = useSearchHighlight();
useClickOutside(() => searchWrapperRef.value, closeDropdown);

// ---------------------------------------------------------------------------
// COMPUTED
// ---------------------------------------------------------------------------
const hasQuery = computed(() => props.searchState.query.length > 0);
const shouldShowDropdown = computed(() =>
  props.searchState.isOpen && props.searchState.query.trim()
);

const dropdownTransition = {
  enterActiveClass: 'transition duration-150 ease-out',
  enterFromClass: 'opacity-0 translate-y-1 scale-95',
  enterToClass: 'opacity-100 translate-y-0 scale-100',
  leaveActiveClass: 'transition duration-100 ease-in',
  leaveFromClass: 'opacity-100 translate-y-0 scale-100',
  leaveToClass: 'opacity-0 translate-y-1 scale-95'
} as const;

// ---------------------------------------------------------------------------
// HANDLERS
// ---------------------------------------------------------------------------
function onInput(value: string) {
  resetFocus();
  emit('update', value);
  if (value.trim()) emit('open');
}

function openDropdown() {
  if (props.searchState.query.trim()) emit('open');
}

function closeDropdown() {
  resetFocus();
  emit('close');
}

function clearSearch() {
  emit('update', '');
  emit('close');
  searchInputRef.value?.focus();
}

function selectFocused() {
  const result = getFocusedResult();
  if (result) onSelectResult(result);
}

function onSelectResult(result: { collection: { id: string }; item: Pick<CollectionItem, 'itemId'> }) {
  emit('select', result.collection.id, result.item.itemId);
  closeDropdown();
}
</script>