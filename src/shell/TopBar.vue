<!-- shell/TopBar.vue: the one row along the top. -->
<template>
  <!-- One row at every width (docs/DESIGN.md §10). What gives way as it narrows: the
       collection tabs become one menu button below md (or whenever there are more than
       TABS_FIT collections), and below 420px the search becomes a button that opens it
       across the row. -->
  <header class="flex items-center gap-1 sm:gap-2 h-12 px-3 sm:px-4 shrink-0 z-50 transition-colors duration-fast
                 bg-white border-b border-slate-200
                 dark:bg-slate-950 dark:border-slate-800">

    <!-- Mobile sidebar toggle -->
    <button
      v-if="isNarrow && page === 'gallery'"
      :class="searchOpen && 'max-[419px]:hidden'"
      @click="toggleSidebar()"
      class="btn-ghost focus-ring lg:hidden p-2.5 rounded-control shrink-0"
      :aria-label="sidebarOpen ? 'Hide sections' : 'Show sections'"
      aria-controls="appSidebar"
      :aria-expanded="sidebarOpen"
    >
      <Icon name="menu" class="size-4" />
    </button>

    <!-- Logo: the mark from sm up, the wordmark from md up. On a phone the row has
         room for one more thing, and the current collection's name (below) is what
         says where you are (docs/DESIGN.md §10). It leads back to the gallery. -->
    <a
      :href="`#${active?.id ?? ''}`"
      class="hidden sm:flex items-center justify-center gap-2 shrink-0 md:pr-1 select-none focus-ring rounded-control max-md:min-w-9 max-md:min-h-9"
      aria-label="Wildlife Illustrated"
    >
      <LogoMark class="size-6 text-strong" />
      <span class="hidden md:flex items-baseline gap-1" aria-hidden="true">
        <span class="text-sm font-semibold tracking-tight text-slate-800 dark:text-slate-100">Wildlife</span>
        <span class="text-sm font-light tracking-tight text-muted">Illustrated</span>
      </span>
    </a>

    <div class="divider-v hidden md:block" />

    <!-- Collections: tabs while they fit, otherwise one button naming the current
         collection that opens the list. Either way the current one is named. -->
    <nav :class="searchOpen && 'max-[419px]:hidden'" class="flex items-center gap-0.5 shrink-0" aria-label="Collections">
      <div v-if="tabsFit" class="hidden md:flex items-center gap-0.5">
        <button
          v-for="col in collections"
          :key="col.id"
          @click="emit('select', col.id)"
          class="nav-item marker-b focus-ring flex items-center justify-center gap-1.5 px-3 py-1.5"
          :aria-current="page === 'gallery' && col.id === active?.id ? 'page' : undefined"
        >
          <CollectionIcon :collection="col" class="size-4" />
          {{ col.label }}
        </button>
        <!-- The pages sit after the collections; where they are a menu, they are in the menu. -->
        <a
          v-for="p in pages"
          :key="p.id"
          :href="`#${p.id}`"
          class="nav-item marker-b focus-ring flex items-center justify-center px-3 py-1.5"
          :aria-current="page === p.id ? 'page' : undefined"
        >
          {{ p.label }}
        </a>
      </div>
      <CollectionMenu
        :class="tabsFit && 'md:hidden'"
        :collections="collections"
        :active="active"
        @select="emit('select', $event)"
      />
    </nav>

    <!-- Below 420px the search is a button; opened, it takes the row until closed. -->
    <button
      v-if="!searchOpen"
      class="btn-ghost focus-ring min-[420px]:hidden ml-auto flex items-center justify-center size-9 shrink-0"
      aria-label="Search all collections"
      @click="openSearch()"
    >
      <Icon name="search" class="size-4" />
    </button>

    <!-- The search box, placed here by the app (app/AppShell.vue); it sets its own width. -->
    <div
      ref="searchEl"
      class="flex-1 min-w-0 flex justify-end"
      :class="searchOpen ? '' : 'max-[419px]:hidden'"
      @focusout="onSearchFocusOut"
    >
      <slot name="search" />
    </div>
    <button
      v-if="searchOpen"
      class="btn-ghost focus-ring min-[420px]:hidden flex items-center justify-center size-9 shrink-0"
      aria-label="Close search"
      @click="searchOpen = false"
    >
      <Icon name="close" class="size-4" />
    </button>

    <!-- The gallery's view switch, placed here by the app; only the gallery has views. -->
    <div v-if="page === 'gallery'" :class="searchOpen && 'max-[419px]:hidden'" class="shrink-0">
      <slot name="view" />
    </div>

    <div :class="searchOpen && 'max-[419px]:hidden'" class="divider-v hidden sm:block" />

    <!-- Theme toggle -->
    <button
      :class="searchOpen && 'max-[419px]:hidden'"
      @click="toggleTheme()"
      class="btn-ghost focus-ring flex items-center justify-center w-9 h-9 md:w-8 md:h-8 shrink-0"
      :aria-label="theme.isDark ? 'Switch to light mode' : 'Switch to dark mode'"
    >
      <Icon v-if="theme.isDark" name="sun" class="size-4" />
      <Icon v-else name="moon" class="size-4" />
    </button>
  </header>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from 'vue';
import CollectionMenu from './CollectionMenu.vue';
import Icon from '../ui/Icon.vue';
import CollectionIcon from '../ui/CollectionIcon.vue';
import LogoMark from '../ui/LogoMark.vue';
import { useLayoutStore } from './layoutStore.ts';
import { useThemeStore } from './themeStore.ts';
import type { Collection } from '../domain/toCollectionItems.ts';

const props = defineProps<{
  collections: Collection[];
  /** The collection on screen, once one is. */
  active?: Collection;
}>();
const emit = defineEmits<{ select: [collectionId: string] }>();

const { pages, isNarrow, sidebarOpen, page, toggleSidebar } = useLayoutStore();
const { theme, toggleTheme } = useThemeStore();

// Tabs from md up while there are this many collections or fewer; beyond that, or on
// a narrower screen, the collections are one menu (docs/DESIGN.md §10).
const TABS_FIT = 4;
const tabsFit = computed(() => props.collections.length <= TABS_FIT);

// Below 420px: is the search open across the row?
const searchOpen = ref(false);
const searchEl = ref<HTMLElement | null>(null);
async function openSearch(): Promise<void> {
  searchOpen.value = true;
  await nextTick();
  searchEl.value?.querySelector('input')?.focus();
}
// Leaving an empty search closes it again; one with a query stays, as the filter it is.
function onSearchFocusOut(e: FocusEvent): void {
  if (searchEl.value?.contains(e.relatedTarget as Node)) return;
  if (!searchEl.value?.querySelector('input')?.value) searchOpen.value = false;
}
</script>
