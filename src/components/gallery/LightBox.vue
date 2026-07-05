<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200 ease-out"
      leave-active-class="transition-opacity duration-150 ease-in"
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
            <button @click="zoomIn"    class="flex items-center justify-center w-8 h-8 rounded-lg text-white/40 hover:text-white/90 hover:bg-white/10 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40" aria-label="Zoom in">
              <IconZoomIn class="w-4 h-4" />
            </button>
            <button @click="zoomOut"   class="flex items-center justify-center w-8 h-8 rounded-lg text-white/40 hover:text-white/90 hover:bg-white/10 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40" aria-label="Zoom out">
              <IconZoomOut class="w-4 h-4" />
            </button>
            <button @click="resetZoom" class="flex items-center justify-center w-8 h-8 rounded-lg text-white/40 hover:text-white/90 hover:bg-white/10 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40" aria-label="Reset zoom">
              <IconReset class="w-4 h-4" />
            </button>
            <span class="ml-2 text-[11px] font-mono text-white/35 tabular-nums">{{ Math.round(scale * 100) }}%</span>
          </div>

          <!-- Close -->
          <button @click="close" class="flex items-center justify-center w-8 h-8 rounded-lg text-white/40 hover:text-white/90 hover:bg-white/10 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 pointer-events-auto" aria-label="Close">
            <IconClose class="w-4.5 h-4.5" />
          </button>
        </div>

        <!-- Prev / Next navigation -->
        <button
          v-if="hasPrevious"
          @click.stop="goToPrevious"
          class="absolute left-3 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-10 h-10 rounded-lg bg-white/6 hover:bg-white/12 text-white/50 hover:text-white transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
          aria-label="Previous"
        >
          <IconChevronLeft class="w-5 h-5" />
        </button>

        <button
          v-if="hasNext"
          @click.stop="goToNext"
          class="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-10 h-10 rounded-lg bg-white/6 hover:bg-white/12 text-white/50 hover:text-white transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
          aria-label="Next"
        >
          <IconChevronRight class="w-5 h-5" />
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
            <ItemSheet :item="currentItem" :collection="collection" />
          </div>
        </div>

      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import ItemSheet from './ItemSheet.vue';
import IconZoomIn from '../icons/IconZoomIn.vue';
import IconZoomOut from '../icons/IconZoomOut.vue';
import IconReset from '../icons/IconReset.vue';
import IconClose from '../icons/IconClose.vue';
import IconChevronLeft from '../icons/IconChevronLeft.vue';
import IconChevronRight from '../icons/IconChevronRight.vue';
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