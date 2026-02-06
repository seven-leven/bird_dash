<script setup lang="ts">
/// <reference types="vite/client" />
import { ref, reactive, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
import UI from './components/UI.vue';
import ExpandedImage from './components/ExpandedImage.vue';
import { useScrollLogic } from './components/useScrollLogic';

// =============================================================================
// TYPES & INTERFACES
// =============================================================================
interface Bird {
  id: string;
  birdId: string;
  commonName: string;
  scientificName: string;
  family: string;
  drawnDate: string;
  imageFile: string;
  imageUrl: string;
}

interface DataState {
  birds: Bird[];
  loading: boolean;
  error: string | undefined; // Corrected type
}

// =============================================================================
// STATE & CONFIG
// =============================================================================
const config = {
  base: import.meta.env.BASE_URL,
  get imageBase() { return `${this.base}thumb/`; },
  get fullImageBase() { return `${this.base}full/`; },
  get placeholder() { return `${this.base}placeholder.webp`; },
  get dataUrl() { return `${this.base}birds.json`; }
};

const uiRef = ref(null);
const data = reactive<DataState>({
  birds: [],
  loading: true,
  error: undefined // Initialize as undefined
});

const search = reactive({ query: '' });
const ui = reactive({ sidebarOpen: false, mobile: false, client: false });
const theme = reactive({ isDark: false });
const expandedImage = reactive({ isOpen: false, bird: undefined as Bird | undefined });

// =============================================================================
// COMPUTED & LOGIC INJECTION
// =============================================================================
const filteredData = computed(() => {
  const q = search.query.toLowerCase().trim();
  const filtered = q === '' 
    ? data.birds 
    : data.birds.filter((b: Bird) => 
        b.commonName.toLowerCase().includes(q) ||
        b.family.toLowerCase().includes(q) ||
        b.scientificName.toLowerCase().includes(q)
      );

  const grouped: Record<string, Bird[]> = {};
  filtered.forEach((b: Bird) => {
    if (!grouped[b.family]) grouped[b.family] = [];
    grouped[b.family].push(b);
  });

  return {
    grouped,
    families: Object.keys(grouped),
    total: filtered.length,
    drawn: filtered.filter((b: Bird) => b.imageUrl !== config.placeholder).length
  };
});

// Sync scroll logic via Composable
const { activeFamily, updateActiveFamily, goToFamily, handleHash } = useScrollLogic(
  uiRef, 
  reactive({ families: computed(() => filteredData.value.families) }), 
  ui
);

// =============================================================================
// DATA FETCHING
// =============================================================================
const loadData = async () => {
  data.loading = true;
  data.error = undefined; // FIXED: Changed from null to undefined
  
  try {
    const res = await fetch(config.dataUrl);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    
    const rawGroups: Record<string, any[]> = await res.json();
    const birdList: Bird[] = [];
    let idCounter = 1;

    for (const [family, list] of Object.entries(rawGroups)) {
      list.forEach((b: any) => {
        const hasImg = !!b.drawn;
        birdList.push({
          id: `bird-vuekey-${idCounter++}`,
          birdId: b.id,
          commonName: b.name,
          scientificName: b.sci,
          family,
          drawnDate: b.drawn || '',
          imageFile: hasImg ? `${b.id}.webp` : 'placeholder.webp',
          imageUrl: hasImg ? config.imageBase + `${b.id}.webp` : config.placeholder
        });
      });
    }
    data.birds = birdList;
  } catch (e: any) {
    data.error = e.message || 'Failed to load bird data.';
  } finally {
    data.loading = false;
  }
};

// =============================================================================
// UI EVENTS
// =============================================================================
const updateMobileState = () => {
  if (typeof window !== 'undefined') {
    ui.mobile = window.innerWidth < 1024;
    if (!ui.mobile) ui.sidebarOpen = false;
  }
};

const openBirdOverlay = (bird: Bird) => {
  if (bird.imageUrl === config.placeholder) return;
  expandedImage.bird = bird;
  expandedImage.isOpen = true;
};

const closeBirdOverlay = () => {
  expandedImage.isOpen = false;
  setTimeout(() => { expandedImage.bird = undefined; }, 300);
};

// =============================================================================
// WATCHERS & LIFECYCLE
// =============================================================================
watch(() => data.birds, (newBirds) => {
  if (newBirds.length > 0) {
    nextTick(() => { updateActiveFamily(); handleHash(); });
  }
});

watch(() => theme.isDark, (val) => {
  document.documentElement.classList.toggle('dark', val);
}, { immediate: true });

onMounted(() => {
  ui.client = true;
  updateMobileState();
  window.addEventListener('resize', updateMobileState);
  window.addEventListener('hashchange', handleHash);
  loadData();
  theme.isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateMobileState);
  window.removeEventListener('hashchange', handleHash);
});
</script>

<template>
  <div>
    <UI
      ref="uiRef"
      :sidebar-open="ui.sidebarOpen"
      :mobile="ui.mobile"
      :client="ui.client"
      :is-dark="theme.isDark"
      :loading="data.loading"
      :error="data.error"
      :families="filteredData.families"
      :grouped="filteredData.grouped"
      :active-family="activeFamily"
      :total="filteredData.total"
      :drawn="filteredData.drawn"
      :image-base-url="config.imageBase"
      :placeholder-image="config.placeholder"
      :search-query="search.query"
      @close-sidebar="ui.sidebarOpen = false"
      @toggle-sidebar="ui.sidebarOpen = !ui.sidebarOpen"
      @toggle-theme="theme.isDark = !theme.isDark"
      @go-to-family="goToFamily"
      @scroll="updateActiveFamily"
      @card-click="openBirdOverlay"
      @update-search="search.query = $event"
    />

    <ExpandedImage
      :is-open="expandedImage.isOpen"
      :bird="expandedImage.bird"
      :full-image-base-url="config.fullImageBase"
      @close="closeBirdOverlay"
    />
  </div>
</template>