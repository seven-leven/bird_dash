<!-- components/gallery/GalleryContent.vue -->
<template>
  <div class="space-y-12">
    <!-- Loading: tiles shaped like the real ones (image and caption), so nothing jumps -->
    <div
      v-if="data.loading"
      class="tile-grid"
      aria-busy="true"
    >
      <div
        v-for="n in 10"
        :key="n"
        class="rounded-card overflow-hidden animate-pulse bg-slate-200 dark:bg-slate-800"
      >
        <div class="aspect-square" />
        <div class="h-14" />
      </div>
    </div>

    <!-- Failed to load: name what failed, and offer to try again -->
    <EmptyState
      v-else-if="data.error"
      class="mt-10"
      :title="`Couldn't load ${activeCollection?.label ?? 'this collection'}`"
      :hint="data.error"
    >
      <template #icon>
        <Icon name="close" class="size-6" />
      </template>
      <button class="btn-primary focus-ring mt-3" @click="reload()">
        <Icon name="reset" class="size-4" aria-hidden="true" />
        Try again
      </button>
    </EmptyState>

    <!-- A search that matches nothing -->
    <EmptyState
      v-else-if="isEmpty && query"
      class="mt-10"
      :title="`No matches for '${query}'`"
    >
      <template #icon>
        <Icon name="noResults" class="size-6" />
      </template>
      <button class="btn-ghost focus-ring mt-2 px-3 py-1.5 text-sm font-medium" @click="clear()">
        Clear search
      </button>
    </EmptyState>

    <!-- Nothing drawn yet: say so instead of a wall of identical icons -->
    <EmptyState
      v-else-if="nothingDrawn"
      class="mt-10"
      title="Nothing drawn yet"
      :hint="plannedLabel"
    >
      <template #icon>
        <CollectionIcon v-if="activeCollection" :collection="activeCollection" class="size-6" />
      </template>
      <button
        v-if="viewMode === 'group'"
        class="btn-ghost focus-ring mt-2 px-3 py-1.5 text-sm font-medium"
        @click="showPlanned = true"
      >
        Show what's planned
      </button>
    </EmptyState>

    <!-- Main Content -->
    <template v-else>
      <!-- The collection's one count: how far along it is (and a switch to hide the
           gaps, while there are any), or how many drawings the date view holds -->
      <div
        v-if="stats.drawn > 0"
        class="flex flex-wrap items-center justify-between gap-2 min-h-9 -mt-1 mb-6"
      >
        <p class="with-icon text-sm text-muted tabular-nums">
          <Icon name="pencil" aria-hidden="true" />{{
            viewMode === 'group' ? drawnOf(stats.drawn, data.items.length) : drawings(stats.drawn)
          }}
        </p>
        <button
          v-if="viewMode === 'group' && stats.drawn < data.items.length"
          class="nav-item marker-b focus-ring flex items-center gap-1.5 px-3 py-1.5 text-sm max-md:min-h-9"
          :aria-pressed="drawnOnly"
          @click="toggleDrawnOnly()"
        >
          Drawn only
        </button>
      </div>

      <!-- Grouped Sections. The section is what the scroll-spy watches; its heading
           sticks to the top while you are in it, so it is the only label it needs. -->
      <section
        v-for="(items, groupName, groupIndex) in activeData.grouped"
        :key="groupName"
        :ref="el => registerHeader(String(groupName), el)"
        class="mb-12"
      >
        <!-- A stuck element stays clear of its scroll container's padding (p-4 / sm:p-6 in
             Chrome.vue), so the negative top cancels it and the heading meets the top edge. -->
        <h2
          class="sticky -top-4 sm:-top-6 z-10 -mx-4 sm:-mx-6 px-4 sm:px-6 py-2.5 mb-4 text-base font-semibold
                 flex items-center justify-between gap-3 border-b transition-colors duration-fast
                 bg-slate-50/95 text-slate-800 border-slate-200 backdrop-blur-sm
                 dark:bg-slate-950/95 dark:text-slate-100 dark:border-slate-800"
        >
          <span class="truncate">{{ groupName }}</span>
          <span class="with-icon shrink-0 text-xs font-normal tabular-nums text-muted">
            <Icon name="pencil" aria-hidden="true" />
            {{ sectionCount(String(groupName), items.length) }}
          </span>
        </h2>

        <div class="tile-grid">
          <ItemTile
            v-for="(item, itemIndex) in items"
            :key="item.id"
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
          <p class="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5">
            <span>Wildlife Illustrated &copy; {{ new Date().getFullYear() }}</span>
            <span class="with-icon" title="Version">
              <Icon name="tag" aria-hidden="true" />v{{ appVersion }}
            </span>
            <span class="with-icon">
              <Icon name="image" aria-hidden="true" />{{ drawnLabel }}
            </span>
            <span class="with-icon font-mono" title="The commit this site was built from">
              <Icon name="commit" aria-hidden="true" />{{ appCommit }}
            </span>
            <a
              href="https://github.com/seven-leven/bird_dash"
              target="_blank"
              rel="noopener noreferrer"
              class="focus-ring inline-flex items-center gap-1 rounded-control underline underline-offset-2
                     hover:text-slate-800 dark:hover:text-slate-200"
            >
              <Icon name="github" class="size-3" aria-hidden="true" />
              GitHub
            </a>
          </p>
        </footer>
      </slot>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import ItemTile from './ItemTile.vue';
import EmptyState from '../ui/EmptyState.vue';
import Icon from '../icons/Icon.vue';
import CollectionIcon from '../icons/CollectionIcon.vue';
import { useCollectionsStore } from '../../stores/collections.ts';
import { useSearch } from '../../stores/search.ts';
import { useUi } from '../../stores/ui.ts';
import { useOverlayStore } from '../../stores/overlay.ts';
import { drawings, drawnOf } from '../../lib/formatCount.ts';

const { data, activeData, stats, activeCollection } = useCollectionsStore();
const { query, clear } = useSearch();
// The template registers each section with the ui store for the scroll-spy.
const { viewMode, theme, drawnOnly, registerHeader, toggleDrawnOnly } = useUi();
const { open: openItem } = useOverlayStore();

// Injected at build time by vite.config.ts (worked out in script/version/version.ts).
const appVersion = __APP_VERSION__;
const appCommit = __APP_COMMIT__;
const drawnLabel = drawings(__APP_DRAWN__);

// ---------------------------------------------------------------------------
// COMPUTED
// ---------------------------------------------------------------------------
const isEmpty = computed(() => Object.keys(activeData.value.grouped).length === 0);

// A collection with nothing drawn shows "Nothing drawn yet"; in the family view the
// visitor can still ask to see the planned list (reset when the collection changes).
const showPlanned = ref(false);
watch(() => activeCollection.value?.id, () => (showPlanned.value = false));
const nothingDrawn = computed(() =>
  stats.value.drawn === 0 && (viewMode.value === 'date' || !showPlanned.value)
);
const plannedLabel = computed(() => `${data.items.length} planned`);
const reload = () => location.reload();

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
