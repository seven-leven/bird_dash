<script setup lang="ts">
/// <reference types="vite/client" />
import { ref, reactive, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
import UI from './components/UI.vue';
import ExpandedImage from './components/ExpandedImage.vue';
import { useScrollLogic } from './components/useScrollLogic';
// Added initCollections
import { COLLECTIONS, initCollections, getPlaceholder, type CollectionConfig, type CollectionItem } from './collections';

// =============================================================================
// TYPES
// =============================================================================
type ViewMode = 'group' | 'date';

interface DataState {
  items: CollectionItem[];
  loading: boolean;
  error: string | undefined;
}

interface UIComponent {
  scrollContainer: HTMLElement | null;
  headerRefs: Record<string, HTMLElement>;
}

// =============================================================================
// INITIALIZATION STATE
// =============================================================================
const isInitialized = ref(false);

// =============================================================================
// ACTIVE COLLECTION
// =============================================================================
// Initialize as empty string; will be set in onMounted
const activeCollectionId = ref('');

const activeCollection = computed<CollectionConfig | undefined>(() => {
  if (!isInitialized.value || COLLECTIONS.length === 0) return undefined;
  return COLLECTIONS.find(c => c.id === activeCollectionId.value) ?? COLLECTIONS[0];
});

// =============================================================================
// CROSS-COLLECTION CACHE
// =============================================================================
const collectionCache = reactive<Record<string, CollectionItem[]>>({});

function switchCollection(id: string) {
  if (id === activeCollectionId.value) return;
  activeCollectionId.value = id;
  search.query = '';

  if (uiRef.value?.headerRefs) {
    uiRef.value.headerRefs = {};
  }

  if (collectionCache[id]) {
    data.items   = collectionCache[id];
    data.loading = false;
    data.error   = undefined;
    nextTick(() => {
      if (uiRef.value?.scrollContainer) {
        uiRef.value.scrollContainer.scrollTop = 0;
      }
      updateActiveSection();
      handleHash();
    });
  } else {
    loadData();
  }
}

const globalStats = computed(() => {
  let drawn = 0;
  let total = 0;
  if (!isInitialized.value) return { drawn, total };
  
  for (const col of COLLECTIONS) {
    const items = collectionCache[col.id] ?? [];
    total += items.length;
    drawn += items.filter(i => i?.imageUrl && i.imageUrl !== i.placeholderUrl).length;
  }
  return { drawn, total };
});

// =============================================================================
// PER-COLLECTION STATE
// =============================================================================
const uiRef = ref<UIComponent | null>(null);

const data = reactive<DataState>({
  items:   [],
  loading: true,
  error:   undefined,
});

const search   = reactive({ query: '' });
const ui       = reactive({
  sidebarOpen: false,
  mobile:      false,
  client:      false,
  viewMode:    'group' as ViewMode,
});
const theme    = reactive({ isDark: false });
const expandedImage = reactive({
  isOpen: false,
  item:   undefined as CollectionItem | undefined,
});

// =============================================================================
// COMPUTED — filtered item sets
// =============================================================================
const allItems = computed(() => {
  const q = search.query.toLowerCase().trim();
  if (!q) return data.items;
  return data.items.filter(i =>
    i.commonName.toLowerCase().includes(q) ||
    i.group.toLowerCase().includes(q) ||
    i.scientificName.toLowerCase().includes(q)
  );
});

const drawnItems = computed(() =>
  data.items.filter(i => i.imageUrl !== i.placeholderUrl)
);

const searchedDrawnItems = computed(() => {
  const q = search.query.toLowerCase().trim();
  if (!q) return drawnItems.value;
  return drawnItems.value.filter(i =>
    i.commonName.toLowerCase().includes(q) ||
    i.group.toLowerCase().includes(q) ||
    i.scientificName.toLowerCase().includes(q)
  );
});

// =============================================================================
// COMPUTED — group mode
// =============================================================================
const groupData = computed(() => {
  const grouped: Record<string, CollectionItem[]> = {};

  allItems.value.forEach(item => {
    if (!grouped[item.group]) grouped[item.group] = [];
    grouped[item.group].push(item);
  });

  Object.keys(grouped).forEach(g => {
    grouped[g].sort((a, b) => {
      const aDrawn = a.imageUrl !== a.placeholderUrl;
      const bDrawn = b.imageUrl !== b.placeholderUrl;
      if (aDrawn !== bDrawn) return bDrawn ? 1 : -1;
      return parseInt(a.itemId) - parseInt(b.itemId);
    });
  });

  return {
    grouped,
    sidebarItems: Object.keys(grouped).map(g => {
      const items      = grouped[g];
      const drawnCount = items.filter(i => i.imageUrl !== i.placeholderUrl).length;
      return { id: g, label: g, count: drawnCount, total: items.length, disabled: false };
    }),
  };
});

// =============================================================================
// COMPUTED — date mode
// =============================================================================
const allMonths = computed(() => {
  const months: string[] = [];
  const dates = drawnItems.value
    .map(i => i.drawnDate ? new Date(i.drawnDate) : null)
    .filter((d): d is Date => d !== null && !isNaN(d.getTime()));

  if (dates.length === 0) return months;

  const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
  let current   = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
  const end     = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  while (current <= end) {
    months.push(`${current.toLocaleString('default', { month: 'long' })} ${current.getFullYear()}`);
    current.setMonth(current.getMonth() + 1);
  }
  return months;
});

const dateData = computed(() => {
  const sorted = [...searchedDrawnItems.value].sort((a, b) => {
    const da = a.drawnDate ? new Date(a.drawnDate).getTime() : 0;
    const db = b.drawnDate ? new Date(b.drawnDate).getTime() : 0;
    if (da !== db) return da - db;
    return parseInt(a.itemId) - parseInt(b.itemId);
  });

  const grouped: Record<string, CollectionItem[]> = {};
  sorted.forEach(i => {
    if (!i.drawnDate) return;
    const d   = new Date(i.drawnDate);
    const key = `${d.toLocaleString('default', { month: 'long' })} ${d.getFullYear()}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(i);
  });

  return {
    grouped,
    sidebarItems: allMonths.value.map(month => ({
      id:       month,
      label:    month,
      count:    grouped[month]?.length || 0,
      total:    0,
      disabled: !grouped[month] || grouped[month].length === 0,
    })),
  };
});

// =============================================================================
// ACTIVE VIEW DATA + STATS
// =============================================================================
const activeData = computed(() =>
  ui.viewMode === 'group' ? groupData.value : dateData.value
);

const stats = computed(() => ({
  total:    ui.viewMode === 'group' ? data.items.length : drawnItems.value.length,
  filtered: ui.viewMode === 'group' ? allItems.value.length : searchedDrawnItems.value.length,
  drawn:    drawnItems.value.length,
  mode:     ui.viewMode,
}));

// =============================================================================
// SCROLL LOGIC
// =============================================================================
const { activeSection, updateActiveSection, goToSection, handleHash } = useScrollLogic(uiRef, ui);

// =============================================================================
// DATA FETCHING
// =============================================================================

function parseCollectionJson(
  col: CollectionConfig,
  rawGroups: unknown,
  startCounter = 1,
): CollectionItem[] {
  const items: CollectionItem[] = [];
  let counter = startCounter;
  if (!rawGroups || typeof rawGroups !== 'object' || Array.isArray(rawGroups)) return items;

  const placeholder = getPlaceholder(col.id);
  const knownKeys = new Set(['id', 'name', 'sci', 'drawn', 'illustratorNote']);

  for (const [groupName, list] of Object.entries(rawGroups as Record<string, unknown>)) {
    if (!Array.isArray(list)) continue;
    for (const raw of list) {
      if (!raw || typeof raw !== 'object') continue;
      const r = raw as Record<string, unknown>;
      const hasImg = !!r.drawn;
      const meta: Record<string, string> = {};
      for (const key of Object.keys(r)) {
        if (!knownKeys.has(key) && typeof r[key] === 'string') {
          meta[key] = r[key] as string;
        }
      }
      items.push({
        id:              `${col.id}-item-${counter++}`,
        itemId:          String(r.id  ?? ''),
        commonName:      String(r.name ?? ''),
        scientificName:  String(r.sci  ?? ''),
        group:           groupName,
        drawnDate:       String(r.drawn ?? ''),
        imageUrl:        hasImg ? `${col.imageBase}${r.id}.webp` : placeholder,
        placeholderUrl:  placeholder,
        illustratorNote: String(r.illustratorNote ?? ''),
        meta:            Object.keys(meta).length ? meta : undefined,
      });
    }
  }
  return items;
}

const loadData = async () => {
  if (!activeCollection.value) return;
  data.loading = true;
  data.error   = undefined;
  const col = activeCollection.value;

  try {
    const res = await fetch(col.dataUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status} loading ${col.label}`);
    const rawGroups: unknown = await res.json();
    const items = parseCollectionJson(col, rawGroups);
    data.items = items;
    collectionCache[col.id] = items;
  } catch (e: any) {
    data.error = e.message || `Failed to load ${col.label.toLowerCase()} data.`;
  } finally {
    data.loading = false;
  }
};

async function prefetchOtherCollections() {
  for (const col of COLLECTIONS) {
    if (col.id === activeCollectionId.value || collectionCache[col.id]) continue;
    try {
      const res = await fetch(col.dataUrl);
      if (!res.ok) continue;
      const rawGroups: unknown = await res.json();
      collectionCache[col.id] = parseCollectionJson(col, rawGroups);
    } catch { /* skip */ }
  }
}

// =============================================================================
// UI EVENTS
// =============================================================================
const updateMobileState = () => {
  if (typeof window === 'undefined') return;
  ui.mobile = window.innerWidth < 1024;
  if (!ui.mobile) ui.sidebarOpen = false;
};

const toggleViewMode = () => {
  ui.viewMode = ui.viewMode === 'group' ? 'date' : 'group';
  nextTick(updateActiveSection);
};

const openOverlay = (item: CollectionItem) => {
  if (item.imageUrl === item.placeholderUrl) return;
  expandedImage.item   = item;
  expandedImage.isOpen = true;
};

const closeOverlay = () => {
  expandedImage.isOpen = false;
  setTimeout(() => { expandedImage.item = undefined; }, 300);
};

// =============================================================================
// WATCHERS & LIFECYCLE
// =============================================================================
watch(() => data.items, items => {
  if (items.length > 0) nextTick(() => {
    if (uiRef.value?.scrollContainer) uiRef.value.scrollContainer.scrollTop = 0;
    if (uiRef.value?.headerRefs) uiRef.value.headerRefs = {};
    updateActiveSection();
    handleHash();
  });
});

watch(() => theme.isDark, val => {
  document.documentElement.classList.toggle('dark', val);
}, { immediate: true });

onMounted(async () => {
  ui.client = true;
  updateMobileState();
  window.addEventListener('resize', updateMobileState);
  window.addEventListener('hashchange', handleHash);
  
  // 1. Load the list of collections first
  await initCollections();
  
  // 2. Now it is safe to set the active ID and mark as initialized
  if (COLLECTIONS.length > 0) {
    activeCollectionId.value = COLLECTIONS[0].id;
    isInitialized.value = true;
    
    // 3. Load data for the active collection
    await loadData();
    prefetchOtherCollections();
  }
  
  theme.isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateMobileState);
  window.removeEventListener('hashchange', handleHash);
});
</script>

<template>
  <div v-if="isInitialized">
    <UI
      ref="uiRef"
      :collections="COLLECTIONS"
      :active-collection-id="activeCollectionId"
      :global-stats="globalStats"
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
      :placeholder-image="getPlaceholder(activeCollectionId)"
      :search-query="search.query"
      @switch-collection="switchCollection"
      @close-sidebar="ui.sidebarOpen = false"
      @toggle-sidebar="ui.sidebarOpen = !ui.sidebarOpen"
      @toggle-theme="theme.isDark = !theme.isDark"
      @toggle-view-mode="toggleViewMode"
      @go-to-section="goToSection"
      @scroll="updateActiveSection"
      @card-click="openOverlay"
      @update-search="search.query = $event"
    />

    <ExpandedImage
      v-if="activeCollection"
      :is-open="expandedImage.isOpen"
      :item="expandedImage.item"
      :drawn-items="searchedDrawnItems"
      :full-image-base-url="activeCollection.fullImageBase"
      :collection="activeCollection"
      @close="closeOverlay"
      @update:item="expandedImage.item = $event"
    />
  </div>
  <div v-else class="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
     <!-- Simple loading state to prevent crash during init -->
     <p class="text-slate-500 animate-pulse">Initializing collections...</p>
  </div>
</template>