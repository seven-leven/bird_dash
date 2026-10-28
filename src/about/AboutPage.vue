<!-- about/AboutPage.vue — the About page (#about), in sections. Every number on it comes from
     public/stats.json, which the asset build works out from the lists
     (script/generate/stats.ts), or from collections.json, so nothing here is typed by hand
     and a new collection shows up on its own. Links that stay on the site are in the accent;
     links that leave it are neutral, marked as leaving (docs/DESIGN.md §01). -->
<template>
  <article class="mx-auto max-w-4xl pb-8" :aria-labelledby="titleId">
    <AboutIntro :title-id="titleId" :collections="collections" :browse-id="browseId" :first="stats?.first ?? null" />

    <!-- Loading: the sections' shape in grey; nothing to read yet. -->
    <div v-if="!stats && !error" class="space-y-4" aria-busy="true">
      <div class="h-8 w-48 rounded-control skeleton" />
      <div class="grid gap-4 grid-cols-[repeat(auto-fill,minmax(15rem,1fr))]">
        <div v-for="n in 3" :key="n" class="h-32 rounded-card skeleton" />
      </div>
      <p class="sr-only" role="status">Loading the numbers</p>
    </div>

    <EmptyState v-else-if="error" title="Couldn't load the numbers" :hint="error" role="alert">
      <RetryButton @retry="load()" />
    </EmptyState>

    <template v-else-if="stats">
      <AboutProgress :collections="collections" :stats="stats" />
      <AboutNewest :collections="collections" :newest="stats.newest" />
      <AboutMaking :collections="collections" :counts="stats.collections" />
    </template>

    <AboutHistory />
    <AboutDesign />
    <!-- What the app places after a page: the footer. -->
    <slot />
  </article>
</template>

<script setup lang="ts">
import { computed, onMounted, useId } from 'vue';
import EmptyState from '../ui/EmptyState.vue';
import RetryButton from '../ui/RetryButton.vue';
import AboutIntro from './AboutIntro.vue';
import AboutProgress from './AboutProgress.vue';
import AboutNewest from './AboutNewest.vue';
import AboutMaking from './AboutMaking.vue';
import AboutHistory from './AboutHistory.vue';
import AboutDesign from './AboutDesign.vue';
import { useCollectionsStore } from '../gallery/collectionsStore.ts';
import { useStatsStore } from './statsStore.ts';

const { collections, activeCollection } = useCollectionsStore();

// The numbers come from the stats store, loaded the first time the page opens.
const { stats, error, load } = useStatsStore();
onMounted(load);

/** The intro's heading names the page. */
const titleId = useId();

const browseId = computed(() => activeCollection.value?.id ?? collections.value[0]?.id ?? '');
</script>
