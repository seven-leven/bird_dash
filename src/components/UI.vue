<template>
  <!-- Root: flex COLUMN — header spans full width, body row below -->
  <div class="flex flex-col h-screen w-full overflow-hidden"
       :class="isDark ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'">

    <!-- ══════════════════════════════════════════════════════════════════
         TOP BAR — full width, single row, theme-aware
         ══════════════════════════════════════════════════════════════════ -->
    <header class="flex items-center gap-3 h-14 px-3 shrink-0 z-50 transition-colors duration-300"
            :class="isDark
              ? 'bg-slate-900 border-b border-slate-800 shadow-md'
              : 'bg-white border-b border-slate-200 shadow-sm'">

      <!-- Mobile sidebar toggle -->
      <button
        v-if="mobile"
        @click="$emit('toggleSidebar')"
        class="lg:hidden p-2 rounded-lg transition-colors shrink-0"
        :class="isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'"
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
            : isDark
              ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'"
        >
          <span>{{ col.emoji }}</span>
          <span class="hidden sm:inline">{{ col.label }}</span>
        </button>
      </nav>

      <!-- Divider -->
      <div class="w-px h-6 shrink-0 hidden sm:block"
           :class="isDark ? 'bg-slate-700' : 'bg-slate-200'" />

      <!-- Spacer -->
      <div class="flex-1" />

      <!-- Search -->
      <div class="relative w-36 sm:w-48 md:w-56 shrink-0">
        <div class="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
          <svg class="h-3.5 w-3.5" :class="isDark ? 'text-slate-500' : 'text-slate-400'"
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
                 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          :class="isDark
            ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500'
            : 'bg-slate-100 border-slate-200 text-slate-900 placeholder-slate-400'"
        />
        <button
          v-if="searchQuery"
          @click="$emit('updateSearch', '')"
          class="absolute inset-y-0 right-0 pr-2 flex items-center"
          :class="isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'"
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
          : isDark
            ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'"
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

      <!-- Divider -->
      <div class="w-px h-6 shrink-0"
           :class="isDark ? 'bg-slate-700' : 'bg-slate-200'" />

      <!-- Global progress tracker -->
      <div
        v-if="!loading"
        class="flex flex-col items-end shrink-0 gap-0.5"
        :title="`${globalStats.drawn} drawn out of ${globalStats.total} total`"
      >
        <div class="flex items-baseline gap-1">
          <span class="text-sm font-bold tabular-nums" :class="isDark ? 'text-slate-100' : 'text-slate-800'">{{ globalStats.drawn }}</span>
          <span class="text-xs" :class="isDark ? 'text-slate-500' : 'text-slate-400'">/</span>
          <span class="text-xs tabular-nums" :class="isDark ? 'text-slate-400' : 'text-slate-500'">{{ globalStats.total }}</span>
        </div>
        <div class="w-16 h-1 rounded-full overflow-hidden" :class="isDark ? 'bg-slate-700' : 'bg-slate-200'">
          <div
            class="h-full rounded-full bg-blue-500 transition-all duration-500"
            :style="{ width: globalStats.total > 0 ? `${(globalStats.drawn / globalStats.total) * 100}%` : '0%' }"
          />
        </div>
      </div>

      <!-- Theme toggle -->
      <button
        @click="$emit('toggleTheme')"
        class="flex items-center justify-center w-8 h-8 rounded-full transition-colors shrink-0"
        :class="isDark
          ? 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-yellow-400'
          : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-yellow-500'"
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

    <!-- ══════════════════════════════════════════════════════════════════
         BODY ROW — sidebar + main, below the header
         ══════════════════════════════════════════════════════════════════ -->
    <div class="flex flex-1 overflow-hidden">

      <!-- Mobile overlay -->
      <div
        v-if="client && mobile"
        class="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity"
        :class="sidebarOpen ? 'opacity-100 visible' : 'opacity-0 invisible'"
        @click="$emit('closeSidebar')"
        aria-hidden="true"
      />

      <!-- ── Sidebar ── -->
      <aside
        id="appSidebar"
        class="fixed inset-y-0 left-0 z-50 w-72 shrink-0 flex flex-col
               border-r transition-all duration-300 ease-out shadow-2xl
               lg:static lg:translate-x-0 lg:shadow-none"
        :class="[
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        ]"
      >
        <!-- Sidebar header -->
        <div class="sticky top-0 z-10 p-6 pb-4 transition-colors"
             :class="isDark ? 'bg-slate-900' : 'bg-white'">
          <h1 class="text-2xl font-extrabold tracking-tight"
              :class="isDark ? 'text-white' : 'text-slate-800'">
            {{ viewMode === 'group'
                ? `${activeCollection?.groupLabel ?? ''} Groups`
                : 'Timeline' }}
          </h1>
          <p class="text-sm text-slate-500 mt-1">
            <template v-if="viewMode === 'group'">
              {{ stats?.drawn ?? 0 }} drawn / {{ stats?.total ?? 0 }} total
            </template>
            <template v-else>
              {{ stats?.filtered ?? 0 }} drawings
            </template>
          </p>
        </div>

        <!-- Sidebar list -->
        <div class="flex-1 overflow-y-auto px-4 pb-6 custom-scrollbar">
          <ul v-if="sidebarItems.length" class="space-y-1">
            <li
              v-for="item in sidebarItems"
              :key="item.id"
              class="rounded-lg px-4 py-2.5 text-sm font-medium transition-colors flex items-center justify-between"
              :class="item.disabled
                ? 'text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-60'
                : 'cursor-pointer ' + (item.id === activeSection
                  ? (isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-50 text-blue-700')
                  : (isDark ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'))"
              @click="!item.disabled && $emit('goToSection', item.id)"
            >
              <span class="truncate pr-2">{{ item.label }}</span>
              <span class="text-xs shrink-0 opacity-60">
                <template v-if="viewMode === 'group' && item.total">{{ item.count }}/{{ item.total }}</template>
                <template v-else>{{ item.count }}</template>
              </span>
            </li>
          </ul>
          <div v-else-if="!loading && !error" class="p-4 text-center text-sm text-slate-500 italic">
            No items found.
          </div>
        </div>
      </aside>

      <!-- ── Main content ── -->
      <main class="relative flex flex-1 flex-col overflow-hidden">

        <!-- Active section label — sticky bar above the grid only, inside main -->
        <div
          v-if="!loading && !error && activeSection"
          class="shrink-0 px-6 py-2 border-b text-sm font-semibold transition-colors"
          :class="isDark
            ? 'bg-slate-900/95 border-slate-800 text-slate-300'
            : 'bg-white/95 border-slate-200 text-slate-600'"
        >
          {{ activeSection }}
        </div>

        <!-- Scrollable grid -->
        <div
          ref="scrollContainer"
          class="flex-1 overflow-y-auto p-6 scroll-smooth custom-scrollbar"
          @scroll="$emit('scroll')"
        >
          <!-- Loading skeleton -->
          <div v-if="loading" class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
            <div v-for="n in 10" :key="n" class="aspect-square rounded-2xl animate-pulse"
                 :class="isDark ? 'bg-slate-800' : 'bg-slate-200'" />
          </div>

          <!-- Error -->
          <div v-else-if="error" class="mx-auto mt-10 max-w-lg rounded-xl border p-6 text-center"
               :class="isDark ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200'">
            <h2 class="mb-2 text-lg font-bold" :class="isDark ? 'text-red-400' : 'text-red-700'">Error Loading Data</h2>
            <p :class="isDark ? 'text-red-300' : 'text-red-600'">{{ error }}</p>
          </div>

          <!-- Empty -->
          <div v-else-if="Object.keys(grouped).length === 0" class="mt-20 text-center text-slate-500">
            <h2 class="text-xl font-semibold">No drawings found</h2>
            <p class="mt-2">{{ searchQuery ? 'Try a different search term.' : 'Check back later for new illustrations.' }}</p>
          </div>

          <template v-else>
            <!-- Search info -->
            <div v-if="searchQuery" class="mb-6 text-sm text-slate-500">
              Found {{ stats?.filtered ?? 0 }} result{{ (stats?.filtered ?? 0) !== 1 ? 's' : '' }} for "{{ searchQuery }}"
              <button @click="$emit('updateSearch', '')" class="ml-2 text-blue-600 hover:underline">Clear</button>
            </div>

            <!-- Grouped sections -->
            <section
              v-for="(items, groupName) in grouped"
              :key="groupName"
              class="mb-12 scroll-mt-10"
            >
              <h2
                :ref="el => { if (el) headerRefs[String(groupName)] = el as HTMLElement }"
                class="mb-6 border-b pb-2 text-2xl font-bold flex items-center justify-between transition-colors"
                :class="isDark
                  ? 'text-slate-100 border-slate-800'
                  : 'text-slate-800 border-slate-200'"
              >
                <span>{{ groupName }}</span>
                <span class="text-sm font-normal text-slate-500">
                  {{ items.filter(i => i.imageUrl !== placeholderImage).length }} drawn
                  <template v-if="viewMode === 'group'">/ {{ items.length }} total</template>
                </span>
              </h2>

              <div class="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-6 sm:grid-cols-[repeat(auto-fill,minmax(200px,1fr))]">
                <GridItemCard
                  v-for="item in items"
                  :key="item.id"
                  :item="item"
                  :placeholder-image="placeholderImage"
                  @card-click="$emit('cardClick', $event)"
                />
              </div>
            </section>
          </template>

          <footer class="mt-12 pt-8 pb-6 border-t text-center text-sm transition-colors"
                  :class="isDark ? 'border-slate-800 text-slate-500' : 'border-slate-200 text-slate-400'">
            <p class="mb-1">Maldives Illustrated © {{ new Date().getFullYear() }}</p>
            <p class="opacity-50">v{{ appVersion }}</p>
          </footer>
        </div>
      </main>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import GridItemCard from './GridItemCard.vue';
import { type CollectionConfig, type CollectionItem } from '../collections';
import versionData from '../version.json';

const displayVersion = `${versionData.major}.${versionData.minor}.${versionData.patch}`;
const appVersion     = `${displayVersion}+${versionData.count}`;

const props = defineProps<{
  collections:        CollectionConfig[];
  activeCollectionId: string;
  globalStats:        { drawn: number; total: number };
  sidebarOpen:        boolean;
  mobile:             boolean;
  client:             boolean;
  isDark:             boolean;
  loading:            boolean;
  error?:             string;
  grouped:            Record<string, CollectionItem[]>;
  sidebarItems:       { id: string; label: string; count: number; total: number; disabled: boolean }[];
  activeSection?:     string;
  viewMode:           'group' | 'date';
  stats:              { total: number; filtered: number; drawn: number; mode: string };
  placeholderImage:   string;
  searchQuery:        string;
}>();

defineEmits([
  'switchCollection',
  'closeSidebar', 'toggleSidebar', 'toggleTheme', 'toggleViewMode',
  'goToSection', 'scroll', 'cardClick', 'updateSearch',
]);

const activeCollection = computed<CollectionConfig>(() =>
  props.collections.find(c => c.id === props.activeCollectionId) ?? props.collections[0]
);

const scrollContainer = ref<HTMLElement | null>(null);
const headerRefs      = ref<Record<string, HTMLElement>>({});

defineExpose({ scrollContainer, headerRefs });
</script>