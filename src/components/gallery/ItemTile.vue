<template>
  <div
    class="group relative aspect-square w-full overflow-hidden rounded-xl cursor-pointer
           bg-slate-100 dark:bg-slate-900
           bg-contain bg-center bg-no-repeat
           ring-1 ring-black/5 dark:ring-white/5
           transition-all duration-200 ease-out
           hover:ring-black/15 dark:hover:ring-white/10
           hover:shadow-lg hover:-translate-y-0.5
           active:scale-[0.98] active:shadow-sm
           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950"
    :style="backgroundImageStyle"
    @click="$emit('cardClick', props.item)"
    tabindex="0"
    role="button"
    :aria-label="`${props.item.commonName}, #${props.item.itemId}`"
    @keydown.enter="$emit('cardClick', props.item)"
    @keydown.space.prevent="$emit('cardClick', props.item)"
  >
    <!-- Item ID badge — fades out on hover -->
    <div class="absolute top-2.5 left-2.5 z-10
                rounded-md bg-black/50 px-2 py-0.5
                text-[10px] font-semibold font-mono text-white/90 backdrop-blur-sm
                transition-opacity duration-200
                group-hover:opacity-0">
      {{ props.item.itemId }}
    </div>

    <!-- Name overlay — always visible, fades out on hover -->
    <div class="absolute bottom-0 inset-x-0 z-10
                bg-linear-to-t from-black/80 via-black/40 to-transparent
                px-3 pb-3 pt-10
                transition-opacity duration-200
                group-hover:opacity-0">
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
      <p v-if="props.item.scientificName" class="mt-0.5 text-[10px] italic text-white/60 truncate">
        {{ props.item.scientificName }}
      </p>
    </div>

    <!-- Hover reveal — name + subtle frame -->
    <div class="absolute inset-0 z-10 flex flex-col items-center justify-center p-4
                opacity-0 group-hover:opacity-100 transition-opacity duration-200
                bg-black/20">
      <p class="text-xs font-semibold text-white text-center leading-snug drop-shadow">
        {{ props.item.commonName }}
      </p>
      <p v-if="props.item.scientificName" class="mt-1 text-[10px] italic text-white/70 text-center">
        {{ props.item.scientificName }}
      </p>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { CollectionItem } from '../../types/';

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
