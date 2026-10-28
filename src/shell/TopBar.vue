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
      :href="`#${activeCollection?.id ?? ''}`"
      class="hidden sm:flex items-center justify-center gap-2 shrink-0 md:pr-1 select-none focus-ring rounded-control max-md:min-w-9 max-md:min-h-9"
      aria-label="Wildlife Illustrated"
    >
      <LogoMark class="size-6 text-slate-900 dark:text-white" />
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
          @click="selectCollection(col.id)"
          class="nav-item marker-b focus-ring flex items-center justify-center gap-1.5 px-3 py-1.5"
          :aria-current="page === 'gallery' && col.id === activeCollection?.id ? 'page' : undefined"
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
      <CollectionMenu :class="tabsFit && 'md:hidden'" />
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

    <!-- The search box, placed here by the app (app/AppShell.vue). -->
    <div
      ref="searchEl"
      class="flex-1 min-w-0 md:ml-auto transition-[max-width] duration-fast"
      :class="[
        dropdownOpen ? 'md:max-w-96' : 'md:max-w-72',
        searchOpen ? '' : 'max-[419px]:hidden',
      ]"
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

    <!-- View switch: both views are always shown; the current one is marked. -->
    <div
      v-if="page === 'gallery'"
      :class="searchOpen && 'max-[419px]:hidden'"
      class="flex items-center gap-0.5 shrink-0"
      role="group"
      aria-label="View"
    >
      <button
        v-for="view in views"
        :key="view.mode"
        @click="setViewMode(view.mode)"
        class="nav-item marker-b focus-ring flex items-center justify-center gap-1.5 px-2 sm:px-2.5 py-1.5 max-md:min-h-9 max-md:min-w-9"
        :aria-pressed="viewMode === view.mode"
        :aria-label="`${view.label} view`"
        :title="`${view.label} view`"
      >
        <Icon :name="view.icon" class="size-4" />
        <span class="hidden lg:inline">{{ view.label }}</span>
      </button>
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
import { useCollectionsStore } from '../gallery/collectionsStore.ts';
import { useLayoutStore } from './layoutStore.ts';
import { useThemeStore } from './themeStore.ts';
import { useViewStore } from '../gallery/viewStore.ts';
import { useActions } from '../app/actions.ts';
import { useSearchStore } from '../search/searchStore.ts';
import { viewName } from '../domain/viewName.ts';

const { collections, activeCollection } = useCollectionsStore();
const { pages, isNarrow, sidebarOpen, page, toggleSidebar } = useLayoutStore();
const { viewMode, setViewMode } = useViewStore();
const { theme, toggleTheme } = useThemeStore();
const { selectCollection } = useActions();
const { dropdownOpen, query } = useSearchStore();

// Tabs from md up while there are this many collections or fewer; beyond that, or on
// a narrower screen, the collections are one menu (docs/DESIGN.md §10).
const TABS_FIT = 4;
const tabsFit = computed(() => collections.value.length <= TABS_FIT);

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
  if (!query.value && !searchEl.value?.contains(e.relatedTarget as Node)) searchOpen.value = false;
}

const views = computed(() => [
  {
    mode: 'group' as const,
    icon: 'taxonomy' as const,
    label: viewName('group', activeCollection.value?.groupLabel ?? 'Group'),
  },
  { mode: 'month' as const, icon: 'calendar' as const, label: viewName('month', '') },
]);
</script>
