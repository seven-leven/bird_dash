<template>
  <div :class="$style.modalOverlay" @click.self="closeModal" role="dialog" aria-modal="true" :aria-labelledby="$style.birdName" :aria-describedby="$style.birdScientificName">
    <div :class="$style.modalContent">
      <button :class="$style.closeButton" @click="closeModal" aria-label="Close expanded view">×</button>
      
      <div :class="$style.imageWrapper">
        <img
          :src="birdImage"
          :alt="props.bird.name"
          :class="$style.birdImage"
          :style="{ transform: `scale(${currentZoom})` }"
          @error="onImageError"
          ref="birdImageRef"
        />
      </div>
      
      <div :class="$style.controls">
        <button @click="zoomOut" :disabled="currentZoom <= MIN_ZOOM" aria-label="Zoom out">-</button>
        <span :class="$style.zoomLevelDisplay" aria-live="polite">Zoom: {{ Math.round(currentZoom * 100) }}%</span>
        <button @click="zoomIn" :disabled="currentZoom >= MAX_ZOOM" aria-label="Zoom in">+</button>
      </div>
      
      <div :class="$style.birdInfo">
        <h2 :id="$style.birdName" :class="$style.birdNameTitle">{{ props.bird.name }}</h2>
        <p :id="$style.birdScientificName" :class="$style.birdScientificNameText">{{ props.bird.scientificName }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import styles from './styles/ExpandedBirdView.module.css';

const props = defineProps({
  bird: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(['close']);

const $style = styles;

const currentZoom = ref(1);
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.25;
const birdImageRef = ref(null);

const birdImage = computed(() => {
  // Assuming props.bird.image is already the fully resolved URL (including placeholder if needed)
  return props.bird.image;
});

const onImageError = (event) => {
  console.warn(`Expanded view: Image failed to load for ${props.bird.name}: ${props.bird.image}`);
  // The alt text will be shown by the browser.
  // You could set event.target.src to a specific "broken image" icon if desired.
};

const closeModal = () => {
  emit('close');
};

const zoomIn = () => {
  currentZoom.value = Math.min(MAX_ZOOM, currentZoom.value + ZOOM_STEP);
};

const zoomOut = () => {
  currentZoom.value = Math.max(MIN_ZOOM, currentZoom.value - ZOOM_STEP);
};

const handleKeydown = (event) => {
  if (event.key === 'Escape') {
    closeModal();
  }
  // Could add + / - key for zoom as well
  if (event.key === '+' || event.key === '=') {
    zoomIn();
  }
  if (event.key === '-') {
    zoomOut();
  }
};

onMounted(() => {
  document.addEventListener('keydown', handleKeydown);
  document.body.style.overflow = 'hidden'; // Prevent background scroll
  if (birdImageRef.value) {
    birdImageRef.value.focus(); // Focus the image or a control for accessibility
  }
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown);
  document.body.style.overflow = ''; // Restore background scroll
});
</script>