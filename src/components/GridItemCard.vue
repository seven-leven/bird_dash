<template>
  <div
    class="
      /* Layout & Base */
      group relative aspect-square w-full overflow-hidden rounded-2xl cursor-pointer
      
      /* Background & Fallback Colors */
      bg-slate-100 dark:bg-slate-800
      
      /* Image Positioning */
      bg-cover bg-center bg-no-repeat
      
      /* Transitions & Hover Effects */
      shadow-sm transition-all duration-300 ease-out
      hover:-translate-y-1 hover:shadow-xl
      active:scale-95
      
      /* Accessibility Focus Ring */
      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900
    "
    :style="backgroundImageStyle"
    @click="$emit('cardClick', props.bird)"
    tabindex="0"
    @keydown.enter="$emit('cardClick', props.bird)"
    @keydown.space.prevent="$emit('cardClick', props.bird)"
  >
    
    <!-- Bird Index Badge (Top Left) -->
    <!-- Logic: Slides UP (-translate-y-12) when parent (group) is hovered -->
    <div class="
      absolute top-3 left-3 z-10 
      rounded-md bg-black/60 px-2.5 py-1 
      text-xs font-bold text-white backdrop-blur-md
      transition-transform duration-300 ease-out
      group-hover:-translate-y-12
    ">
      {{ props.bird.birdId }}
    </div>

    <!-- Name Container (Bottom) -->
    <!-- Logic: Slides DOWN (translate-y-full) when parent (group) is hovered -->
    <div class="
      absolute bottom-0 inset-x-0 z-10
      flex flex-col justify-end
      bg-linear-to-t from-black/90 via-black/50 to-transparent
      px-4 pb-4 pt-12
      transition-transform duration-300 ease-out
      group-hover:translate-y-full
    ">
      <h3 class="text-lg font-bold leading-tight text-white drop-shadow-sm">
        {{ props.bird.commonName }}
      </h3>
      
      <p v-if="props.bird.scientificName" class="mt-1 text-xs italic text-slate-300 drop-shadow-sm">
        {{ props.bird.scientificName }}
      </p>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  bird: { 
    type: Object,
    required: true,
  },
  placeholderImage: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(['cardClick']);

const imageToDisplay = ref('');

const loadImage = () => {
  const targetUrl = props.bird.imageUrl;

  if (!targetUrl || targetUrl === props.placeholderImage) {
    imageToDisplay.value = props.placeholderImage;
    return;
  }

  const img = new Image();
  img.onload = () => {
    imageToDisplay.value = targetUrl;
  };
  img.onerror = () => {
    console.warn(`[GridItemCard] Failed to load image: ${targetUrl}. Using placeholder.`);
    imageToDisplay.value = props.placeholderImage;
  };
  img.src = targetUrl;
};

watch(() => props.bird.imageUrl, loadImage, { immediate: true });

const backgroundImageStyle = computed(() => {
  if (imageToDisplay.value) {
    return { backgroundImage: `url('${imageToDisplay.value}')` };
  }
  return {};
});
</script>