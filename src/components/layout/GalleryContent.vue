<!-- components/gallery/GalleryContent.vue -->
<template>
  <div class="space-y-12">
    <!-- Loading State -->
    <div v-if="data.loading" class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
      <div v-for="n in 10" :key="n"
           class="aspect-square rounded-2xl animate-pulse bg-slate-200 dark:bg-slate-800" />
    </div>

    <!-- Error State -->
    <div v-else-if="data.error"
         class="mx-auto mt-10 max-w-lg rounded-xl border p-6 text-center
                bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800">
      <h2 class="mb-2 text-lg font-bold text-red-700 dark:text-red-400">Error Loading Data</h2>
      <p class="text-red-600 dark:text-red-300">{{ data.error }}</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="isEmpty" class="mt-20 text-center text-slate-500">
      <h2 class="text-xl font-semibold">No drawings found</h2>
      <p class="mt-2">{{ search.query ? 'Try a different search term.' : 'Check back later for new illustrations.' }}</p>
    </div>

    <!-- Main Content -->
    <template v-else>
      <!-- Search Summary -->
      <div v-if="search.query" class="mb-6 text-xs text-slate-400 dark:text-slate-500">
        {{ filteredCount }} result{{ filteredCount !== 1 ? 's' : '' }} for
        <span class="font-medium text-slate-600 dark:text-slate-300">"{{ search.query }}"</span>
        <button @click="$emit('updateSearch', '')"
                class="ml-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 underline underline-offset-2">
          Clear
        </button>
      </div>

      <!-- Grouped Sections -->
      <section
        v-for="(items, groupName) in activeData.grouped"
        :key="groupName"
        class="mb-12 scroll-mt-10"
      >
        <h2
          :ref="el => { if (el) headerRefs[String(groupName)] = el as HTMLElement }"
          class="mb-5 pb-2 text-base font-semibold flex items-center justify-between transition-colors border-b
                 text-slate-800 border-slate-200/70 dark:text-slate-100 dark:border-slate-800/70"
        >
          <span>{{ groupName }}</span>
          <span class="text-xs font-normal tabular-nums text-slate-400 dark:text-slate-500">
            {{ getDrawnCount(items) }} drawn
            <template v-if="ui.viewMode === 'group'"> / {{ items.length }}</template>
          </span>
        </h2>

        <div class="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-6 sm:grid-cols-[repeat(auto-fill,minmax(200px,1fr))]">
          <GridItemCard
            v-for="item in items"
            :key="item.id"
            :item="item"
            :placeholder-image="placeholderImage"
            @card-click="$emit('cardClick', $event)"
          />
        </div>
      </section>

      <!-- Footer (override via slot if needed) -->
      <slot name="footer">
        <footer class="mt-16 pt-6 pb-8 border-t text-center text-xs transition-colors
                       border-slate-100 text-slate-300 dark:border-slate-800/50 dark:text-slate-600">
          <p>Wildlife Illustrated &copy; {{ new Date().getFullYear() }} &middot; v{{ appVersion }}</p>
        </footer>
      </slot>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const getBase = () => ((import.meta as Record<string, unknown>).env as { BASE_URL?: string })?.BASE_URL ?? '/';
import GridItemCard from '../gallery/ItemTile.vue'
import type {
  ActiveData,
  CollectionConfig,
  CollectionItem,
  DataState,
  SearchState,
  UIState
} from '../../types'

// ---------------------------------------------------------------------------
// PROPS
// ---------------------------------------------------------------------------
const props = defineProps<{
  data: DataState
  activeData: ActiveData<CollectionItem>
  search: SearchState
  activeCollection?: CollectionConfig
  ui: Pick<UIState, 'viewMode'>
  appVersion: string
}>()

// ---------------------------------------------------------------------------
// EMITS
// ---------------------------------------------------------------------------
const emit = defineEmits<{
  updateSearch: [query: string]
  cardClick: [item: CollectionItem]
}>()

// ---------------------------------------------------------------------------
// COMPUTED
// ---------------------------------------------------------------------------
const placeholderImage = computed(() =>
  props.activeCollection ? `${getBase()}placeholders/${props.activeCollection.id}.webp` : ''
)

const isEmpty = computed(() =>
  Object.keys(props.activeData.grouped).length === 0
)

const filteredCount = computed(() =>
  props.activeData.stats?.filtered ?? 0
)

// ---------------------------------------------------------------------------
// METHODS
// ---------------------------------------------------------------------------
/** Count items that have been drawn (imageUrl !== placeholder) */
const getDrawnCount = (items: CollectionItem[]): number =>
  items.filter(item => item.imageUrl !== placeholderImage.value).length

// ---------------------------------------------------------------------------
// REFS (exposed for parent scroll-spy)
// ---------------------------------------------------------------------------
const headerRefs = ref<Record<string, HTMLElement>>({})
defineExpose({ headerRefs })
</script>