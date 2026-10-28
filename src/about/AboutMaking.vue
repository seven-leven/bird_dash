<!-- How each page is made: by hand, by name, by reference, with the numbers from stats.json and
     the reference sites from collections.json. Names and references are counted over the species
     collections alone. -->
<template>
  <section class="border-t border-stone-200 py-12 dark:border-stone-800" :aria-labelledby="headingId">
    <h2 :id="headingId" class="caps-label text-muted">How it is made</h2>
    <p class="mt-3 text-xl font-semibold text-strong">
      {{ species.length ? 'By hand, by name, by reference.' : 'By hand.' }}
    </p>
    <div class="mt-6 grid gap-8 md:grid-cols-3">
      <div>
        <h3 class="text-base font-semibold text-stone-900 dark:text-stone-100">Drawn by hand</h3>
        <p class="mt-2 text-sm text-body">
          Pen first, then markers, watercolour and now and then Photoshop. Each drawing
          comes with a short note on what worked and what did not.
        </p>
      </div>
      <!-- The names and the references are the species collections'; a series has neither. -->
      <div v-if="species.length">
        <h3 class="text-base font-semibold text-stone-900 dark:text-stone-100">Named in Dhivehi</h3>
        <p class="mt-2 text-sm text-body">
          <template v-if="named">{{ named }} carry their Dhivehi name in Thaana, set in
            Faruma, with how to say it.</template>
          <template v-else>Each species carries its Dhivehi name in Thaana where it has one.</template>
          Some have two, and both are kept.
        </p>
      </div>
      <div v-if="species.length">
        <h3 class="text-base font-semibold text-stone-900 dark:text-stone-100">Checked against references</h3>
        <p class="mt-2 text-sm text-body">
          Every page links to where to learn more<template v-if="references">: {{ references }}</template>.
        </p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, useId } from 'vue';
import type { Collection } from '../domain/toCollectionItems.ts';
import type { CollectionCounts } from '../data/files.ts';
import { namedLine, referencesLine, speciesOf } from './aboutSentences.ts';

/** Names the section for a screen reader: its heading, by an id unique on the page. */
const headingId = useId();

const props = defineProps<{ collections: Collection[]; counts: CollectionCounts[] }>();

const species = computed(() => speciesOf(props.collections));
const named = computed(() => namedLine(props.counts, species.value));
const references = computed(() => referencesLine(species.value));
</script>
