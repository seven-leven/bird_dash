<!-- components/layout/TopBar.vue -->
<template>
  <!-- Below md the search drops to its own full-width row; the rest stays on row one. -->
  <header class="flex flex-wrap items-center gap-2 min-h-12 px-4 py-2 shrink-0 z-50 transition-colors duration-slow
                 md:flex-nowrap md:py-0
                 bg-white border-b border-slate-200
                 dark:bg-slate-950 dark:border-slate-800">

    <!-- Mobile sidebar toggle -->
    <button
      v-if="isMobile"
      @click="toggleSidebar()"
      class="btn-ghost focus-ring lg:hidden p-2.5 rounded-control shrink-0"
      aria-label="Toggle sidebar"
      aria-controls="appSidebar"
      :aria-expanded="sidebarOpen"
    >
      <Icon name="menu" class="w-4.5 h-4.5" />
    </button>

    <!-- Wordmark -->
    <a
      v-once
      href="#"
      class="hidden md:flex items-center gap-2 shrink-0 pr-1 select-none focus-ring rounded-control"
      aria-label="Wildlife Illustrated"
    >
      <LogoMark class="w-6 h-6 text-slate-900 dark:text-white" />
      <span class="flex items-baseline gap-1" aria-hidden="true">
        <span class="text-sm font-semibold tracking-tight text-slate-800 dark:text-slate-100">Wildlife</span>
        <span class="text-sm font-light tracking-tight text-muted">Illustrated</span>
      </span>
    </a>

    <div class="divider-v hidden md:block" />

    <!-- Collection tabs -->
    <nav class="flex items-center gap-0.5 shrink-0" aria-label="Collections">
      <button
        v-for="col in collections"
        :key="col.id"
        @click="switchCollection(col.id)"
        class="nav-item marker-b focus-ring flex items-center gap-1.5 px-3 py-1.5 max-md:min-h-9"
        :aria-current="col.id === activeCollection?.id ? 'page' : undefined"
        :aria-label="col.label"
      >
        <CollectionIcon :collection="col" class="w-4.5 h-4.5" />
        <span class="hidden sm:inline">{{ col.label }}</span>
      </button>
    </nav>

    <GlobalSearch
      class="order-last basis-full md:order-0 md:basis-auto md:flex-1 md:ml-auto"
      :class="dropdownOpen ? 'md:max-w-96' : 'md:max-w-72'"
    />

    <!-- View switch: both views are always shown; the current one is marked. -->
    <div class="flex items-center gap-0.5 shrink-0 max-md:ml-auto" role="group" aria-label="View">
      <button
        v-for="view in views"
        :key="view.mode"
        @click="setViewMode(view.mode)"
        class="nav-item marker-b focus-ring flex items-center gap-1.5 px-2.5 py-1.5 max-md:min-h-9"
        :aria-pressed="viewMode === view.mode"
        :aria-label="`${view.label} view`"
        :title="`${view.label} view`"
      >
        <Icon :name="view.icon" class="w-4 h-4" />
        <span class="hidden lg:inline">{{ view.label }}</span>
      </button>
    </div>

    <div class="divider-v" />

    <!-- Theme toggle -->
    <button
      @click="toggleTheme()"
      class="btn-ghost focus-ring flex items-center justify-center w-9 h-9 md:w-8 md:h-8 shrink-0"
      :aria-label="theme.isDark ? 'Switch to light mode' : 'Switch to dark mode'"
    >
      <Icon v-if="theme.isDark" name="sun" class="w-4 h-4" />
      <Icon v-else name="moon" class="w-4 h-4" />
    </button>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import GlobalSearch from '../search/GlobalSearch.vue';
import Icon from '../icons/Icon.vue';
import CollectionIcon from '../icons/CollectionIcon.vue';
import LogoMark from '../icons/LogoMark.vue';
import { useCollectionsStore } from '../../stores/collections.ts';
import { useUi } from '../../stores/ui.ts';
import { useActions } from '../../stores/actions.ts';
import { useSearch } from '../../stores/search.ts';

const { list: collections, activeCollection } = useCollectionsStore();
const { isMobile, sidebarOpen, viewMode, theme, toggleSidebar, setViewMode, toggleTheme } = useUi();
const { switchCollection } = useActions();
const { dropdownOpen } = useSearch();

const views = computed(() => [
  { mode: 'group' as const, icon: 'taxonomy' as const, label: activeCollection.value?.groupLabel ?? 'Group' },
  { mode: 'date' as const, icon: 'calendar' as const, label: 'Date' },
]);
</script>
