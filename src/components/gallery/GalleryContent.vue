<!-- components/gallery/GalleryContent.vue -->
<template>
  <div class="space-y-12">
    <!-- Loading State: mirrors the real grid so the swap doesn't jump -->
    <div
      v-if="data.loading"
      class="tile-grid"
    >
      <div
        v-for="n in 10"
        :key="n"
        class="aspect-square rounded-xl animate-pulse bg-slate-200 dark:bg-slate-800"
      />
    </div>

    <!-- Error State -->
    <EmptyState
      v-else-if="data.error"
      class="mt-10"
      title="Couldn't load data"
      :hint="data.error"
    >
      <template #icon>
        <Icon name="noResults" class="w-6 h-6" />
      </template>
    </EmptyState>

    <!-- Empty State -->
    <EmptyState
      v-else-if="isEmpty"
      class="mt-10"
      title="No drawings found"
      :hint="search.query ? 'Try a different search term.' : 'Check back later for new illustrations.'"
    >
      <template #icon>
        <Icon name="noResults" class="w-6 h-6" />
      </template>
    </EmptyState>

    <!-- Main Content -->
    <template v-else>
      <!-- Grouped Sections -->
      <section
        v-for="(items, groupName, groupIndex) in activeData.grouped"
        :key="groupName"
        class="mb-12 scroll-mt-10"
      >
        <h2
          :ref="el => { if (el) headerRefs[String(groupName)] = el as HTMLElement }"
          class="mb-5 pb-2 text-base font-semibold flex items-center justify-between transition-colors border-b
                 text-slate-800 border-slate-200 dark:text-slate-100 dark:border-slate-800"
        >
          <span>{{ groupName }}</span>
          <span class="text-xs font-normal tabular-nums text-muted">
            {{ drawnCounts[String(groupName)] ?? 0 }} drawn
            <template v-if="ui.viewMode === 'group'"> / {{ items.length }}</template>
          </span>
        </h2>

        <div class="tile-grid">
          <ItemTile
            v-for="(item, itemIndex) in items"
            :key="item.id"
            v-memo="[item.isDrawn, item.imageUrl]"
            :item="item"
            :eager="groupIndex === 0 && itemIndex < 6"
            @card-click="openItem($event)"
          />
        </div>
      </section>

      <!-- Footer (override via slot if needed) — static per session -->
      <slot name="footer">
        <footer
          v-once
          class="mt-16 pt-6 pb-8 border-t text-center text-xs transition-colors
                 border-slate-100 text-muted dark:border-slate-800/50"
        >
          <p>Wildlife Illustrated &copy; {{ new Date().getFullYear() }} &middot; v{{ appVersion }}</p>
        </footer>
      </slot>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import ItemTile from './ItemTile.vue';
import EmptyState from '../ui/EmptyState.vue';
import Icon from '../icons/Icon.vue';
import { useAppContext } from '../../composables';
import type { CollectionItem } from '../../types';

// headerRefs is the context ref App's scroll-spy reads; the template registers
// each section header into it.
const { data, activeData, search, ui, openItem, headerRefs } = useAppContext();

/** Derived version string, injected at build time by vite.config.ts */
const appVersion = __APP_VERSION__;

// ---------------------------------------------------------------------------
// COMPUTED
// ---------------------------------------------------------------------------
const isEmpty = computed(() => Object.keys(activeData.value.grouped).length === 0);

// Drawn count per section — the sidebar computation already produced these
// numbers (group mode: drawn per group; date mode: items per month, all drawn).
const drawnCounts = computed(() => {
  const counts: Record<string, number> = {};
  for (const s of activeData.value.sidebarItems) counts[s.id] = s.count;
  return counts;
});
</script>
