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
      aria-labelledby="sidebarTitleHeading"
    >
      <!-- Sidebar Title -->
      <div class="sticky top-0 z-10 bg-white dark:bg-slate-900 p-6 pb-4">
        <h1 id="sidebarTitleHeading" class="text-2xl font-extrabold tracking-tight text-slate-800 dark:text-white">
          Bird Groups
        </h1>
      </div>
      
      <!-- Sidebar List -->
      <div class="flex-1 overflow-y-auto px-4 pb-6 custom-scrollbar">
        <ul v-if="families.length" class="space-y-1">
          <li
            v-for="name in families"
            :key="name"
            :ref="el => sidebarRefs[name] = el"
            class="
              cursor-pointer rounded-lg px-4 py-2.5 text-sm font-medium transition-colors
              focus:outline-none focus:ring-2 focus:ring-blue-500
            "
            :class="[
              name === activeFamily 
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' 
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
            ]"
            tabindex="0"
            @click="$emit('goToFamily', name)"
            @keydown.enter="$emit('goToFamily', name)"
            @keydown.space.prevent="$emit('goToFamily', name)"
          >
            {{ name }}
          </li>
        </ul>
        
        <div v-else-if="!loading && !error" class="p-4 text-center text-sm text-slate-500 italic">
          No bird families found.
        </div>
      </div>
    </aside>

    <!-- Main Content Area -->
    <main class="relative flex flex-1 flex-col overflow-hidden">
      
      <!-- Sticky Header -->
      <div class="
        sticky top-0 z-30 flex items-center justify-between 
        bg-white/90 backdrop-blur-md dark:bg-slate-900/90
        border-b border-slate-200 dark:border-slate-800
        px-6 py-4 shadow-sm
      ">
        <div class="flex items-center gap-3">
          <!-- Mobile Toggle Button -->
          <button
            v-if="mobile"
            @click="$emit('toggleSidebar')"
            class="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Toggle Sidebar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
          
          <!-- Family Title -->
          <span v-if="!loading && !error && activeFamily" class="text-lg font-bold text-slate-800 dark:text-slate-100">
            {{ activeFamily }}
          </span>
        </div>
        
        <!-- RIGHT SIDE: Stats + Theme Toggle -->
        <div class="flex items-center gap-4">
          
          <!-- Stats Display -->
          <div v-if="!loading && total > 0" class="text-sm font-medium text-slate-500 dark:text-slate-400">
            {{ drawn }} <span class="text-slate-300 mx-1">/</span> {{ total }} Drawn
          </div>

          <!-- THEME SWITCH BUTTON -->
          <button 
            @click="$emit('toggleTheme')"
            class="
              flex items-center justify-center w-8 h-8 rounded-full transition-colors
              bg-slate-100 text-slate-600 hover:bg-slate-200 
              dark:bg-slate-800 dark:text-yellow-400 dark:hover:bg-slate-700
            "
            aria-label="Toggle Dark Mode"
          >
            <!-- Sun Icon (Show when Dark) -->
            <svg v-if="isDark" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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
            
            <!-- Moon Icon (Show when Light) -->
            <svg v-else xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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
        <!-- Loading State (Skeletons) -->
        <div v-if="loading" class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
          <div 
            v-for="n in 10" 
            :key="n" 
            class="aspect-square rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse"
          />
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="mx-auto mt-10 max-w-lg rounded-xl border border-red-200 bg-red-50 p-6 text-center dark:bg-red-900/20 dark:border-red-800">
          <h2 class="mb-2 text-lg font-bold text-red-700 dark:text-red-400">Error Loading Data</h2>
          <p class="text-red-600 dark:text-red-300">{{ error }}</p>
          <p class="mt-4 text-xs text-red-500">Please ensure public/birds.txt exists and is accessible.</p>
        </div>

        <!-- Empty State -->
        <div v-else-if="!families.length" class="mt-20 text-center text-slate-500">
          <h2 class="text-xl font-semibold">No birds found</h2>
          <p class="mt-2">Check your data file.</p>
        </div>

        <!-- Content Grid -->
        <template v-else>
          <section
            v-for="(birds, family) in grouped"
            :key="family"
            :id="`family-section-${family.replace(/\s+/g, '-')}`"
            class="mb-12 scroll-mt-24"
          >
            <!-- Section Header -->
            <h2 
              :ref="el => headerRefs[family] = el" 
              class="mb-6 border-b border-slate-200 pb-2 text-2xl font-bold text-slate-800 dark:text-slate-100 dark:border-slate-800"
            >
              {{ family }}
            </h2>

            <!-- Grid -->
            <div class="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-6 sm:grid-cols-[repeat(auto-fill,minmax(200px,1fr))]">
              <GridItemCard
                v-for="bird in birds"
                :key="bird.id"
                :id="`bird-card-${bird.birdId}`"
                :ref="el => cardRefs[bird.birdId] = el"
                :bird="bird"
                :image-base-url="imageBaseUrl"
                :placeholder-image="placeholderImage"
                @card-click="$emit('cardClick', $event)"
              />
            </div>
          </section>
        </template>

        <!-- Footer -->
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
import { APP_VERSION } from '../version';

const appVersion = APP_VERSION;

// Props
defineProps({
  // UI State
  sidebarOpen: Boolean,
  mobile: Boolean,
  client: Boolean,
  isDark: Boolean,
  
  // Data State
  loading: Boolean,
  error: String,
  families: Array,
  grouped: Object,
  activeFamily: String,
  total: Number,
  drawn: Number,
  
  // Config
  imageBaseUrl: String,
  placeholderImage: String
});

// Emits
defineEmits([
  'closeSidebar',
  'toggleSidebar',
  'toggleTheme',
  'goToFamily',
  'scroll',
  'cardClick'
]);

// Template Refs
const scrollContainer = ref(null);
const sidebarRefs = ref({});
const headerRefs = ref({});
const cardRefs = ref({});

// Expose refs for parent access
defineExpose({
  scrollContainer,
  sidebarRefs,
  headerRefs,
  cardRefs
});
</script>