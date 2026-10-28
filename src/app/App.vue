<script setup lang="ts">
import { nextTick, onMounted, watch } from 'vue';

import AppShell from './AppShell.vue';
import EmptyState from '../ui/EmptyState.vue';
import Icon from '../ui/Icon.vue';
import RetryButton from '../ui/RetryButton.vue';
import GallerySkeleton from '../gallery/GallerySkeleton.vue';
import { useHashRoute } from './useHashRoute.ts';
import { createThemeStore, provideThemeStore } from '../shell/themeStore.ts';
import { createLayoutStore, provideLayoutStore } from '../shell/layoutStore.ts';
import { createCollectionsStore, provideCollectionsStore } from '../gallery/collectionsStore.ts';
import { createViewStore, provideViewStore } from '../gallery/viewStore.ts';
import { createSearchStore, provideSearchStore } from '../search/searchStore.ts';
import { createViewerStore, provideViewerStore } from '../viewer/viewerStore.ts';
import { createStatsStore, provideStatsStore } from '../about/statsStore.ts';
import { createActions, provideActions } from './actions.ts';
import { PAGES } from './pages.ts';
import { applyAccent } from '../browser/applyAccent.ts';
import { reloadPage } from '../browser/reloadPage.ts';

// =============================================================================
// STORES — one per feature, made in dependency order and shared through
// provide/inject:  collections → search → view (with layout) → viewer.
// =============================================================================
const theme = createThemeStore();
const layout = createLayoutStore(PAGES);
const collections = createCollectionsStore();
const search = createSearchStore({
  collections: collections.collections,
  itemsByCollection: collections.itemsByCollection,
});
const view = createViewStore({
  items: collections.items,
  query: search.debouncedQuery,
  scrollEl: layout.scrollEl,
  isNarrow: layout.isNarrow,
  closeSidebar: layout.closeSidebar,
});
const viewer = createViewerStore({ drawnItems: view.drawnItems });
// The archive's numbers: loaded by the first page that shows them, then kept.
const stats = createStatsStore();

provideThemeStore(theme);
provideLayoutStore(layout);
provideCollectionsStore(collections);
provideViewStore(view);
provideSearchStore(search);
provideViewerStore(viewer);
provideStatsStore(stats);

// =============================================================================
// CROSS-STORE ORCHESTRATIONS — the only actions that touch more than one store
// (app/actions.ts). URL sync is handled by the route adapter below, so nothing
// there pokes location.hash.
// =============================================================================
const actions = createActions({ search, layout, view, collections });
provideActions(actions);

// =============================================================================
// URL ⇄ STATE — one owner; reflects (collection, open item) to the hash and
// applies deep links back to the stores.
// =============================================================================
const route = useHashRoute({
  activeCollection: collections.activeCollection,
  isViewerOpen: viewer.isOpen,
  viewerItem: viewer.item,
  itemsByCollection: collections.itemsByCollection,
  selectCollection: actions.selectCollection,
  openViewer: viewer.open,
  closeViewer: viewer.close,
  ringTile: actions.ringTile,
  page: layout.page,
  showPage: layout.showPage,
});

// When a collection's data (re)loads: rebuild the scroll-spy and apply any
// pending deep link.
watch(
  () => collections.loadState.items,
  () =>
    nextTick(() => {
      view.updateActiveSection();
      route.apply();
    }),
);

// Each collection has its own accent colour (`accent` in collections.json).
watch(() => collections.activeCollection.value?.accent, applyAccent, { immediate: true });

const { isInitialized, initError } = collections;

onMounted(async () => {
  await collections.init();
  if (isInitialized.value) await route.start(); // nothing to route to if init failed
});
</script>

<template>
  <AppShell v-if="isInitialized" />

  <div
    v-else-if="initError"
    class="flex flex-col items-center justify-center min-h-screen bg-stone-50 dark:bg-stone-950"
    role="alert"
  >
    <EmptyState title="Couldn't load the gallery" :hint="initError">
      <template #icon>
        <Icon name="close" class="size-6" />
      </template>
      <RetryButton @retry="reloadPage()" />
    </EmptyState>
  </div>

  <!-- Loading: the page's own shape in grey (a header, then tiles), and no message
       on screen; screen readers are told what is happening. -->
  <div v-else class="min-h-screen bg-stone-50 dark:bg-stone-950" aria-busy="true">
    <div class="h-12 border-b border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-950" />
    <GallerySkeleton class="p-4 sm:p-6" />
    <p class="sr-only" role="status">Loading the gallery</p>
  </div>
</template>
