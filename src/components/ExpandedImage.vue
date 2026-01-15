<template>
  <!-- Overlay backdrop -->
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-300"
      leave-active-class="transition-opacity duration-300"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isOpen"
        class="fixed inset-0 z-100 flex items-center justify-center bg-black/95 backdrop-blur-sm"
        @click="handleBackdropClick"
      >
        <!-- Close button -->
        <button
          @click="close"
          class="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <!-- Zoom controls -->
        <div class="absolute top-4 left-4 z-10 flex gap-2">
          <button
            @click="zoomIn"
            class="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="Zoom In"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              <line x1="11" y1="8" x2="11" y2="14"></line>
              <line x1="8" y1="11" x2="14" y2="11"></line>
            </svg>
          </button>
          <button
            @click="zoomOut"
            class="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="Zoom Out"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              <line x1="8" y1="11" x2="14" y2="11"></line>
            </svg>
          </button>
          <button
            @click="resetZoom"
            class="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="Reset Zoom"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
              <path d="M21 3v5h-5"></path>
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
              <path d="M3 21v-5h5"></path>
            </svg>
          </button>
        </div>

        <!-- Zoom level indicator -->
        <div class="absolute top-4 left-1/2 -translate-x-1/2 z-10 px-3 py-1 rounded-full bg-white/10 text-white text-sm">
          {{ Math.round(scale * 100) }}%
        </div>

        <!-- Bird info -->
        <div v-if="bird" class="absolute bottom-4 left-4 right-4 z-10 text-white">
          <div class="bg-black/50 backdrop-blur-sm rounded-lg p-4 max-w-md">
            <h3 class="text-xl font-bold mb-1">{{ bird.commonName }}</h3>
            <p class="text-sm text-white/80 italic">{{ bird.scientificName }}</p>
            <p class="text-sm text-white/60 mt-1">{{ bird.family }}</p>
          </div>
        </div>

        <!-- Image container -->
        <div
          ref="imageContainer"
          class="relative overflow-hidden w-full h-full flex items-center justify-center p-16"
          @wheel.prevent="handleWheel"
          @mousedown="handleMouseDown"
          @mousemove="handleMouseMove"
          @mouseup="handleMouseUp"
          @mouseleave="handleMouseUp"
        >
          <Transition
            enter-active-class="transition-all duration-300"
            leave-active-class="transition-all duration-300"
            enter-from-class="opacity-0 scale-95"
            leave-to-class="opacity-0 scale-95"
          >
            <img
              v-if="imageUrl"
              :src="imageUrl"
              :alt="bird?.commonName"
              class="max-w-none object-contain transition-transform duration-200 select-none"
              :style="{
                transform: `scale(${scale}) translate(${translateX}px, ${translateY}px)`,
                cursor: isDragging ? 'grabbing' : (scale > 1 ? 'grab' : 'default')
              }"
              @load="handleImageLoad"
              @error="handleImageError"
              draggable="false"
            />
          </Transition>

          <!-- Loading state -->
          <div v-if="loading" class="absolute inset-0 flex items-center justify-center">
            <div class="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
          </div>

          <!-- Error state -->
          <div v-if="error" class="absolute inset-0 flex items-center justify-center">
            <div class="text-center text-white">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mx-auto mb-4 opacity-50">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <p class="text-lg font-semibold">Failed to load image</p>
              <p class="text-sm text-white/60 mt-2">{{ error }}</p>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  isOpen: Boolean,
  bird: Object,
  fullImageBaseUrl: String
});

const emit = defineEmits(['close']);

// Image state
const imageUrl = ref('');
const loading = ref(false);
const error = ref(null);

// Zoom state
const scale = ref(1);
const translateX = ref(0);
const translateY = ref(0);

// Drag state
const isDragging = ref(false);
const dragStartX = ref(0);
const dragStartY = ref(0);
const dragStartTranslateX = ref(0);
const dragStartTranslateY = ref(0);

// Refs
const imageContainer = ref(null);

// Computed
const fullImageUrl = computed(() => {
  if (!props.bird?.birdId) return '';
  return `${props.fullImageBaseUrl}${props.bird.birdId}.webp`;
});

// Methods
const close = () => {
  emit('close');
  resetZoom();
};

const handleBackdropClick = (e) => {
  if (e.target === e.currentTarget) {
    close();
  }
};

const zoomIn = () => {
  scale.value = Math.min(scale.value + 0.25, 5);
};

const zoomOut = () => {
  scale.value = Math.max(scale.value - 0.25, 0.5);
  // Reset translation if zoomed out to 1x or less
  if (scale.value <= 1) {
    translateX.value = 0;
    translateY.value = 0;
  }
};

const resetZoom = () => {
  scale.value = 1;
  translateX.value = 0;
  translateY.value = 0;
};

const handleWheel = (e) => {
  const delta = e.deltaY > 0 ? -0.1 : 0.1;
  scale.value = Math.max(0.5, Math.min(5, scale.value + delta));
  
  // Reset translation if zoomed out to 1x or less
  if (scale.value <= 1) {
    translateX.value = 0;
    translateY.value = 0;
  }
};

const handleMouseDown = (e) => {
  if (scale.value <= 1) return;
  
  isDragging.value = true;
  dragStartX.value = e.clientX;
  dragStartY.value = e.clientY;
  dragStartTranslateX.value = translateX.value;
  dragStartTranslateY.value = translateY.value;
};

const handleMouseMove = (e) => {
  if (!isDragging.value) return;
  
  const deltaX = e.clientX - dragStartX.value;
  const deltaY = e.clientY - dragStartY.value;
  
  translateX.value = dragStartTranslateX.value + deltaX / scale.value;
  translateY.value = dragStartTranslateY.value + deltaY / scale.value;
};

const handleMouseUp = () => {
  isDragging.value = false;
};

const handleImageLoad = () => {
  loading.value = false;
  error.value = null;
};

const handleImageError = () => {
  loading.value = false;
  error.value = 'Image not found';
};

const loadImage = () => {
  if (!props.bird || !props.isOpen) return;
  
  loading.value = true;
  error.value = null;
  imageUrl.value = fullImageUrl.value;
};

// Watch for changes
watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    loadImage();
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
  } else {
    // Reset state when closing
    imageUrl.value = '';
    loading.value = false;
    error.value = null;
    resetZoom();
    document.body.style.overflow = '';
  }
});

// Keyboard shortcuts
watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    const handleKeydown = (e) => {
      if (e.key === 'Escape') close();
      if (e.key === '+' || e.key === '=') zoomIn();
      if (e.key === '-') zoomOut();
      if (e.key === '0') resetZoom();
    };
    
    window.addEventListener('keydown', handleKeydown);
    
    return () => {
      window.removeEventListener('keydown', handleKeydown);
    };
  }
});
</script>