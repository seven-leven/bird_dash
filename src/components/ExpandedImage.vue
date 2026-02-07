<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-300"
      leave-active-class="transition-opacity duration-300"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm"
        @click="handleBackdropClick"
      >
        <!-- Close button -->
        <button
          @click="close"
          class="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <!-- Zoom controls -->
        <div class="absolute top-4 left-4 z-20 flex gap-2">
          <button
            @click="zoomIn"
            class="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="Zoom In"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
              <path d="M21 3v5h-5"></path>
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
              <path d="M3 21v-5h5"></path>
            </svg>
          </button>
        </div>

        <!-- Zoom level indicator -->
        <div class="absolute top-4 left-1/2 -translate-x-1/2 z-20 px-3 py-1 rounded-full bg-white/10 text-white text-sm font-mono">
          {{ Math.round(scale * 100) }}%
        </div>

        <!-- Navigation Arrows -->
        <!-- Previous -->
        <button
          v-if="hasPrevious"
          @click="goToPrevious"
          class="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all hover:scale-110"
          aria-label="Previous bird"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15,18 9,12 15,6"></polyline>
          </svg>
        </button>
        
        <!-- Next -->
        <button
          v-if="hasNext"
          @click="goToNext"
          class="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all hover:scale-110"
          aria-label="Next bird"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9,18 15,12 9,6"></polyline>
          </svg>
        </button>

        <!-- Image counter -->
        <div class="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 px-3 py-1 rounded-full bg-black/50 text-white text-xs">
          {{ currentIndex + 1 }} / {{ drawnBirds.length }}
        </div>

        <!-- Main content area: Image + Info Panel -->
        <div class="relative w-full h-full flex items-center justify-center p-4 lg:p-8 gap-6">
          
          <!-- Image container -->
          <div
            ref="imageContainer"
            class="flex-1 h-full flex items-center justify-center overflow-hidden rounded-lg"
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
              mode="out-in"
            >
              <img
                v-if="imageUrl && !error"
                :key="currentBird?.birdId"
                :src="imageUrl"
                :alt="currentBird?.commonName"
                class="max-w-full max-h-full object-contain transition-transform duration-200 select-none"
                :style="{
                  transform: `scale(${scale}) translate(${translateX}px, ${translateY}px)`,
                  cursor: isDragging ? 'grabbing' : (scale > 1 ? 'grab' : 'zoom-in')
                }"
                @load="handleImageLoad"
                @error="handleImageError"
                draggable="false"
              />
            </Transition>

            <!-- Loading state -->
            <div v-if="loading" class="absolute inset-0 flex items-center justify-center">
              <div class="w-12 h-12 border-3 border-white/20 border-t-white rounded-full animate-spin"></div>
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

          <!-- Info Panel -->
          <div 
            v-if="currentBird"
            class="absolute bottom-16 left-4 right-4 lg:static lg:w-auto lg:max-w-sm z-10"
          >
            <BirdInfoPanel :bird="currentBird" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue';
import BirdInfoPanel from './BirdInfoPanel.vue';

interface Bird {
  id: string;
  birdId: string;
  commonName: string;
  scientificName: string;
  family: string;
  drawnDate: string;
  imageFile: string;
  imageUrl: string;
  illustratorNote?: string;
}

const props = defineProps<{
  isOpen: boolean;
  bird?: Bird;
  drawnBirds: Bird[]; // List of all drawn birds for navigation
  fullImageBaseUrl: string;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'update:bird', bird: Bird): void; // For v-model style updates
}>();

// Current bird state (local copy for navigation)
const currentBird = ref<Bird | undefined>(props.bird);
const currentIndex = computed(() => {
  if (!currentBird.value) return -1;
  return props.drawnBirds.findIndex(b => b.birdId === currentBird.value?.birdId);
});

// Navigation computed properties
const hasPrevious = computed(() => currentIndex.value > 0);
const hasNext = computed(() => currentIndex.value < props.drawnBirds.length - 1 && currentIndex.value !== -1);

// Navigation methods
const goToPrevious = () => {
  if (!hasPrevious.value) return;
  const newIndex = currentIndex.value - 1;
  navigateToBird(newIndex);
};

const goToNext = () => {
  if (!hasNext.value) return;
  const newIndex = currentIndex.value + 1;
  navigateToBird(newIndex);
};

const navigateToBird = (index: number) => {
  const targetBird = props.drawnBirds[index];
  if (!targetBird) return;
  
  // Reset zoom before switching
  resetZoom();
  
  // Update current bird
  currentBird.value = targetBird;
  emit('update:bird', targetBird);
  
  // Load new image
  loadImage();
};

// Image state
const imageUrl = ref('');
const loading = ref(false);
const error = ref<string | null>(null);

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
const imageContainer = ref<HTMLDivElement | null>(null);

// Computed
const fullImageUrl = computed(() => {
  if (!currentBird.value?.birdId) return '';
  return `${props.fullImageBaseUrl}${currentBird.value.birdId}.webp`;
});

// Methods
const close = () => {
  emit('close');
  resetZoom();
};

const handleBackdropClick = (e: MouseEvent) => {
  if (e.target === e.currentTarget) {
    close();
  }
};

const zoomIn = () => {
  scale.value = Math.min(scale.value + 0.25, 5);
};

const zoomOut = () => {
  scale.value = Math.max(scale.value - 0.25, 0.5);
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

const handleWheel = (e: WheelEvent) => {
  const delta = e.deltaY > 0 ? -0.1 : 0.1;
  const newScale = Math.max(0.5, Math.min(5, scale.value + delta));
  scale.value = newScale;
  
  if (scale.value <= 1) {
    translateX.value = 0;
    translateY.value = 0;
  }
};

const handleMouseDown = (e: MouseEvent) => {
  if (scale.value <= 1) return;
  
  isDragging.value = true;
  dragStartX.value = e.clientX;
  dragStartY.value = e.clientY;
  dragStartTranslateX.value = translateX.value;
  dragStartTranslateY.value = translateY.value;
};

const handleMouseMove = (e: MouseEvent) => {
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
  if (!currentBird.value) return;
  
  loading.value = true;
  error.value = null;
  imageUrl.value = fullImageUrl.value;
};

// Keyboard handler
const handleKeydown = (e: KeyboardEvent) => {
  if (!props.isOpen) return;
  
  switch(e.key) {
    case 'Escape':
      close();
      break;
    case '+':
    case '=':
      zoomIn();
      break;
    case '-':
      zoomOut();
      break;
    case '0':
      resetZoom();
      break;
    case 'ArrowLeft':
    case 'ArrowUp':
      e.preventDefault();
      goToPrevious();
      break;
    case 'ArrowRight':
    case 'ArrowDown':
      e.preventDefault();
      goToNext();
      break;
  }
};

// Watch for changes
watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    // Sync current bird with prop when opening
    currentBird.value = props.bird;
    loadImage();
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeydown);
  } else {
    imageUrl.value = '';
    loading.value = false;
    error.value = null;
    resetZoom();
    document.body.style.overflow = '';
    window.removeEventListener('keydown', handleKeydown);
  }
});

// Watch for external bird changes (e.g., from parent)
watch(() => props.bird, (newBird) => {
  if (props.isOpen && newBird && newBird.birdId !== currentBird.value?.birdId) {
    currentBird.value = newBird;
    resetZoom();
    loadImage();
  }
});

// Cleanup
onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
  document.body.style.overflow = '';
});
</script>