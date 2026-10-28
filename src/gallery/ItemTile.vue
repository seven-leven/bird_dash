<template>
  <!-- A square image with its names in a caption below it, never on top of it
       (docs/DESIGN.md §9). A drawn tile is paper-white and opens the viewer; an
       undrawn one stays on the interface grey and does nothing. `isolate` keeps the
       id badge's z-index inside the tile, so a sticky section heading covers it. -->
  <div
    :id="`item-${props.item.itemId}`"
    class="group isolate focus-ring flex flex-col w-full overflow-hidden rounded-card
           ring-1 ring-black/5 dark:ring-white/5
           transition-all duration-fast ease-out"
    :class="drawn ? `bg-white dark:bg-slate-900 ${INTERACTIVE}` : 'bg-slate-100 dark:bg-slate-900'"
    v-bind="buttonAttrs"
    @click="open"
    @keydown.enter="open"
    @keydown.space="onSpace"
  >
    <div class="relative aspect-square" :class="drawn ? 'bg-white' : 'bg-slate-100 dark:bg-slate-900'">
      <!-- Illustration — above-the-fold tiles load eagerly (LCP), rest are lazy -->
      <img
        v-if="drawn && !failed"
        :src="props.item.imageUrl"
        :alt="props.item.commonName"
        :loading="eager ? 'eager' : 'lazy'"
        :fetchpriority="eager ? 'high' : 'auto'"
        decoding="async"
        class="absolute inset-0 w-full h-full object-contain object-center select-none"
        draggable="false"
        @error="onError"
      />
      <!-- Not drawn yet, or the drawing failed to load: the collection's icon, faint on the
           tile grey (docs/DESIGN.md §9), drawn in the page's theme. -->
      <div
        v-else
        role="img"
        :aria-label="drawn ? props.item.commonName : `${props.item.commonName} (not drawn yet)`"
        class="absolute inset-0 flex items-center justify-center text-slate-400 dark:text-slate-600"
      >
        <CollectionIcon :collection="collection" class="size-[56%] stroke-[1.5] text-3xl" />
      </div>

      <!-- The one thing allowed on the image -->
      <IdBadge
        :id="props.item.itemId"
        variant="overlay"
        class="absolute top-2.5 left-2.5 z-10"
      />
    </div>

    <!-- Caption: every name but the Latin, a line per language (Dhivehi first) -->
    <div
      class="min-w-0 px-3 pt-2 pb-2.5 border-t"
      :class="drawn ? 'border-slate-100 dark:border-slate-800' : 'border-transparent'"
    >
      <template v-for="line in caption" :key="line.lang">
        <p
          v-if="line.lang === 'dv'"
          class="font-dhivehi text-base font-bold truncate"
          :class="drawn ? 'text-slate-900 dark:text-slate-100' : 'text-slate-600 dark:text-slate-400'"
          dir="rtl"
        >
          {{ line.text }}
        </p>
        <h3
          v-else
          class="text-sm leading-snug truncate"
          :class="drawn ? 'font-semibold text-slate-700 dark:text-slate-300' : 'text-slate-600 dark:text-slate-400'"
        >
          {{ line.text }}
        </h3>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import IdBadge from '../ui/IdBadge.vue';
import CollectionIcon from '../ui/CollectionIcon.vue';
import { nameLines } from '../domain/itemNames.ts';
import type { Item } from '../domain/toCollectionItems.ts';

const props = withDefaults(
  defineProps<{
    item: Item;
    /** Its collection, whose icon stands in for a drawing not made (or not loaded) yet. */
    collection: { icon?: string; emoji: string };
    /** Above-the-fold tiles load eagerly with high priority (helps LCP). */
    eager?: boolean;
  }>(),
  { eager: false },
);

const emit = defineEmits<{ (e: 'cardClick', item: Item): void }>();

// Only drawn items open the viewer. A placeholder is not a button: it gets no
// role, tab stop or hover lift, so nothing promises an action that never happens.
const INTERACTIVE = 'cursor-pointer hover:ring-black/15 dark:hover:ring-white/10 hover:shadow-lift ' +
  'hover:-translate-y-0.5 active:scale-[0.98]';
const drawn = computed(() => props.item.isDrawn);
const caption = computed(() => nameLines(props.item.names).filter((l) => l.lang !== 'la'));
const buttonAttrs = computed(() =>
  drawn.value
    ? {
      tabindex: 0,
      role: 'button',
      'aria-label': `${props.item.commonName}, #${props.item.itemId}`,
    }
    : {}
);
const open = () => {
  if (drawn.value) emit('cardClick', props.item);
};
const onSpace = (e: KeyboardEvent) => {
  if (!drawn.value) return;
  e.preventDefault(); // don't scroll the page
  open();
};

// The tile is keyed by item.id in the grid, so a new item => a fresh component;
// no watcher needed. A drawing that fails to load shows the icon instead.
const failed = ref(false);

function onError() {
  failed.value = true;
}
</script>
