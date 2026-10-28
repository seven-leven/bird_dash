<!-- One section of the grid: a group, or a month. The section is what the scroll-spy watches;
     its heading sticks to the top while you are in it, so it is the only label it needs. -->
<template>
  <section :ref="(el) => registerHeader(name, el)" class="mb-12">
    <!-- A stuck element stays clear of its scroll container's padding (p-4 / sm:p-6 in
         AppShell.vue), so the negative top cancels it and the heading meets the top edge. -->
    <h2
      class="sticky -top-4 sm:-top-6 z-10 -mx-4 sm:-mx-6 px-4 sm:px-6 py-2.5 mb-4 text-base font-semibold
             flex items-center justify-between gap-3 border-b transition-colors duration-fast
             bg-slate-50/95 text-slate-800 border-slate-200 backdrop-blur-sm
             dark:bg-slate-950/95 dark:text-slate-100 dark:border-slate-800"
    >
      <span class="truncate">{{ name }}</span>
      <span class="with-icon shrink-0 text-xs font-normal tabular-nums text-muted">
        <Icon name="pencil" aria-hidden="true" />
        {{ count }}
      </span>
    </h2>

    <div class="tile-grid">
      <ItemTile
        v-for="(item, index) in items"
        :key="item.id"
        :item="item"
        :collection="collection"
        :eager="first && index < EAGER_TILES"
        @card-click="open($event)"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import Icon from '../ui/Icon.vue';
import ItemTile from './ItemTile.vue';
import { useViewStore } from './viewStore.ts';
import { useViewerStore } from '../viewer/viewerStore.ts';
import type { Item } from '../domain/toCollectionItems.ts';

/** Tiles in the first section that load at once: what fills the first screen. */
const EAGER_TILES = 6;

defineProps<{
  name: string;
  items: Item[];
  /** The collection on screen, whose icon stands in for what is not drawn yet. */
  collection: { icon?: string; emoji: string };
  /** "4 of 8 drawn", or "3 drawings". */
  count: string;
  /** The first section on the page, whose first tiles are wanted at once. */
  first: boolean;
}>();

const { registerHeader } = useViewStore();
const { open } = useViewerStore();
</script>
