<!-- The newest pages, across every collection, each a way into the viewer. -->
<template>
  <section
    v-if="recent.length"
    class="border-t border-slate-200 py-12 dark:border-slate-800"
    aria-labelledby="about-recent"
  >
    <h2 id="about-recent" class="caps-label text-muted">Recently drawn</h2>
    <p class="mt-3 text-xl font-semibold text-strong">The newest pages, newest first.</p>
    <ul class="mt-6 grid gap-4 grid-cols-2 sm:grid-cols-[repeat(auto-fill,minmax(9rem,1fr))]">
      <li v-for="d in recent" :key="`${d.collection}/${d.id}`">
        <a :href="drawingHref(d)" class="focus-ring block rounded-card">
          <span :class="PAPER" class="block">
            <img :src="drawingImage(d, collections)" :alt="d.name" loading="lazy" class="aspect-square w-full object-contain" />
          </span>
          <!-- The Dhivehi line keeps its height without a name, so the English names line up. -->
          <span
            class="mt-2 block truncate font-dhivehi text-sm text-slate-900 dark:text-slate-100"
            dir="rtl"
            lang="dv"
            :aria-hidden="!d.dhivehi"
          >{{ d.dhivehi ? firstScript(d.dhivehi) : NBSP }}</span>
          <span class="block text-sm font-medium text-slate-900 dark:text-slate-100">{{ d.name }}</span>
          <span class="block text-xs text-muted">{{ monthOf(d.drawn) }}</span>
        </a>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Collection } from '../domain/toCollectionItems.ts';
import type { NewestDrawing } from '../data/files.ts';
import { firstScript, monthOf } from './aboutSentences.ts';
import { drawingHref, drawingImage, PAPER } from './drawingLinks.ts';

/** How many of the newest drawings the page shows (stats.json lists more). */
const RECENT_COUNT = 5;
/** Holds an empty line's height. */
const NBSP = String.fromCharCode(160); // a no-break space

const props = defineProps<{ collections: Collection[]; newest: NewestDrawing[] }>();

const recent = computed(() => props.newest.slice(0, RECENT_COUNT));
</script>
