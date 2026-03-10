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
        <!-- Close -->
        <button @click="close" class="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        <!-- Zoom controls -->
        <div class="absolute top-4 left-4 z-20 flex gap-2">
          <button @click="zoomIn" class="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
            </svg>
          </button>
          <button @click="zoomOut" class="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/>
            </svg>
          </button>
          <button @click="resetZoom" class="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/>
            </svg>
          </button>
        </div>

        <div class="absolute top-4 left-1/2 -translate-x-1/2 z-20 px-3 py-1 rounded-full bg-white/10 text-white text-sm font-mono">
          {{ Math.round(scale * 100) }}%
        </div>

        <!-- Navigation -->
        <button v-if="hasPrevious" @click="goToPrevious" class="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/10 text-white">
           <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15,18 9,12 15,6"/></svg>
        </button>

        <button v-if="hasNext" @click="goToNext" class="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/10 text-white">
           <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9,18 15,12 9,6"/></svg>
        </button>

        <!-- Main Display -->
        <div class="relative w-full h-full flex items-center justify-center p-4 lg:p-8 gap-6">
          <div
            class="flex-1 h-full flex items-center justify-center overflow-hidden rounded-lg"
            @wheel.prevent="handleWheel"
            @mousedown="handleMouseDown"
            @mousemove="handleMouseMove"
            @mouseup="handleMouseUp"
            @mouseleave="handleMouseUp"
          >
            <Transition enter-active-class="transition-all duration-300" mode="out-in">
              <img
                v-if="imageUrl && !error"
                :key="currentItem?.itemId"
                :src="imageUrl"
                :style="{
                  transform: `scale(${scale}) translate(${translateX}px, ${translateY}px)`,
                  cursor: isDragging ? 'grabbing' : (scale > 1 ? 'grab' : 'zoom-in'),
                }"
                class="max-w-full max-h-full object-contain transition-transform duration-200 select-none"
                @load="handleImageLoad"
                @error="handleImageError"
                draggable="false"
              />
            </Transition>

            <div v-if="loading" class="absolute inset-0 flex items-center justify-center">
              <div class="w-12 h-12 border-3 border-white/20 border-t-white rounded-full animate-spin" />
            </div>
            <!-- Error state UI here... -->
          </div>

          <div v-if="currentItem" class="absolute bottom-16 left-4 right-4 lg:static lg:w-auto lg:max-w-sm z-10">
            <ItemInfoPanel :item="currentItem" :collection="collection" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import ItemInfoPanel from './ItemSheet.vue';
import type { CollectionItem, CollectionConfig } from '../../types/collections';
import { useLightbox } from '../../composables/index'; // Adjust path

const props = defineProps<{
  isOpen:           boolean;
  item?:            CollectionItem;
  drawnItems:       CollectionItem[];
  fullImageBaseUrl: string;
  collection:       CollectionConfig;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'update:item', item: CollectionItem): void;
}>();

// All logic is now encapsulated here
const {
  currentItem,
  hasPrevious,
  hasNext,
  imageUrl,
  loading,
  error,
  scale,
  translateX,
  translateY,
  isDragging,
  zoomIn,
  zoomOut,
  resetZoom,
  handleWheel,
  handleMouseDown,
  handleMouseMove,
  handleMouseUp,
  goToPrevious,
  goToNext,
  close,
  handleBackdropClick,
  handleImageLoad,
  handleImageError
} = useLightbox({ props, emit });
</script>