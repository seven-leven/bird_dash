<!-- components/layout/Chrome.vue — top-level layout shell.
     All state comes from the injected app context; the only wiring left here
     is the LightBox overlay (props-based so it stays reusable). -->
<template>
  <div class="flex flex-col h-screen w-full overflow-hidden bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">

    <TopBar />

    <!-- Body -->
    <div class="flex flex-1 overflow-hidden">

      <!-- Mobile overlay -->
      <div
        v-if="app.ui.mobile"
        class="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity"
        :class="app.ui.sidebarOpen ? 'opacity-100 visible' : 'opacity-0 invisible'"
        @click="app.closeSidebar()"
        aria-hidden="true"
      />

      <SideNav />

      <!-- Main content -->
      <main class="relative flex flex-1 flex-col overflow-hidden">

        <!-- Active section label + active filter chip -->
        <div
          v-if="!app.data.loading && !app.data.error && (app.activeSection.value || app.search.query)"
          class="shrink-0 flex items-center gap-3 px-6 py-1.5 border-b text-xs font-medium tracking-wide transition-colors
                 bg-white/95 border-slate-100 text-slate-500
                 dark:bg-slate-950/95 dark:border-slate-800/60 dark:text-slate-400"
        >
          <span class="truncate">{{ app.activeSection.value }}</span>
          <button
            v-if="app.search.query"
            @click="app.updateSearch('')"
            class="focus-ring ml-auto flex items-center gap-1.5 rounded-full py-0.5 pl-2.5 pr-1.5 text-[11px] font-medium
                   bg-accent-50 text-accent-700 hover:bg-accent-100
                   dark:bg-accent-950/60 dark:text-accent-300 dark:hover:bg-accent-900/60
                   transition-colors duration-150"
            :aria-label="`Clear filter ${app.search.query}`"
          >
            <span class="tabular-nums">{{ app.stats.value.filtered }}</span>
            <span class="max-w-40 truncate">result{{ app.stats.value.filtered !== 1 ? 's' : '' }} for &ldquo;{{ app.search.query }}&rdquo;</span>
            <IconClose class="w-3 h-3" />
          </button>
        </div>

        <!-- Scrollable grid (scroll-spy is driven by an IntersectionObserver) -->
        <div
          ref="scrollContainer"
          class="flex-1 overflow-y-auto p-6 scroll-smooth custom-scrollbar"
        >
          <GalleryContent />
        </div>

      </main>
    </div>

    <!-- Expanded image overlay -->
    <LightBox
      v-if="app.activeCollection.value"
      :is-open="app.expandedImage.isOpen"
      :item="app.expandedImage.item"
      :drawn-items="app.drawnItems.value"
      :full-image-base-url="app.activeCollection.value.fullImageBase"
      :collection="app.activeCollection.value"
      @close="app.closeOverlay()"
      @update:item="app.updateOverlayItem($event)"
    />

  </div>
</template>

<script setup lang="ts">
import { defineAsyncComponent } from 'vue';
import TopBar from './TopBar.vue';
import SideNav from './SideNav.vue';
import GalleryContent from '../gallery/GalleryContent.vue';
import IconClose from '../icons/IconClose.vue';
import { useAppContext } from '../../composables';

// Code-split the overlay: its zoom/pan/drag/keyboard machinery (and ItemSheet)
// are only needed after the first tile click, so keep them out of first paint.
const LightBox = defineAsyncComponent(() => import('../gallery/LightBox.vue'));

const app = useAppContext();

// Template ref target — the context ref App's scroll-spy reads.
const { scrollContainer } = app;
</script>
