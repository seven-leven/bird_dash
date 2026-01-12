<template>
  <!-- App Shell -->
  <div class="flex h-screen w-full overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
    
    <!-- Mobile Overlay -->
    <div
      v-if="ui.client && ui.mobile"
      class="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity"
      :class="ui.sidebarOpen ? 'opacity-100 visible' : 'opacity-0 invisible'"
      @click="ui.sidebarOpen = false"
      aria-hidden="true"
    />

    <!-- Sidebar -->
    <aside
      id="appSidebar"
      class="
        fixed inset-y-0 left-0 z-50 w-72 flex-shrink-0
        flex flex-col
        bg-white dark:bg-slate-900 
        border-r border-slate-200 dark:border-slate-800
        transition-transform duration-300 ease-out shadow-2xl lg:shadow-none
        lg:static lg:translate-x-0
      "
      :class="ui.sidebarOpen ? 'translate-x-0' : '-translate-x-full'"
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
        <ul v-if="data.families.length" class="space-y-1">
          <li
            v-for="name in data.families"
            :key="name"
            :ref="el => refs.sidebar[name] = el"
            class="
              cursor-pointer rounded-lg px-4 py-2.5 text-sm font-medium transition-colors
              focus:outline-none focus:ring-2 focus:ring-blue-500
            "
            :class="[
              name === scroll.activeFamily 
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' 
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
            ]"
            tabindex="0"
            @click="goToFamily(name)"
            @keydown.enter="goToFamily(name)"
            @keydown.space.prevent="goToFamily(name)"
          >
            {{ name }}
          </li>
        </ul>
        
        <div v-else-if="!data.loading && !data.error" class="p-4 text-center text-sm text-slate-500 italic">
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
          <!-- Mobile Hamburger -->
          <button
            v-if="ui.mobile"
            class="p-1 -ml-1 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md lg:hidden"
            @click="ui.sidebarOpen = !ui.sidebarOpen"
            aria-label="Toggle bird groups menu"
            :aria-expanded="ui.sidebarOpen.toString()"
            aria-controls="appSidebar"
          >
            <svg viewBox="0 0 100 80" width="20" height="20" fill="currentColor">
              <rect width="100" height="15" rx="8"></rect>
              <rect y="30" width="100" height="15" rx="8"></rect>
              <rect y="60" width="100" height="15" rx="8"></rect>
            </svg>
          </button>
          
          <span v-if="!data.loading && !data.error && scroll.activeFamily" class="text-lg font-bold">
            {{ scroll.activeFamily }}
          </span>
        </div>
        
        <div v-if="!data.loading && data.total > 0" class="text-sm font-medium text-slate-500 dark:text-slate-400" aria-live="polite">
          {{ data.drawn }} <span class="text-slate-300 mx-1">/</span> {{ data.total }} Drawn
        </div>
      </div>

      <!-- Scrollable Grid Area -->
      <div 
        ref="scrollRef" 
        class="flex-1 overflow-y-auto p-6 scroll-smooth custom-scrollbar pb-32" 
        @scroll="updateActiveFamily"
      >
        <!-- Loading State (Skeletons) -->
        <div v-if="data.loading" class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
          <div 
            v-for="n in 10" 
            :key="n" 
            class="aspect-square rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse"
          />
        </div>

        <!-- Error State -->
        <div v-else-if="data.error" class="mx-auto mt-10 max-w-lg rounded-xl border border-red-200 bg-red-50 p-6 text-center dark:bg-red-900/20 dark:border-red-800">
          <h2 class="mb-2 text-lg font-bold text-red-700 dark:text-red-400">Error Loading Data</h2>
          <p class="text-red-600 dark:text-red-300">{{ data.error }}</p>
          <p class="mt-4 text-xs text-red-500">Please ensure public/birds.txt exists and is accessible.</p>
        </div>

        <!-- Empty State -->
        <div v-else-if="!data.families.length" class="mt-20 text-center text-slate-500">
          <h2 class="text-xl font-semibold">No birds found</h2>
          <p class="mt-2">Check your data file.</p>
        </div>

        <!-- Content Grid -->
        <template v-else>
          <section
            v-for="(birds, family) in data.grouped"
            :key="family"
            :id="`family-section-${family.replace(/\s+/g, '-')}`"
            class="mb-12 scroll-mt-24"
          >
            <!-- Section Header -->
            <h2 
              :ref="el => refs.headers[family] = el" 
              class="mb-6 border-b border-slate-200 pb-2 text-2xl font-bold text-slate-800 dark:text-slate-100 dark:border-slate-800"
            >
              {{ family }}
            </h2>

            <!-- Grid -->
            <!-- Using minmax for a responsive grid without media queries -->
            <div class="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-6 sm:grid-cols-[repeat(auto-fill,minmax(200px,1fr))]">
              <GridItemCard
                v-for="bird in birds"
                :key="bird.id"
                :id="`bird-card-${bird.birdId}`"
                :ref="el => refs.cards[bird.birdId] = el"
                :bird="bird"
                :image-base-url="config.imageBase"
                :placeholder-image="config.placeholder"
                @card-click="openBirdOverlay"
              />
            </div>
          </section>
        </template>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
import GridItemCard from './components/GridItemCard.vue';
// Note: styles import is removed

// ------------------------------------------------------------------
// CONFIGURATION & CONSTANTS
// ------------------------------------------------------------------
const config = {
  base: import.meta.env.BASE_URL,
  get imageBase() { return `${this.base}assets/`; },
  get placeholder() { return `${this.base}placeholder.webp`; },
  get dataUrl() { return `${this.base}birds.json`; }
};

// ------------------------------------------------------------------
// STATE: DATA MANAGEMENT
// ------------------------------------------------------------------
const data = reactive({
  birds: [],
  loading: true,
  error: null,
  grouped: computed(() => {
    const groups = {};
    data.birds.forEach(b => {
      if (!groups[b.family]) groups[b.family] = [];
      groups[b.family].push(b);
    });
    return groups;
  }),
  families: computed(() => Object.keys(data.grouped)),
  total: computed(() => data.birds.length),
  drawn: computed(() => data.birds.filter(b => b.imageUrl !== config.placeholder).length)
});

// ------------------------------------------------------------------
// STATE: UI MANAGEMENT
// ------------------------------------------------------------------
const ui = reactive({
  sidebarOpen: false,
  mobile: false,
  client: false
});

// ------------------------------------------------------------------
// STATE: SCROLL TRACKING
// ------------------------------------------------------------------
const scroll = reactive({
  activeFamily: ''
});

// ------------------------------------------------------------------
// STATE: ELEMENT REFS
// ------------------------------------------------------------------
const refs = reactive({
  headers: {},
  sidebar: {},
  cards: {}
});
const scrollRef = ref(null);

// ------------------------------------------------------------------
// LOGIC: DATA FETCHING
// ------------------------------------------------------------------
const loadData = async () => {
  data.loading = true;
  data.error = null;
  try {
    const res = await fetch(config.dataUrl);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    
    const rawGroups = await res.json();
    const birds = [];
    let id = 1;

    for (const [family, list] of Object.entries(rawGroups)) {
      list.forEach(b => {
        const hasImg = !!b.drawn;
        const imgFile = hasImg ? `${b.id}.webp` : 'placeholder.webp';
        const imgUrl = hasImg ? config.imageBase + imgFile : config.placeholder;

        birds.push({
          id: `bird-vuekey-${id++}`,
          birdId: b.id,
          commonName: b.name,
          scientificName: b.sci,
          family,
          drawnDate: b.drawn || '',
          imageFile: imgFile,
          imageUrl: imgUrl
        });
      });
    }

    data.birds = birds;
  } catch (e) {
    console.error(e);
    data.error = e.message || 'Failed to load bird data.';
  } finally {
    data.loading = false;
  }
};

// ------------------------------------------------------------------
// LOGIC: RESPONSIVE UI
// ------------------------------------------------------------------
const updateMobileState = () => {
  if (typeof window !== 'undefined') {
    ui.mobile = window.innerWidth < 1024; // Matching 'lg' breakpoint in Tailwind
    if (!ui.mobile) ui.sidebarOpen = false;
  }
};

// ------------------------------------------------------------------
// LOGIC: NAVIGATION
// ------------------------------------------------------------------
const goToFamily = (family) => {
  const el = refs.headers[family];
  if (el && scrollRef.value) {
    // Offset for the sticky header (approx 80px)
    const headerOffset = 80;
    const elementPosition = el.getBoundingClientRect().top;
    const offsetPosition = elementPosition + scrollRef.value.scrollTop - headerOffset;

    scrollRef.value.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    });
  }
  if (ui.mobile && ui.sidebarOpen) ui.sidebarOpen = false;
};

const goToBird = (birdId) => {
  const comp = refs.cards[birdId];
  if (!comp) return;
  
  const el = comp.$el; // Access the DOM element from the Vue Component ref
  if (el?.scrollIntoView) {
    const observer = new IntersectionObserver(
      (entries, obs) => {
        if (entries[0].isIntersecting) {
          // highlight logic replaced with Tailwind classes
          // 'ring-4' creates a border glow, 'ring-blue-500' sets color
          const highlightClasses = ['ring-4', 'ring-blue-500', 'ring-offset-4', 'dark:ring-offset-slate-900', 'z-10', 'transition-all', 'duration-500'];
          el.classList.add(...highlightClasses);
          
          setTimeout(() => {
            el.classList.remove(...highlightClasses);
          }, 2000);
          
          obs.disconnect();
        }
      },
      { root: scrollRef.value, threshold: 0.5 }
    );
    observer.observe(el);
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
};

const handleHash = () => {
  const hash = window.location.hash;
  if (hash) {
    const birdId = hash.substring(1);
    if (birdId) nextTick(() => goToBird(birdId));
  }
};

// ------------------------------------------------------------------
// LOGIC: SCROLL TRACKING
// ------------------------------------------------------------------
const updateActiveFamily = () => {
  if (!scrollRef.value || !data.families.length) return;
  
  // Adjust offset based on sticky header height
  const offset = scrollRef.value.scrollTop + 100;
  let best = null;
  
  for (const family of data.families) {
    const el = refs.headers[family];
    if (el && el.offsetTop <= offset) best = family;
  }
  
  scroll.activeFamily = best || data.families[0];
};

// ------------------------------------------------------------------
// LOGIC: EVENT HANDLERS
// ------------------------------------------------------------------
const openBirdOverlay = (bird) => {
  console.log('Card clicked:', bird);
};

// ------------------------------------------------------------------
// WATCHERS
// ------------------------------------------------------------------
watch(() => scroll.activeFamily, (newFamily) => {
  nextTick(() => {
    const el = refs.sidebar[newFamily];
    if (el?.scrollIntoView) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  });
});

watch(() => data.grouped, (newGroups) => {
  if (Object.keys(newGroups).length > 0) {
    nextTick(() => {
      updateActiveFamily();
      handleHash();
    });
  }
}, { deep: true });

// ------------------------------------------------------------------
// LIFECYCLE HOOKS
// ------------------------------------------------------------------
onMounted(() => {
  ui.client = true;
  updateMobileState();
  window.addEventListener('resize', updateMobileState);
  window.addEventListener('hashchange', handleHash);
  loadData();
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateMobileState);
  window.removeEventListener('hashchange', handleHash);
});
</script>