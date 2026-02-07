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
  illustratorNote?: string;
}

interface DataState {
  birds: Bird[];
  loading: boolean;
  error: string | undefined;
}

type ViewMode = 'family' | 'date';

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
  error: undefined
});

const search = reactive({ query: '' });
const ui = reactive({ 
  sidebarOpen: false, 
  mobile: false, 
  client: false,
  viewMode: 'family' as ViewMode
});
const theme = reactive({ isDark: false });
const expandedImage = reactive({ isOpen: false, bird: undefined as Bird | undefined });

// =============================================================================
// COMPUTED - ALL BIRDS (for family mode) vs DRAWN ONLY (for date mode)
// =============================================================================

// For family mode: ALL birds including undrawn
const allBirds = computed(() => {
  const q = search.query.toLowerCase().trim();
  if (q === '') return data.birds;
  
  return data.birds.filter((b: Bird) => 
    b.commonName.toLowerCase().includes(q) ||
    b.family.toLowerCase().includes(q) ||
    b.scientificName.toLowerCase().includes(q)
  );
});

// For date mode: only drawn birds
const drawnBirds = computed(() => {
  return data.birds.filter((b: Bird) => b.imageUrl !== config.placeholder);
});

const searchedDrawnBirds = computed(() => {
  const q = search.query.toLowerCase().trim();
  if (q === '') return drawnBirds.value;
  
  return drawnBirds.value.filter((b: Bird) => 
    b.commonName.toLowerCase().includes(q) ||
    b.family.toLowerCase().includes(q) ||
    b.scientificName.toLowerCase().includes(q)
  );
});

// =============================================================================
// FAMILY MODE (Default) - Shows ALL birds
// =============================================================================
const familyData = computed(() => {
  const grouped: Record<string, Bird[]> = {};
  
  allBirds.value.forEach((b: Bird) => {
    if (!grouped[b.family]) grouped[b.family] = [];
    grouped[b.family].push(b);
  });

  // Sort: drawn birds first, then by birdId
  Object.keys(grouped).forEach(family => {
    grouped[family].sort((a, b) => {
      // Drawn birds first
      const aDrawn = a.imageUrl !== config.placeholder;
      const bDrawn = b.imageUrl !== config.placeholder;
      if (aDrawn !== bDrawn) return bDrawn ? 1 : -1;
      
      // Then by birdId
      return parseInt(a.birdId) - parseInt(b.birdId);
    });
  });

  // Count drawn birds for sidebar
  return {
    grouped,
    sidebarItems: Object.keys(grouped).map(family => {
      const birds = grouped[family];
      const drawnCount = birds.filter(b => b.imageUrl !== config.placeholder).length;
      return {
        id: family,
        label: family,
        count: drawnCount,
        total: birds.length,
        disabled: false
      };
    })
  };
});

// =============================================================================
// DATE MODE - Only drawn birds, but show all months in sidebar
// =============================================================================

// Get all months from first drawing to now
const allMonths = computed(() => {
  const months: string[] = [];
  
  // Find date range
  const dates = drawnBirds.value
    .map(b => b.drawnDate ? new Date(b.drawnDate) : null)
    .filter((d): d is Date => d !== null && !isNaN(d.getTime()));
  
  if (dates.length === 0) return months;
  
  const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
  const maxDate = new Date(); // up to current month
  
  // Generate all months between min and max
  let current = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
  const end = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);
  
  while (current <= end) {
    const key = `${current.toLocaleString('default', { month: 'long' })} ${current.getFullYear()}`;
    months.push(key);
    current.setMonth(current.getMonth() + 1);
  }
  
  return months;
});

const dateData = computed(() => {
  // Sort drawn birds by date
  const sorted = [...searchedDrawnBirds.value].sort((a, b) => {
    const dateA = a.drawnDate ? new Date(a.drawnDate).getTime() : 0;
    const dateB = b.drawnDate ? new Date(b.drawnDate).getTime() : 0;
    
    if (dateA !== dateB) return dateA - dateB;
    return parseInt(a.birdId) - parseInt(b.birdId);
  });

  // Group by month/year
  const grouped: Record<string, Bird[]> = {};
  
  sorted.forEach((b: Bird) => {
    if (!b.drawnDate) return;
    
    const date = new Date(b.drawnDate);
    const key = `${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()}`;
    
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(b);
  });

  // Build sidebar with all months (including empty)
  const sidebarItems = allMonths.value.map(month => ({
    id: month,
    label: month,
    count: grouped[month]?.length || 0,
    total: 0,
    disabled: !grouped[month] || grouped[month].length === 0
  }));

  return { grouped, sidebarItems };
});

// =============================================================================
// ACTIVE DATA BASED ON MODE
// =============================================================================
const activeData = computed(() => {
  return ui.viewMode === 'family' ? familyData.value : dateData.value;
});

const stats = computed(() => {
  const totalDrawn = drawnBirds.value.length;
  const totalAll = data.birds.length;
  
  return {
    total: ui.viewMode === 'family' ? totalAll : totalDrawn,
    filtered: ui.viewMode === 'family' ? allBirds.value.length : searchedDrawnBirds.value.length,
    drawn: totalDrawn,
    mode: ui.viewMode
  };
});

// Scroll logic
const { activeSection, updateActiveSection, goToSection, handleHash } = useScrollLogic(
  uiRef,
  ui
);

// =============================================================================
// DATA FETCHING
// =============================================================================
const loadData = async () => {
  data.loading = true;
  data.error = undefined;
  
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
          imageUrl: hasImg ? config.imageBase + `${b.id}.webp` : config.placeholder,
          illustratorNote: b.illustratorNote || ''  // <-- fixed: use illustratorNote not note
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

const toggleViewMode = () => {
  ui.viewMode = ui.viewMode === 'family' ? 'date' : 'family';
  nextTick(() => {
    updateActiveSection();
  });
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
    nextTick(() => { updateActiveSection(); handleHash(); });
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
      :grouped="activeData.grouped"
      :sidebar-items="activeData.sidebarItems"
      :active-section="activeSection"
      :view-mode="ui.viewMode"
      :stats="stats"
      :image-base-url="config.imageBase"
      :placeholder-image="config.placeholder"
      :search-query="search.query"
      @close-sidebar="ui.sidebarOpen = false"
      @toggle-sidebar="ui.sidebarOpen = !ui.sidebarOpen"
      @toggle-theme="theme.isDark = !theme.isDark"
      @toggle-view-mode="toggleViewMode"
      @go-to-section="goToSection"
      @scroll="updateActiveSection"
      @card-click="openBirdOverlay"
      @update-search="search.query = $event"
    />

    <ExpandedImage
      :is-open="expandedImage.isOpen"
      :bird="expandedImage.bird"
      :drawn-birds="searchedDrawnBirds"
      :full-image-base-url="config.fullImageBase"
      @close="closeBirdOverlay"
      @update:bird="expandedImage.bird = $event"
    />
  </div>
</template>