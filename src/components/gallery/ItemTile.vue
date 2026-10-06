<template>
  <div
    :id="`item-${props.item.itemId}`"
    class="group focus-ring relative aspect-square w-full overflow-hidden rounded-card
           bg-slate-100 dark:bg-slate-900
           ring-1 ring-black/5 dark:ring-white/5
           transition-all duration-fast ease-out"
    :class="drawn && INTERACTIVE"
    v-bind="buttonAttrs"
    @click="open"
    @keydown.enter="open"
    @keydown.space="onSpace"
  >
    <!-- Illustration — above-the-fold tiles load eagerly (LCP), rest are lazy -->
    <img
      :src="src"
      :alt="drawn ? props.item.commonName : `${props.item.commonName} (not drawn yet)`"
      :loading="eager ? 'eager' : 'lazy'"
      :fetchpriority="eager ? 'high' : 'auto'"
      decoding="async"
      class="absolute inset-0 w-full h-full object-contain object-center select-none"
      draggable="false"
      @error="onError"
    />

    <!-- Item ID badge -->
    <IdBadge
      :id="props.item.itemId"
      variant="overlay"
      class="absolute top-2.5 left-2.5 z-10"
    />

    <!-- Name overlay — hover deepens it and reveals the secondary line. Touch
         screens have no hover, so there the common name is always shown. -->
    <div class="absolute bottom-0 inset-x-0 z-10
                bg-linear-to-t from-black/80 via-black/40 to-transparent
                px-3 pb-3 pt-10
                transition-colors duration-fast
                group-hover:from-black/90 group-hover:via-black/50">
      <h3
        v-if="props.item.meta?.dhiv_script"
        class="font-dhivehi text-base font-bold leading-tight text-white"
        dir="rtl"
      >
        {{ props.item.meta.dhiv_script }}
      </h3>
      <h3 v-else class="text-sm font-semibold leading-snug text-white truncate">
        {{ props.item.commonName }}
      </h3>

      <div class="max-h-0 opacity-0 overflow-hidden transition-all duration-fast
                  group-hover:max-h-16 group-hover:opacity-100 group-focus-visible:max-h-16 group-focus-visible:opacity-100
                  pointer-coarse:max-h-16 pointer-coarse:opacity-100">
        <p v-if="props.item.meta?.dhiv_script" class="mt-0.5 text-micro font-medium text-white/70 truncate">
          {{ props.item.commonName }}
        </p>
        <p v-if="props.item.scientificName" class="mt-0.5 text-micro italic text-white/70 truncate pointer-coarse:hidden">
          {{ props.item.scientificName }}
        </p>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import IdBadge from '../ui/IdBadge.vue';
import { tileImage } from '../../lib/collectionItems.ts';
import type { CollectionItem } from '../../types/';

const props = withDefaults(
  defineProps<{
    item: CollectionItem;
    /** Above-the-fold tiles load eagerly with high priority (helps LCP). */
    eager?: boolean;
    /** Dark theme: undrawn items show the dark placeholder. */
    dark?: boolean;
  }>(),
  { eager: false, dark: false },
);

const emit = defineEmits<{ (e: 'cardClick', item: CollectionItem): void }>();

// Only drawn items open the viewer. A placeholder is not a button: it gets no
// role, tab stop or hover lift, so nothing promises an action that never happens.
const INTERACTIVE = 'cursor-pointer hover:ring-black/15 dark:hover:ring-white/10 hover:shadow-lg ' +
  'hover:-translate-y-0.5 active:scale-[0.98] active:shadow-sm';
const drawn = computed(() => props.item.isDrawn);
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
// no watcher needed. Undrawn items and load failures fall back to the placeholder.
const failed = ref(false);
const src = computed(() => tileImage(props.item, props.dark, failed.value));

function onError() {
  failed.value = true;
}
</script>
