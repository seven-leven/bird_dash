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
        class="aspect-square rounded-card animate-pulse bg-slate-200 dark:bg-slate-800"
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
      :hint="query ? 'Try a different search term.' : 'Check back later for new illustrations.'"
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
          :ref="el => registerHeader(String(groupName), el)"
          class="mb-5 pb-2 text-base font-semibold flex items-center justify-between transition-colors border-b
                 text-slate-800 border-slate-200 dark:text-slate-100 dark:border-slate-800"
        >
          <span>{{ groupName }}</span>
          <span class="text-xs font-normal tabular-nums text-muted">
            {{ sectionCount(String(groupName), items.length) }}
          </span>
        </h2>

        <div class="tile-grid">
          <ItemTile
            v-for="(item, itemIndex) in items"
            :key="item.id"
            v-memo="[item.isDrawn, item.imageUrl, theme.isDark]"
            :item="item"
            :dark="theme.isDark"
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
          <p>
            Wildlife Illustrated &copy; {{ new Date().getFullYear() }} &middot; v{{ appVersion }}
            &middot; {{ drawnLabel }} &middot;
            <span class="font-mono" title="The commit this site was built from">{{ appCommit }}</span>
            &middot;
            <a
              href="https://github.com/seven-leven/bird_dash"
              target="_blank"
              rel="noopener noreferrer"
              class="focus-ring inline-flex items-center gap-1 rounded-control underline underline-offset-2
                     hover:text-slate-800 dark:hover:text-slate-200"
            >
              GitHub
              <Icon name="externalLink" class="w-3 h-3" aria-hidden="true" />
            </a>
          </p>
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
import { useCollectionsStore } from '../../stores/collections.ts';
import { useSearch } from '../../stores/search.ts';
import { useUi } from '../../stores/ui.ts';
import { useOverlayStore } from '../../stores/overlay.ts';
import { drawings, drawnOf } from '../../lib/formatCount.ts';

const { data, activeData } = useCollectionsStore();
const { query } = useSearch();
// The template registers each section header with the ui store for the scroll-spy.
const { viewMode, theme, registerHeader } = useUi();
const { open: openItem } = useOverlayStore();

// Injected at build time by vite.config.ts (worked out in script/version/compute.ts).
const appVersion = __APP_VERSION__;
const appCommit = __APP_COMMIT__;
const drawnLabel = drawings(__APP_DRAWN__);

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

// Group view: how many of the group are drawn. Date view: every item is drawn.
const sectionCount = (name: string, total: number): string => {
  const drawn = drawnCounts.value[name] ?? 0;
  return viewMode.value === 'group' ? drawnOf(drawn, total) : drawings(drawn);
};
</script>
