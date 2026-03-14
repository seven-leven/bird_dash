<template>
  <div class="relative shrink-0" ref="searchWrapperRef">
    <!-- Input Field -->
    <div
      class="relative w-44 sm:w-56 md:w-72 transition-all duration-200"
      :class="{ 'md:w-96': searchState.isOpen }"
    >
      <div class="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
        <svg class="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"/>
        </svg>
      </div>

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
        class="block w-full pl-7 pr-6 py-1.5 rounded-md text-sm border transition-colors
               focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
               bg-slate-100 border-slate-200 text-slate-900 placeholder-slate-400
               dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 dark:placeholder-slate-500"
      />

      <button
        v-if="searchState.query"
        @click="clearSearch"
        class="absolute inset-y-0 right-0 pr-2 flex items-center text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
        tabindex="-1"
      >
        <svg class="h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
        </svg>
      </button>
    </div>

    <!-- Dropdown -->
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 translate-y-1 scale-95"
      enter-to-class="opacity-100 translate-y-0 scale-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100 translate-y-0 scale-100"
      leave-to-class="opacity-0 translate-y-1 scale-95"
    >
      <div
        v-if="searchState.isOpen && searchState.query.trim()"
        class="absolute right-0 top-full mt-2 w-full min-w-90 max-w-130
               rounded-xl border shadow-2xl z-200 overflow-hidden
               bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-700"
      >
        <!-- Header -->
        <div class="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
          <span class="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Global results</span>
          <span class="text-xs font-bold tabular-nums px-2 py-0.5 rounded-full"
                :class="resultCount > 0 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' : 'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400'">
            {{ resultCount }} {{ resultCount === 1 ? 'result' : 'results' }}
          </span>
        </div>

        <!-- No Results -->
        <div v-if="resultCount === 0" class="flex flex-col items-center justify-center py-10 gap-2 text-slate-400 dark:text-slate-600">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
          <p class="text-sm">No matches found</p>
        </div>

        <!-- Scrollable Results -->
        <div v-else class="overflow-y-auto max-h-105 divide-y divide-slate-100 dark:divide-slate-800">
          <div v-for="group in results" :key="group.collection.id">
            <div class="flex items-center justify-between px-4 py-1.5 bg-slate-50/80 dark:bg-slate-800/40 sticky top-0 z-10">
              <div class="flex items-center gap-2">
                <span class="text-base leading-none">{{ group.collection.emoji }}</span>
                <span class="text-xs font-semibold text-slate-600 dark:text-slate-300">{{ group.collection.label }}</span>
              </div>
              <span class="text-xs font-bold tabular-nums px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300">{{ group.count }}</span>
            </div>

            <button
              v-for="(result, idx) in group.results"
              :key="result.item.itemId"
              :data-result-idx="getFlatIndex(group.collection.id, idx)"
              @mouseenter="focusedIndex = getFlatIndex(group.collection.id, idx)"
              @click="selectResult(result)"
              class="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-blue-50 dark:hover:bg-blue-950/30"
              :class="{ 'bg-blue-50 dark:bg-blue-950/30': focusedIndex === getFlatIndex(group.collection.id, idx) }"
            >
              <img :src="result.item.imageUrl" class="w-9 h-9 rounded-md object-cover shrink-0 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" loading="lazy" />
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium truncate text-slate-800 dark:text-slate-100" v-html="highlightText(result.item.commonName, searchState.query)" />
                <div class="flex items-center gap-2 mt-0.5">
                  <span class="text-xs text-slate-400 dark:text-slate-500 italic truncate" v-html="highlightText(result.item.scientificName, searchState.query)" />
                </div>
              </div>
              <span class="text-xs tabular-nums font-mono px-1.5 py-0.5 rounded shrink-0 bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400" v-html="highlightText(`#${result.item.itemId}`, searchState.query)" />
            </button>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-4 py-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center gap-3">
          <kbd class="text-[10px] px-1.5 py-0.5 rounded border bg-white border-slate-300 text-slate-500 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-400">↑↓</kbd>
          <span class="text-[10px] text-slate-400 dark:text-slate-500">navigate</span>
          <kbd class="text-[10px] px-1.5 py-0.5 rounded border bg-white border-slate-300 text-slate-500 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-400">↵</kbd>
          <span class="text-[10px] text-slate-400 dark:text-slate-500">select</span>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import type { GlobalSearchCollectionGroup, GlobalSearchState } from '../../types/index.ts';

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

const searchInputRef = ref<HTMLInputElement | null>(null);
const searchWrapperRef = ref<HTMLElement | null>(null);
const focusedIndex = ref(-1);

// Flattening for keyboard nav
const flatResults = computed(() => props.results.flatMap((g) => g.results));

function getFlatIndex(collectionId: string, localIdx: number): number {
  let offset = 0;
  for (const g of props.results) {
    if (g.collection.id === collectionId) return offset + localIdx;
    offset += g.results.length;
  }
  return -1;
}

// Highlighting Logic
function highlightText(text: string, query: string): string {
  if (!query.trim()) return escapeHtml(text);
  const escaped = escapeHtml(text);
  const escapedQuery = escapeHtml(query.trim()).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return escaped.replace(
    new RegExp(`(${escapedQuery})`, 'gi'),
    '<mark class="bg-yellow-200 dark:bg-yellow-700/60 text-inherit rounded-[2px] px-[1px]">$1</mark>',
  );
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Handlers
function onInput(value: string) {
  focusedIndex.value = -1;
  emit('update', value);
  if (value.trim()) emit('open');
}

function openDropdown() {
  if (props.searchState.query.trim()) emit('open');
}

function closeDropdown() {
  focusedIndex.value = -1;
  emit('close');
}

function clearSearch() {
  emit('update', '');
  emit('close');
  searchInputRef.value?.focus();
}

function moveFocus(delta: number) {
  const total = flatResults.value.length;
  if (total === 0) return;
  focusedIndex.value = (focusedIndex.value + delta + total) % total;
  const el = searchWrapperRef.value?.querySelector(`[data-result-idx="${focusedIndex.value}"]`) as HTMLElement;
  el?.scrollIntoView({ block: 'nearest' });
}

function selectFocused() {
  if (focusedIndex.value >= 0 && focusedIndex.value < flatResults.value.length) {
    selectResult(flatResults.value[focusedIndex.value]);
  }
}

function selectResult(result: any) {
  emit('select', result.collection.id, result.item.itemId);
  closeDropdown();
}

function onClickOutside(e: MouseEvent) {
  if (searchWrapperRef.value && !searchWrapperRef.value.contains(e.target as Node)) {
    closeDropdown();
  }
}

onMounted(() => document.addEventListener('mousedown', onClickOutside));
onUnmounted(() => document.removeEventListener('mousedown', onClickOutside));
</script>