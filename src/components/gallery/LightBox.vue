<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-250 ease-out"
      leave-active-class="transition-opacity duration-200 ease-in"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/95"
        @click="handleBackdropClick"
      >

        <!-- Top bar: zoom controls left, zoom % inline, close right -->
        <div class="absolute top-0 inset-x-0 z-20 flex items-center justify-between px-4 py-3 pointer-events-none">

          <!-- Zoom controls -->
          <div class="flex items-center gap-1 pointer-events-auto">
            <button @click="zoomIn"    class="flex items-center justify-center w-8 h-8 rounded-lg text-white/40 hover:text-white/90 hover:bg-white/10 transition-all duration-150" aria-label="Zoom in">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
              </svg>
            </button>
            <button @click="zoomOut"   class="flex items-center justify-center w-8 h-8 rounded-lg text-white/40 hover:text-white/90 hover:bg-white/10 transition-all duration-150" aria-label="Zoom out">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/>
              </svg>
            </button>
            <button @click="resetZoom" class="flex items-center justify-center w-8 h-8 rounded-lg text-white/40 hover:text-white/90 hover:bg-white/10 transition-all duration-150" aria-label="Reset zoom">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/>
              </svg>
            </button>
            <span class="ml-2 text-[11px] font-mono text-white/35 tabular-nums">{{ Math.round(scale * 100) }}%</span>
          </div>

          <!-- Close -->
          <button @click="close" class="flex items-center justify-center w-8 h-8 rounded-lg text-white/40 hover:text-white/90 hover:bg-white/10 transition-all duration-150 pointer-events-auto" aria-label="Close">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <!-- Prev / Next navigation -->
        <button
          v-if="hasPrevious"
          @click.stop="goToPrevious"
          class="absolute left-3 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-10 h-10 rounded-xl bg-white/6 hover:bg-white/12 text-white/50 hover:text-white transition-all duration-150"
          aria-label="Previous"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15,18 9,12 15,6"/></svg>
        </button>

        <button
          v-if="hasNext"
          @click.stop="goToNext"
          class="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-10 h-10 rounded-xl bg-white/6 hover:bg-white/12 text-white/50 hover:text-white transition-all duration-150"
          aria-label="Next"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9,18 15,12 9,6"/></svg>
        </button>

        <!-- Main layout: image left, info panel right -->
        <div
          class="relative w-full h-full flex flex-col lg:flex-row items-center justify-center
                 gap-4 pt-14 pb-4 px-4
                 lg:gap-6 lg:pt-14 lg:pb-8 lg:px-16"
          @click.stop
        >

          <!-- Image area -->
          <div
            class="flex-1 h-full flex items-center justify-center overflow-hidden min-w-0"
            @wheel.prevent="handleWheel"
            @mousedown="handleMouseDown"
            @mousemove="handleMouseMove"
            @mouseup="handleMouseUp"
            @mouseleave="handleMouseUp"
          >
            <Transition
              enter-active-class="transition-opacity duration-200"
              enter-from-class="opacity-0"
              enter-to-class="opacity-100"
              mode="out-in"
            >
              <img
                v-if="imageUrl && !error"
                :key="currentItem?.itemId"
                :src="imageUrl"
                :style="{
                  transform: `scale(${scale}) translate(${translateX}px, ${translateY}px)`,
                  cursor: isDragging ? 'grabbing' : (scale > 1 ? 'grab' : 'default'),
                  transition: isDragging ? 'none' : 'transform 0.15s ease-out',
                }"
                class="max-w-full max-h-full object-contain select-none"
                @load="handleImageLoad"
                @error="handleImageError"
                draggable="false"
              />
            </Transition>

            <!-- Loading spinner -->
            <div v-if="loading" class="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div class="w-8 h-8 border-2 border-white/15 border-t-white/50 rounded-full animate-spin" />
            </div>

            <!-- Error -->
            <p v-if="error" class="text-white/25 text-sm">Could not load image</p>
          </div>

          <!-- Info panel -->
          <div v-if="currentItem" class="w-full lg:w-auto lg:max-w-xs xl:max-w-sm shrink-0 lg:self-center">
            <ItemInfoPanel :item="currentItem" :collection="collection" />
          </div>
        </div>

      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import ItemInfoPanel from './ItemSheet.vue';
import type { CollectionItem, CollectionConfig } from '../../types/';
import { useLightbox } from '../../composables/index';

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