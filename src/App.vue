<script setup lang="ts">
import { nextTick, onMounted, reactive, ref, toRefs, watch } from 'vue';

import Chrome from './components/layout/Chrome.vue';
import type { CollectionItem, ViewMode } from './types/';

import {
  provideAppContext,
  useBreakpoints,
  useCollectionData,
  useCollections,
  useDebouncedRef,
  useGlobalSearch,
  useOverlay,
  useScrollLogic,
  useTheme,
} from './composables';

// =============================================================================
// STATE & CORE LOGIC
// =============================================================================
// Scroll-spy targets, shared through the app context: Chrome binds the scroll
// container, GalleryContent registers the section headers.
const scrollContainer = ref<HTMLElement | null>(null);
const headerRefs = ref<Record<string, HTMLElement | null>>({});
// One search state drives both the grid filter and the global dropdown, so the
// input, the results, and the filter chip can never drift apart.
const search = reactive({ query: '', dropdownOpen: false });
const { query } = toRefs(search);

const { theme, toggleTheme } = useTheme();
const { isMobile } = useBreakpoints(1024);
const { expandedImage, openOverlay, closeOverlay, updateOverlayItem } = useOverlay();

const ui = reactive({
  sidebarOpen: false,
  mobile: isMobile,
  viewMode: 'group' as ViewMode,
});

const {
  isInitialized,
  activeCollection,
  globalStats,
  data,
  COLLECTIONS,
  collectionCache,
  init,
  switchCollection,
} = useCollections();

const { items } = toRefs(data);
const { viewMode } = toRefs(ui);
// Debounce the query feeding the heavy filter → group → sort pipeline so a burst
// of keystrokes recomputes once, not once per character. The input stays
// instant because it binds to the raw query.
const debouncedQuery = useDebouncedRef(query, 120);
const { activeData, stats, searchedDrawnItems } = useCollectionData(items, debouncedQuery, viewMode);

const { activeSection, updateActiveSection, goToSection } = useScrollLogic(
  scrollContainer,
  headerRefs,
  ui,
);

// =============================================================================
// GLOBAL SEARCH — same debounced query feeds the grid filter and the
// cross-collection dropdown results.
// =============================================================================
const { globalResults, globalResultCount } = useGlobalSearch(
  COLLECTIONS,
  collectionCache,
  debouncedQuery,
);

function updateSearch(q: string) {
  search.query = q;
  if (q.trim()) search.dropdownOpen = true;
}

/** Scroll a tile into view and flash a highlight ring around it. */
function flashItem(itemId: string) {
  const el = document.getElementById(`item-${itemId}`);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  el.classList.add('ring-2', 'ring-accent-500', 'ring-offset-2');
  setTimeout(() => el.classList.remove('ring-2', 'ring-accent-500', 'ring-offset-2'), 1800);
}

/**
 * User clicked / keyboard-selected a global search result: switch collection,
 * close the dropdown, and scroll+flash the item.
 */
async function handleSelectGlobalResult(collectionId: string, itemId: string) {
  search.dropdownOpen = false;
  if (collectionId !== activeCollection.value?.id) {
    await handleSwitchCollection(collectionId);
  }
  await nextTick();
  flashItem(itemId);
}

// =============================================================================
// URL ROUTING — hash reflects what you're looking at:
//   #<collectionId>            → a collection
//   #<collectionId>/<itemId>   → that item's image (lightbox open)
// so any tile/image can be linked and shared.
// =============================================================================
let lastHash = '';

function setHash(hash: string) {
  const next = hash ? `#${hash}` : '';
  lastHash = next;
  if (location.hash === next) return;
  if (next) location.hash = next;
  else history.replaceState(null, '', location.pathname + location.search);
}

function collectionHash(): string {
  return activeCollection.value?.id ?? '';
}

async function applyHash() {
  // Ignore hash changes we made ourselves.
  if (location.hash === lastHash) return;
  lastHash = location.hash;

  const raw = location.hash.replace(/^#\/?/, '');
  const [collectionId = '', itemId = ''] = raw.split('/');
  if (!collectionId) return;

  if (collectionId !== activeCollection.value?.id) {
    await handleSwitchCollection(collectionId);
  }
  if (!itemId) return;

  await nextTick();
  const item = collectionCache[collectionId]?.find((i) => i.itemId === itemId);
  if (item?.isDrawn) openOverlay(item); // drawn → open the image
  else flashItem(itemId); // undrawn → just highlight the tile
}

// =============================================================================
// ACTIONS (routed wrappers keep the URL in sync)
// =============================================================================
async function handleSwitchCollection(id: string) {
  search.query = '';
  headerRefs.value = {};

  await switchCollection(id, () => {
    if (scrollContainer.value) scrollContainer.value.scrollTop = 0;
    updateActiveSection();
  });
}

async function selectCollection(id: string) {
  await handleSwitchCollection(id);
  setHash(id);
}

function openItem(item: CollectionItem) {
  openOverlay(item);
  if (item.isDrawn) setHash(`${collectionHash()}/${item.itemId}`);
}

function closeItem() {
  closeOverlay();
  setHash(collectionHash());
}

function navigateItem(item: CollectionItem) {
  updateOverlayItem(item);
  setHash(`${collectionHash()}/${item.itemId}`);
}

const toggleViewMode = () => {
  ui.viewMode = ui.viewMode === 'group' ? 'date' : 'group';
  nextTick(updateActiveSection);
};

// =============================================================================
// APP CONTEXT — everything the chrome components need, in one place
// =============================================================================
provideAppContext({
  collections: COLLECTIONS,
  activeCollection,
  globalStats,
  data,
  activeData,
  stats,

  ui,
  theme,
  activeSection,
  search,
  scrollContainer,
  headerRefs,

  globalResults,
  globalResultCount,

  expandedImage,
  drawnItems: searchedDrawnItems,

  switchCollection: selectCollection,
  toggleSidebar: () => ui.sidebarOpen = !ui.sidebarOpen,
  closeSidebar: () => ui.sidebarOpen = false,
  toggleTheme,
  toggleViewMode,
  goToSection,
  openItem,
  closeOverlay: closeItem,
  updateOverlayItem: navigateItem,
  updateSearch,
  setSearchDropdown: (open: boolean) => search.dropdownOpen = open,
  selectGlobalResult: handleSelectGlobalResult,
});

// =============================================================================
// LIFECYCLE
// =============================================================================
onMounted(async () => {
  window.addEventListener('hashchange', applyHash);
  await init();
});

// When data (re)loads: rebuild the scroll-spy observer and apply any deep link.
watch(() => data.items, () => {
  nextTick(() => {
    updateActiveSection();
    applyHash();
  });
});
</script>

<template>
  <Chrome v-if="isInitialized" />

  <div
    v-else
    class="flex flex-col items-center justify-center gap-3 min-h-screen bg-slate-50 dark:bg-slate-950"
  >
    <div class="w-8 h-8 border-2 border-slate-200 border-t-accent-500 rounded-full animate-spin dark:border-slate-800 dark:border-t-accent-500" />
    <p class="text-xs font-medium text-muted">Loading collections…</p>
  </div>
</template>
