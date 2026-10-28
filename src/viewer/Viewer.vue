<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-fast ease-out"
      leave-active-class="transition-opacity duration-fast ease-in"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isOpen"
        :ref="setDialogRef"
        role="dialog"
        aria-modal="true"
        :aria-label="currentItem ? `${currentItem.commonName}, #${currentItem.itemId}` : 'Image viewer'"
        tabindex="-1"
        class="fixed inset-0 z-50 flex items-center justify-center bg-slate-50/95 dark:bg-black/95 outline-none"
        @click="handleBackdropClick"
      >

        <!-- Top bar: zoom controls left, zoom % inline, close right -->
        <div class="absolute top-0 inset-x-0 z-20 flex items-center justify-between px-4 py-3 pointer-events-none">

          <!-- Zoom controls -->
          <div class="flex items-center gap-1 pointer-events-auto">
            <button @click="zoomIn"    class="icon-btn-overlay" aria-label="Zoom in">
              <Icon name="zoomIn" class="size-4" />
            </button>
            <button @click="zoomOut"   class="icon-btn-overlay" aria-label="Zoom out">
              <Icon name="zoomOut" class="size-4" />
            </button>
            <button @click="resetZoom" class="icon-btn-overlay" aria-label="Reset zoom">
              <Icon name="reset" class="size-4" />
            </button>
            <span class="ml-2 text-micro font-mono text-muted tabular-nums">{{ Math.round(scale * 100) }}%</span>
          </div>

          <!-- Position in the timeline -->
          <span
            v-if="position"
            class="absolute left-1/2 -translate-x-1/2 text-xs tabular-nums text-body"
            aria-live="polite"
          >{{ position }}<template v-if="props.query"> · matching '{{ props.query }}'</template></span>

          <!-- Close -->
          <button @click="close" class="icon-btn-overlay pointer-events-auto" aria-label="Close">
            <Icon name="close" class="size-5" />
          </button>
        </div>

        <!-- Main layout: image left, info panel right -->
        <div
          class="relative w-full h-full flex flex-col lg:flex-row items-center justify-center
                 gap-4 pt-14 pb-4 px-4
                 lg:gap-6 lg:pt-14 lg:pb-8 lg:px-6"
          @click="handleBackdropClick"
        >

          <!-- Image column: the gesture area plus prev/next, which sit beside the
               image at every size (in its gutters from lg up). They are siblings of the gesture area, so
               pointer capture there cannot swallow their clicks. -->
          <div class="relative flex-1 w-full h-full min-w-0 min-h-0 lg:px-12">
            <button
              v-if="hasPrevious"
              @click.stop="goToPrevious"
              class="nav-btn-overlay left-1"
              aria-label="Previous"
            >
              <Icon name="chevronLeft" class="size-5" />
            </button>
            <button
              v-if="hasNext"
              @click.stop="goToNext"
              class="nav-btn-overlay right-1"
              aria-label="Next"
            >
              <Icon name="chevronRight" class="size-5" />
            </button>

          <!-- Image area -->
          <div
            class="w-full h-full flex items-center justify-center overflow-hidden touch-none"
            @click="handleBackdropClick"
            @wheel.prevent="handleWheel"
            @pointerdown="handlePointerDown"
            @pointermove="handlePointerMove"
            @pointerup="handlePointerUp"
            @pointercancel="handlePointerUp"
          >
            <Transition
              enter-active-class="transition-opacity duration-fast"
              enter-from-class="opacity-0"
              enter-to-class="opacity-100"
              mode="out-in"
            >
              <img
                v-if="imageUrl && !error"
                :key="currentItem?.itemId"
                :src="imageUrl"
                :alt="currentItem?.commonName"
                :style="{
                  transform: `scale(${scale}) translate(${translateX}px, ${translateY}px)`,
                  cursor: isDragging ? 'grabbing' : (scale > 1 ? 'grab' : 'default'),
                  transition: isDragging ? 'none' : 'transform 0.15s ease-out',
                }"
                class="max-w-full max-h-full object-contain select-none ring-1 ring-slate-200 dark:ring-0"
                @load="handleImageLoad"
                @error="handleImageError"
                draggable="false"
              />
            </Transition>

            <!-- Loading spinner -->
            <div v-if="loading" class="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div class="w-8 h-8 border-2 border-slate-300 border-t-slate-500 dark:border-slate-700 dark:border-t-slate-400 rounded-full animate-spin" />
            </div>

            <!-- Error -->
            <p v-if="error" class="text-muted text-sm">Could not load image</p>
          </div>
          </div>

          <!-- Info panel -->
          <div
            v-if="currentItem"
            class="w-full max-h-[45%] overflow-y-auto rounded-card shrink-0
                   lg:w-auto lg:max-w-xs lg:max-h-full lg:self-center xl:max-w-sm"
          >
            <ViewerDetails :item="currentItem" :collection="collection" @go-to-group="emit('go-to-group', $event)" />
          </div>
        </div>

      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import ViewerDetails from './ViewerDetails.vue';
import Icon from '../ui/Icon.vue';
import type { Item } from '../domain/toCollectionItems.ts';
import { useViewer, type ViewerProps } from './useViewer.ts';
// When a search narrows what the viewer pages through, the counter says so (`query`).
const props = defineProps<ViewerProps & { query: string }>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'go-to-group', group: string): void;
  (e: 'update:item', item: Item): void;
}>();

const {
  dialogRef,
  currentItem,
  hasPrevious,
  hasNext,
  position,
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
  handlePointerDown,
  handlePointerMove,
  handlePointerUp,
  goToPrevious,
  goToNext,
  close,
  handleBackdropClick,
  handleImageLoad,
  handleImageError
} = useViewer({ props, emit });

/** Hands the dialog element to useViewer (its focus trap reads it). */
const setDialogRef = (el: unknown) => {
  dialogRef.value = el instanceof HTMLElement ? el : null;
};
</script>