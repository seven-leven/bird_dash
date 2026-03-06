<template>
  <div
    class="
      group relative aspect-square w-full overflow-hidden rounded-2xl cursor-pointer
      bg-white dark:bg-slate-900
      bg-contain bg-center bg-no-repeat
      shadow-sm transition-all duration-300 ease-out
      hover:-translate-y-1 hover:shadow-xl
      active:scale-95
      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900
    "
    :style="backgroundImageStyle"
    @click="$emit('cardClick', props.item)"
    tabindex="0"
    @keydown.enter="$emit('cardClick', props.item)"
    @keydown.space.prevent="$emit('cardClick', props.item)"
  >

    <!-- Item ID badge — slides up on hover -->
    <div class="
      absolute top-3 left-3 z-10
      rounded-md bg-black/60 px-2.5 py-1
      text-xs font-bold text-white backdrop-blur-md
      transition-transform duration-300 ease-out
      group-hover:-translate-y-12
    ">
      {{ props.item.itemId }}
    </div>

    <!-- Name container — slides down on hover -->
    <div class="
      absolute bottom-0 inset-x-0 z-10
      flex flex-col justify-end
      bg-linear-to-t from-black/90 via-black/50 to-transparent
      px-4 pb-4 pt-12
      transition-transform duration-300 ease-out
      group-hover:translate-y-full
    ">
      <!-- Show Dhivehi script if available in meta, otherwise common name -->
      <h3
        v-if="props.item.meta?.dhiv_script"
        class="font-dhivehi text-lg font-bold leading-tight text-white drop-shadow-sm"
        dir="rtl"
      >
        {{ props.item.meta.dhiv_script }}
      </h3>
      <h3
        v-else
        class="text-sm font-bold leading-tight text-white drop-shadow-sm"
      >
        {{ props.item.commonName }}
      </h3>

      <p v-if="props.item.scientificName" class="mt-1 text-xs italic text-slate-300 drop-shadow-sm">
        {{ props.item.commonName }}
      </p>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { CollectionItem } from '../collections';

const props = defineProps<{
  item:             CollectionItem;
  placeholderImage: string;
}>();

defineEmits<{ (e: 'cardClick', item: CollectionItem): void }>();

const imageToDisplay = ref('');

const loadImage = () => {
  const targetUrl = props.item.imageUrl;

  if (!targetUrl || targetUrl === props.placeholderImage) {
    imageToDisplay.value = props.placeholderImage;
    return;
  }

  const img = new Image();
  img.onload  = () => { imageToDisplay.value = targetUrl; };
  img.onerror = () => {
    console.warn(`[GridItemCard] Failed to load: ${targetUrl}`);
    imageToDisplay.value = props.placeholderImage;
  };
  img.src = targetUrl;
};

watch(() => props.item.imageUrl, loadImage, { immediate: true });

const backgroundImageStyle = computed(() =>
  imageToDisplay.value ? { backgroundImage: `url('${imageToDisplay.value}')` } : {}
);
</script>
