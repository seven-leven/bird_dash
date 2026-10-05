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
        <Icon name="noResults" class="w-6 h-6" />
      </template>
      <button
        class="focus-ring mt-3 rounded-control px-3 py-1.5 text-sm font-medium bg-accent-700 text-white hover:bg-accent-600"
        @click="reload()"
      >
        Try again
      </button>
    </EmptyState>
  </div>

  <div
    v-else
    class="flex flex-col items-center justify-center gap-3 min-h-screen bg-slate-50 dark:bg-slate-950"
  >
    <div class="w-8 h-8 border-2 border-slate-200 border-t-accent-500 rounded-full animate-spin dark:border-slate-800 dark:border-t-accent-500" />
    <p class="text-xs font-medium text-muted">Loading collections…</p>
  </div>
</template>
