<template>
  <div class="flex h-screen w-full overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
    
    <!-- Mobile Overlay -->
    <div
      v-if="client && mobile"
      class="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity"
      :class="sidebarOpen ? 'opacity-100 visible' : 'opacity-0 invisible'"
      @click="$emit('closeSidebar')"
      aria-hidden="true"
    />

    <!-- Sidebar -->
    <aside
      id="appSidebar"
      class="
        fixed inset-y-0 left-0 z-50 w-72 shrink-0
        flex flex-col
        bg-white dark:bg-slate-900 
        border-r border-slate-200 dark:border-slate-800
        transition-transform duration-300 ease-out shadow-2xl lg:shadow-none
        lg:static lg:translate-x-0
      "
      :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full'"
    >
      <!-- Sidebar Title -->
      <div class="sticky top-0 z-10 bg-white dark:bg-slate-900 p-6 pb-4">
        <h1 class="text-2xl font-extrabold tracking-tight text-slate-800 dark:text-white">
          {{ viewMode === 'family' ? 'Bird Groups' : 'Timeline' }}
        </h1>
        <p class="text-sm text-slate-500 mt-1">
          <template v-if="viewMode === 'family'">
            {{ stats.drawn }} drawn / {{ stats.total }} total
          </template>
          <template v-else>
            {{ stats.filtered }} drawings
          </template>
        </p>
      </div>
      
      <!-- Sidebar List -->
      <div class="flex-1 overflow-y-auto px-4 pb-6 custom-scrollbar">
        <ul v-if="sidebarItems.length" class="space-y-1">
          <li
            v-for="item in sidebarItems"
            :key="item.id"
            class="rounded-lg px-4 py-2.5 text-sm font-medium transition-colors flex items-center justify-between"
            :class="[
              item.disabled 
                ? 'text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-60'
                : 'cursor-pointer ' + (item.id === activeSection 
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' 
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800')
            ]"
            @click="!item.disabled && $emit('goToSection', item.id)"
          >
            <span class="truncate pr-2">{{ item.label }}</span>
            <span 
              class="text-xs shrink-0"
              :class="item.disabled ? 'opacity-50' : 'opacity-60'"
            >
              <template v-if="viewMode === 'family' && item.total">
                {{ item.count }}/{{ item.total }}
              </template>
              <template v-else>
                {{ item.count }}
              </template>
            </span>
          </li>
        </ul>
        
        <div v-else-if="!loading && !error" class="p-4 text-center text-sm text-slate-500 italic">
          No items found.
        </div>
      </div>
    </aside>

    <!-- Main Content Area -->
    <main class="relative flex flex-1 flex-col overflow-hidden">
      
      <!-- Sticky Header -->
      <div class="sticky top-0 z-30 flex items-center justify-between bg-white/90 backdrop-blur-md dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-3 shadow-sm">
        <div class="flex items-center gap-4 flex-1 min-w-0">
          <!-- Mobile Toggle Button -->
          <button
            v-if="mobile"
            @click="$emit('toggleSidebar')"
            class="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
            aria-label="Toggle Sidebar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
          
          <!-- Current Section Title -->
          <span v-if="!loading && !error && activeSection" class="text-base font-bold text-slate-800 dark:text-slate-100 truncate shrink-0 hidden sm:block">
            {{ activeSection }}
          </span>

          <div class="flex-1"></div>

          <!-- Search Input -->
          <div class="relative w-40 sm:w-56 md:w-64 shrink-0">
            <div class="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
              <svg class="h-4 w-4 text-slate-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
              </svg>
            </div>
            <input
              type="text"
              :value="searchQuery"
              @input="$emit('updateSearch', $event.target.value)"
              placeholder="Search..."
              class="block w-full pl-8 pr-7 py-1.5 border border-slate-200 dark:border-slate-700 rounded-md leading-5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-colors"
            />
            <button
              v-if="searchQuery"
              @click="$emit('updateSearch', '')"
              class="absolute inset-y-0 right-0 pr-2 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              <svg class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
              </svg>
            </button>
          </div>

          <!-- View Mode Toggle Button -->
          <button
            @click="$emit('toggleViewMode')"
            class="ml-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shrink-0"
            :class="viewMode === 'date' 
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' 
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'"
          >
            <svg v-if="viewMode === 'family'" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
            </svg>
            <span class="hidden sm:inline">{{ viewMode === 'family' ? 'By Family' : 'By Date' }}</span>
          </button>
        </div>
        
        <!-- Right Side: Stats + Theme -->
        <div class="flex items-center gap-3 ml-4 shrink-0">
          <div v-if="!loading" class="text-sm font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
            {{ stats.filtered }}<span class="text-slate-300 mx-1">/</span>{{ stats.total }}
          </div>

          <button 
            @click="$emit('toggleTheme')"
            class="flex items-center justify-center w-8 h-8 rounded-full transition-colors bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-yellow-400 dark:hover:bg-slate-700 shrink-0"
            aria-label="Toggle Dark Mode"
          >
            <svg v-if="isDark" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="5"></circle>
              <line x1="12" y1="1" x2="12" y2="3"></line>
              <line x1="12" y1="21" x2="12" y2="23"></line>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
              <line x1="1" y1="12" x2="3" y2="12"></line>
              <line x1="21" y1="12" x2="23" y2="12"></line>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
          </button>
        </div>
      </div>

      <!-- Scrollable Grid Area -->
      <div 
        ref="scrollContainer" 
        class="flex-1 overflow-y-auto p-6 scroll-smooth custom-scrollbar" 
        @scroll="$emit('scroll')"
      >
        <!-- Loading Skeleton -->
        <div v-if="loading" class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
          <div v-for="n in 10" :key="n" class="aspect-square rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="mx-auto mt-10 max-w-lg rounded-xl border border-red-200 bg-red-50 p-6 text-center dark:bg-red-900/20 dark:border-red-800">
          <h2 class="mb-2 text-lg font-bold text-red-700 dark:text-red-400">Error Loading Data</h2>
          <p class="text-red-600 dark:text-red-300">{{ error }}</p>
        </div>

        <!-- Empty State -->
        <div v-else-if="Object.keys(grouped).length === 0" class="mt-20 text-center text-slate-500">
          <h2 class="text-xl font-semibold">No drawings found</h2>
          <p class="mt-2">{{ searchQuery ? 'Try a different search term.' : 'Check back later for new illustrations.' }}</p>
        </div>

        <template v-else>
          <!-- Search results info -->
          <div v-if="searchQuery" class="mb-6 text-sm text-slate-500 dark:text-slate-400">
            Found {{ stats.filtered }} result{{ stats.filtered !== 1 ? 's' : '' }} for "{{ searchQuery }}"
            <button @click="$emit('updateSearch', '')" class="ml-2 text-blue-600 dark:text-blue-400 hover:underline">Clear</button>
          </div>

          <!-- Grouped Sections (Family or Date) -->
          <section
            v-for="(birds, groupName) in grouped"
            :key="groupName"
            class="mb-12 scroll-mt-24"
          >
            <h2 
              :ref="el => { if (el) headerRefs[groupName] = el }"
              class="mb-6 border-b border-slate-200 pb-2 text-2xl font-bold text-slate-800 dark:text-slate-100 dark:border-slate-800 flex items-center justify-between"
            >
              <span>{{ groupName }}</span>
              <span class="text-sm font-normal text-slate-500 dark:text-slate-400">
                {{ birds.filter(b => b.imageUrl !== placeholderImage).length }} drawn
                <template v-if="viewMode === 'family'">
                  / {{ birds.length }} total
                </template>
              </span>
            </h2>

            <div class="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-6 sm:grid-cols-[repeat(auto-fill,minmax(200px,1fr))]">
              <GridItemCard
                v-for="bird in birds"
                :key="bird.id"
                :bird="bird"
                :image-base-url="imageBaseUrl"
                :placeholder-image="placeholderImage"
                @card-click="$emit('cardClick', $event)"
              />
            </div>
          </section>
        </template>

        <footer class="mt-12 pt-8 pb-6 border-t border-slate-200 dark:border-slate-800 text-center text-slate-500 dark:text-slate-500 text-sm">
          <p class="mb-1">Bird Dash © {{ new Date().getFullYear() }}</p>
          <p class="opacity-50">v{{ appVersion }}</p>
        </footer>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import GridItemCard from './GridItemCard.vue';
import versionData from '../version.json';

const displayVersion = `${versionData.major}.${versionData.minor}.${versionData.patch}`;
const appVersion = `${displayVersion}+${versionData.count}`;

defineProps({
  sidebarOpen: Boolean,
  mobile: Boolean,
  client: Boolean,
  isDark: Boolean,
  loading: Boolean,
  error: String,
  grouped: { type: Object, required: true },
  sidebarItems: { type: Array, required: true }, // { id, label, count, total?, disabled? }[]
  activeSection: String,
  viewMode: { type: String, required: true },
  stats: { type: Object, required: true },
  imageBaseUrl: String,
  placeholderImage: String,
  searchQuery: { type: String, default: '' }
});

defineEmits([
  'closeSidebar', 'toggleSidebar', 'toggleTheme', 'toggleViewMode',
  'goToSection', 'scroll', 'cardClick', 'updateSearch'
]);

const scrollContainer = ref(null);
const headerRefs = ref({});

defineExpose({
  scrollContainer,
  headerRefs
});
</script>