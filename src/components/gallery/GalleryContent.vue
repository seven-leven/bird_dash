<!-- components/gallery/GalleryContent.vue -->
<template>
  <div class="space-y-12">
    <!-- Loading State: mirrors the real grid so the swap doesn't jump -->
    <div
      v-if="data.loading"
      class="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-6 sm:grid-cols-[repeat(auto-fill,minmax(200px,1fr))]"
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
        <IconNoResults class="w-6 h-6" />
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
        <IconNoResults class="w-6 h-6" />
      </template>
    </EmptyState>

    <!-- Main Content -->
    <template v-else>
      <!-- Grouped Sections -->
      <section
        v-for="(items, groupName) in activeData.grouped"
        :key="groupName"
        class="mb-12 scroll-mt-10"
      >
        <h2
          :ref="el => { if (el) headerRefs[String(groupName)] = el as HTMLElement }"
          class="mb-5 pb-2 text-base font-semibold flex items-center justify-between transition-colors border-b
                 text-slate-800 border-slate-200 dark:text-slate-100 dark:border-slate-800"
        >
          <span>{{ groupName }}</span>
          <span class="text-xs font-normal tabular-nums text-slate-400 dark:text-slate-500">
            {{ getDrawnCount(items) }} drawn
            <template v-if="ui.viewMode === 'group'"> / {{ items.length }}</template>
          </span>
        </h2>

        <div class="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-6 sm:grid-cols-[repeat(auto-fill,minmax(200px,1fr))]">
          <ItemTile
            v-for="item in items"
            :key="item.id"
            :item="item"
            :placeholder-image="placeholderImage"
            @card-click="openItem($event)"
          />
        </div>
      </section>

      <!-- Footer (override via slot if needed) -->
      <slot name="footer">
        <footer class="mt-16 pt-6 pb-8 border-t text-center text-xs transition-colors
                       border-slate-100 text-slate-300 dark:border-slate-800/50 dark:text-slate-600">
          <p>Wildlife Illustrated &copy; {{ new Date().getFullYear() }} &middot; v{{ appVersion }}</p>
        </footer>
      </slot>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import ItemTile from './ItemTile.vue';
import EmptyState from '../ui/EmptyState.vue';
import IconNoResults from '../icons/IconNoResults.vue';
import { useAppContext } from '../../composables';
import type { CollectionItem } from '../../types';

const { data, activeData, search, activeCollection, ui, openItem } = useAppContext();

/** Derived version string, injected at build time by vite.config.ts */
const appVersion = __APP_VERSION__;

const getBase = () =>
  ((import.meta as Record<string, unknown>).env as { BASE_URL?: string })?.BASE_URL ?? '/';

// ---------------------------------------------------------------------------
// COMPUTED
// ---------------------------------------------------------------------------
const placeholderImage = computed(() =>
  activeCollection.value ? `${getBase()}placeholders/${activeCollection.value.id}.webp` : ''
);

const isEmpty = computed(() => Object.keys(activeData.value.grouped).length === 0);

// ---------------------------------------------------------------------------
// METHODS
// ---------------------------------------------------------------------------
/** Count items that have been drawn (imageUrl !== placeholder) */
const getDrawnCount = (items: CollectionItem[]): number =>
  items.filter((item) => item.imageUrl !== placeholderImage.value).length;

// ---------------------------------------------------------------------------
// REFS (exposed for parent scroll-spy)
// ---------------------------------------------------------------------------
const headerRefs = ref<Record<string, HTMLElement>>({});
defineExpose({ headerRefs });
</script>
