<script setup lang="ts">
import { nextTick, onMounted, watch } from 'vue';

import Chrome from './components/layout/Chrome.vue';
import { flashItem } from './lib/flashItem.ts';
import { useHashRoute } from './composables/index.ts';
import { createSearchStore, provideSearch } from './stores/search.ts';
import { createUiStore, provideUi } from './stores/ui.ts';
import { createCollectionsStore, provideCollections } from './stores/collections.ts';
import { createOverlayStore, provideOverlay } from './stores/overlay.ts';
import { type AppActions, provideActions } from './stores/actions.ts';

// =============================================================================
// STORES — created in dependency order, shared through provide/inject.
//   search → (query) → collections → (drawnItems) → overlay ;  ui is independent
// =============================================================================
const search = createSearchStore();
const ui = createUiStore();
const collections = createCollectionsStore({
  query: search.debouncedQuery,
  viewMode: ui.viewMode,
});
const overlay = createOverlayStore({ drawnItems: collections.drawnItems });

provideSearch(search);
provideUi(ui);
provideCollections(collections);
provideOverlay(overlay);

// =============================================================================
// CROSS-STORE ORCHESTRATIONS — the only actions that touch more than one store.
// (Single-domain actions live on their own store; URL sync is handled by the
// route adapter below, so nothing here pokes location.hash.)
// =============================================================================
const switchCollection = async (id: string): Promise<void> => {
  search.clear();
  ui.resetHeaders();
  await collections.switch(id, ui.afterSwitch);
};

const selectGlobalResult: AppActions['selectGlobalResult'] = async (collectionId, itemId) => {
  search.setDropdown(false);
  if (collectionId !== collections.activeCollection.value?.id) {
    await switchCollection(collectionId);
  }
  await nextTick();
  flashItem(itemId);
};

provideActions({ switchCollection, selectGlobalResult });

// =============================================================================
// URL ⇄ STATE — one owner; reflects (collection, open item) to the hash and
// applies deep links back to the stores.
// =============================================================================
const route = useHashRoute({
  activeCollection: collections.activeCollection,
  expandedImage: overlay.expandedImage,
  cache: collections.cache,
  switchCollection,
  openOverlay: overlay.open,
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

const { isInitialized } = collections;

onMounted(async () => {
  await collections.init();
  await route.start();
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
