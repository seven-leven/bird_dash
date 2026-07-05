<!-- components/layout/TopBar.vue -->
<template>
  <header class="flex items-center gap-2 h-12 px-4 shrink-0 z-50 transition-colors duration-300
                 bg-white border-b border-slate-200
                 dark:bg-slate-950 dark:border-slate-800">

    <!-- Mobile sidebar toggle -->
    <button
      v-if="ui.mobile"
      @click="toggleSidebar()"
      class="btn-ghost focus-ring lg:hidden p-2 rounded-lg shrink-0"
      aria-label="Toggle Sidebar"
    >
      <IconMenu class="w-4.5 h-4.5" />
    </button>

    <!-- Wordmark -->
    <a v-once href="#" class="hidden md:flex items-baseline gap-1 shrink-0 pr-1 select-none focus-ring rounded-md">
      <span class="text-sm font-semibold tracking-tight text-slate-800 dark:text-slate-100">Wildlife</span>
      <span class="text-sm font-light tracking-tight text-slate-500 dark:text-slate-400">Illustrated</span>
    </a>

    <div class="w-px h-6 shrink-0 hidden md:block bg-slate-200 dark:bg-slate-700" />

    <!-- Collection tabs -->
    <nav class="flex items-center gap-0.5 shrink-0" aria-label="Collections">
      <button
        v-for="col in collections"
        :key="col.id"
        @click="switchCollection(col.id)"
        class="focus-ring flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-150"
        :class="col.id === activeCollection?.id
          ? 'bg-accent-700 text-white'
          : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800'"
        :aria-current="col.id === activeCollection?.id ? 'page' : undefined"
      >
        <span class="text-base leading-none">{{ col.emoji }}</span>
        <span class="hidden sm:inline">{{ col.label }}</span>
      </button>
    </nav>

    <div class="flex-1" />

    <GlobalSearch />

    <!-- View mode toggle  -->
    <button
      @click="toggleViewMode()"
      class="focus-ring flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors duration-150 shrink-0"
      :class="ui.viewMode === 'date'
        ? 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800'"
      :aria-label="`Switch to ${ui.viewMode === 'group' ? 'date' : 'group'} view`"
    >
      <IconCalendar v-if="ui.viewMode === 'group'" class="w-4 h-4" />
      <IconBox v-else class="w-4 h-4" />
      <span class="hidden lg:inline">
        {{ ui.viewMode === 'group' ? `By ${activeCollection?.groupLabel ?? ''}` : 'By Date' }}
      </span>
    </button>

    <div class="w-px h-6 shrink-0 bg-slate-200 dark:bg-slate-700" />

    <!-- Theme toggle -->
    <button
      @click="toggleTheme()"
      class="btn-ghost focus-ring flex items-center justify-center w-8 h-8 shrink-0"
      :aria-label="theme.isDark ? 'Switch to light mode' : 'Switch to dark mode'"
    >
      <IconSun v-if="theme.isDark" class="w-4 h-4" />
      <IconMoon v-else class="w-4 h-4" />
    </button>
  </header>
</template>

<script setup lang="ts">
import GlobalSearch from '../search/GlobalSearch.vue';
import IconMenu from '../icons/IconMenu.vue';
import IconCalendar from '../icons/IconCalendar.vue';
import IconBox from '../icons/IconBox.vue';
import IconSun from '../icons/IconSun.vue';
import IconMoon from '../icons/IconMoon.vue';
import { useAppContext } from '../../composables';

const {
  collections,
  activeCollection,
  ui,
  theme,
  toggleSidebar,
  switchCollection,
  toggleViewMode,
  toggleTheme,
} = useAppContext();
</script>
