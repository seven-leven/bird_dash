<!-- How each page is made: by hand, by name, by reference, with the numbers from stats.json and
     the reference sites from collections.json. -->
<template>
  <section class="border-t border-slate-200 py-12 dark:border-slate-800" aria-labelledby="about-made">
    <h2 id="about-made" class="caps-label text-muted">How it is made</h2>
    <p class="mt-3 text-xl font-semibold text-slate-900 dark:text-white">By hand, by name, by reference.</p>
    <div class="mt-6 grid gap-8 md:grid-cols-3">
      <div>
        <h3 class="text-base font-semibold text-slate-900 dark:text-slate-100">Drawn by hand</h3>
        <p class="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Pen first, then markers, watercolour and now and then Photoshop. Each drawing
          comes with a short note on what worked and what did not.
        </p>
      </div>
      <div>
        <h3 class="text-base font-semibold text-slate-900 dark:text-slate-100">Named in Dhivehi</h3>
        <p class="mt-2 text-sm text-slate-600 dark:text-slate-300">
          <template v-if="named">{{ named }} carry their Dhivehi name in Thaana, set in
            Faruma, with how to say it.</template>
          <template v-else>Each species carries its Dhivehi name in Thaana where it has one.</template>
          Some have two, and both are kept.
        </p>
      </div>
      <div>
        <h3 class="text-base font-semibold text-slate-900 dark:text-slate-100">Checked against references</h3>
        <p class="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Every page links to where to learn more<template v-if="references">: {{ references }}</template>.
        </p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Collection } from '../domain/toCollectionItems.ts';
import type { CollectionCounts } from '../data/files.ts';
import { namedLine, referencesLine } from './aboutSentences.ts';

const props = defineProps<{ collections: Collection[]; counts: CollectionCounts[] }>();

const named = computed(() => namedLine(props.counts, props.collections));
const references = computed(() => referencesLine(props.collections));
</script>
