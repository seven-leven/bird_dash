<script setup lang="ts">
import { nextTick, onMounted, watch } from 'vue';

import Chrome from './components/layout/Chrome.vue';
import EmptyState from './components/ui/EmptyState.vue';
import Icon from './components/icons/Icon.vue';
import { useHashRoute } from './composables/core/useHashRoute.ts';
import { createSearchStore, provideSearch } from './stores/search.ts';
import { createUiStore, provideUi } from './stores/ui.ts';
import { createCollectionsStore, provideCollections } from './stores/collections.ts';
import { createOverlayStore, provideOverlay } from './stores/overlay.ts';
import { createAppActions, provideActions } from './stores/actions.ts';
import { createStatsStore, provideStats } from './stores/stats.ts';
import { applyAccent } from './lib/accent.ts';

// =============================================================================
// STORES — created in dependency order, shared through provide/inject.
//   search → (query) → collections → (drawnItems) → overlay ;  ui is independent
// =============================================================================
const search = createSearchStore();
const ui = createUiStore();
const collections = createCollectionsStore({
  query: search.debouncedQuery,
  viewMode: ui.viewMode,
  drawnOnly: ui.drawnOnly,
});
const overlay = createOverlayStore({ drawnItems: collections.drawnItems });
// The archive's numbers: loaded by the first page that shows them, then kept.
const stats = createStatsStore();

provideSearch(search);
provideUi(ui);
provideCollections(collections);
provideOverlay(overlay);
provideStats(stats);

// =============================================================================
// CROSS-STORE ORCHESTRATIONS — the only actions that touch more than one store
// (stores/actions.ts). URL sync is handled by the route adapter below, so nothing
// there pokes location.hash.
// =============================================================================
const actions = createAppActions({ search, ui, collections });
provideActions(actions);

// =============================================================================
// URL ⇄ STATE — one owner; reflects (collection, open item) to the hash and
// applies deep links back to the stores.
// =============================================================================
const route = useHashRoute({
  activeCollection: collections.activeCollection,
  expandedImage: overlay.expandedImage,
  cache: collections.cache,
  switchCollection: actions.switchCollection,
  openOverlay: overlay.open,
  closeOverlay: overlay.close,
  ringTile: actions.ringTile,
  page: ui.page,
  showPage: ui.showPage,
});

// When a collection's data (re)loads: rebuild the scroll-spy and apply any
// pending deep link.
watch(
  () => collections.data.items,
  () =>
    nextTick(() => {
      ui.updateActiveSection();
      route.apply();
    }),
);

// Each collection has its own accent colour (`accent` in collections.json).
watch(() => collections.activeCollection.value?.accent, applyAccent, { immediate: true });

const { isInitialized, initError } = collections;
const reload = () => location.reload();

onMounted(async () => {
  await collections.init();
  if (isInitialized.value) await route.start(); // nothing to route to if init failed
});
</script>

<template>
  <Chrome v-if="isInitialized" />

  <div
    v-else-if="initError"
    class="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950"
    role="alert"
  >
    <EmptyState title="Couldn't load the gallery" :hint="initError">
      <template #icon>
        <Icon name="close" class="size-6" />
      </template>
      <button
        class="btn-primary focus-ring mt-3"
        @click="reload()"
      >
        <Icon name="reset" class="size-4" aria-hidden="true" />
        Try again
      </button>
    </EmptyState>
  </div>

  <!-- Loading: the page's own shape in grey (a header, then tiles), and no message
       on screen; screen readers are told what is happening. -->
  <div v-else class="min-h-screen bg-slate-50 dark:bg-slate-950" aria-busy="true">
    <div class="h-12 border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950" />
    <div class="tile-grid p-4 sm:p-6">
      <div
        v-for="n in 10"
        :key="n"
        class="rounded-card overflow-hidden animate-pulse bg-slate-200 dark:bg-slate-800"
      >
        <div class="aspect-square" />
        <div class="h-14" />
      </div>
    </div>
    <p class="sr-only" role="status">Loading the gallery</p>
  </div>
</template>
