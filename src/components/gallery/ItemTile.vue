<template>
  <div
    :id="`item-${props.item.itemId}`"
    class="group focus-ring relative aspect-square w-full overflow-hidden rounded-xl cursor-pointer
           bg-slate-100 dark:bg-slate-900
           ring-1 ring-black/5 dark:ring-white/5
           transition-all duration-200 ease-out
           hover:ring-black/15 dark:hover:ring-white/10
           hover:shadow-lg hover:-translate-y-0.5
           active:scale-[0.98] active:shadow-sm"
    @click="$emit('cardClick', props.item)"
    tabindex="0"
    role="button"
    :aria-label="`${props.item.commonName}, #${props.item.itemId}`"
    @keydown.enter="$emit('cardClick', props.item)"
    @keydown.space.prevent="$emit('cardClick', props.item)"
  >
    <!-- Illustration — native lazy loading, placeholder fallback on error -->
    <img
      :src="src"
      :alt="props.item.commonName"
      loading="lazy"
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

    <!-- Name overlay — hover deepens it and reveals the secondary line -->
    <div class="absolute bottom-0 inset-x-0 z-10
                bg-linear-to-t from-black/80 via-black/40 to-transparent
                px-3 pb-3 pt-10
                transition-colors duration-200
                group-hover:from-black/90 group-hover:via-black/50">
      <h3
        v-if="props.item.meta?.dhiv_script"
        class="font-dhivehi text-base font-bold leading-tight text-white"
        dir="rtl"
      >
        {{ props.item.meta.dhiv_script }}
      </h3>
      <h3 v-else class="text-xs font-semibold leading-snug text-white truncate">
        {{ props.item.commonName }}
      </h3>

      <div class="max-h-0 opacity-0 overflow-hidden transition-all duration-200
                  group-hover:max-h-16 group-hover:opacity-100 group-focus-visible:max-h-16 group-focus-visible:opacity-100">
        <p v-if="props.item.meta?.dhiv_script" class="mt-0.5 text-[11px] font-medium text-white/80 truncate">
          {{ props.item.commonName }}
        </p>
        <p v-if="props.item.scientificName" class="mt-0.5 text-[10px] italic text-white/60 truncate">
          {{ props.item.scientificName }}
        </p>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import IdBadge from '../ui/IdBadge.vue';
import type { CollectionItem } from '../../types/';

const props = defineProps<{
  item: CollectionItem;
  placeholderImage: string;
}>();

defineEmits<{ (e: 'cardClick', item: CollectionItem): void }>();

// The tile is keyed by item.id in the grid, so a new item => a fresh component;
// no watcher needed. Undrawn items and load failures fall back to the placeholder.
const failed = ref(false);
const src = computed(() =>
  props.item.isDrawn && !failed.value ? props.item.imageUrl : props.placeholderImage
);

function onError() {
  failed.value = true;
}
</script>
