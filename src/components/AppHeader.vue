<template>
  <header class="flex items-center gap-3 h-14 px-3 shrink-0 z-50 transition-colors duration-300
                 bg-white border-b border-slate-200 shadow-sm
                 dark:bg-slate-900 dark:border-slate-800 dark:shadow-md">

    <!-- Mobile sidebar toggle -->
    <button
      v-if="mobile"
      @click="$emit('toggleSidebar')"
      class="lg:hidden p-2 rounded-lg transition-colors shrink-0
             text-slate-500 hover:bg-slate-100 hover:text-slate-800
             dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
      aria-label="Toggle Sidebar"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
      </svg>
    </button>

    <!-- Collection tabs -->
    <nav class="flex items-center gap-1 shrink-0">
      <button
        v-for="col in collections"
        :key="col.id"
        @click="$emit('switchCollection', col.id)"
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors"
        :class="col.id === activeCollectionId
          ? 'bg-blue-600 text-white'
          : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800'"
      >
        <span>{{ col.emoji }}</span>
        <span class="hidden sm:inline">{{ col.label }}</span>
      </button>
    </nav>

    <div class="w-px h-6 shrink-0 hidden sm:block bg-slate-200 dark:bg-slate-700" />
    <div class="flex-1" />

    <!-- Search -->
    <div class="relative w-36 sm:w-48 md:w-56 shrink-0">
      <div class="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
        <svg class="h-3.5 w-3.5 text-slate-400 dark:text-slate-500"
             xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"/>
        </svg>
      </div>
      <input
        type="text"
        :value="searchQuery"
        @input="$emit('updateSearch', ($event.target as HTMLInputElement).value)"
        :placeholder="`Search ${activeCollection?.label?.toLowerCase() ?? ''}s...`"
        class="block w-full pl-7 pr-6 py-1.5 rounded-md text-sm border transition-colors
               focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
               bg-slate-100 border-slate-200 text-slate-900 placeholder-slate-400
               dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 dark:placeholder-slate-500"
      />
      <button
        v-if="searchQuery"
        @click="$emit('updateSearch', '')"
        class="absolute inset-y-0 right-0 pr-2 flex items-center
               text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
      >
        <svg class="h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
        </svg>
      </button>
    </div>

    <!-- View mode toggle -->
    <button
      @click="$emit('toggleViewMode')"
      class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-colors shrink-0"
      :class="viewMode === 'date'
        ? 'bg-blue-600/20 text-blue-500 border border-blue-500/30'
        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800'"
    >
      <svg v-if="viewMode === 'group'" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
      <svg v-else xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
      </svg>
      <span class="hidden lg:inline">
        {{ viewMode === 'group' ? `By ${activeCollection?.groupLabel ?? ''}` : 'By Date' }}
      </span>
    </button>

    <div class="w-px h-6 shrink-0 bg-slate-200 dark:bg-slate-700" />

    <!-- Global progress tracker -->
    <div
      v-if="!loading"
      class="flex flex-col items-end shrink-0 gap-0.5"
      :title="`${globalStats.drawn} drawn out of ${globalStats.total} total`"
    >
      <div class="flex items-baseline gap-1">
        <span class="text-sm font-bold tabular-nums text-slate-800 dark:text-slate-100">{{ globalStats.drawn }}</span>
        <span class="text-xs text-slate-400 dark:text-slate-500">/</span>
        <span class="text-xs tabular-nums text-slate-500 dark:text-slate-400">{{ globalStats.total }}</span>
      </div>
      <div class="w-16 h-1 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700">
        <div
          class="h-full rounded-full bg-blue-500 transition-all duration-500"
          :style="{ width: globalStats.total > 0 ? `${(globalStats.drawn / globalStats.total) * 100}%` : '0%' }"
        />
      </div>
    </div>

    <!-- Theme toggle -->
    <button
      @click="$emit('toggleTheme')"
      class="flex items-center justify-center w-8 h-8 rounded-full transition-colors shrink-0
             bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-yellow-500
             dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-yellow-400"
      aria-label="Toggle Dark Mode"
    >
      <svg v-if="isDark" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
        <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
      </svg>
      <svg v-else xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
      </svg>
    </button>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { type CollectionConfig } from '../types/collections';
import { type GlobalStats } from '../types/ui';

const props = defineProps<{
  collections:        CollectionConfig[];
  activeCollectionId: string;
  viewMode:           'group' | 'date';
  globalStats:        GlobalStats;
  loading:            boolean;
  isDark:             boolean;
  mobile:             boolean;
  searchQuery:        string;
}>();

defineEmits<{
  toggleSidebar:    [];
  switchCollection: [id: string];
  updateSearch:     [query: string];
  toggleViewMode:   [];
  toggleTheme:      [];
}>();

const activeCollection = computed(() =>
  props.collections.find(c => c.id === props.activeCollectionId)
);
</script>