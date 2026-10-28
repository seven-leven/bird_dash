<!-- How each page is made: by hand, by name, by reference, with the numbers from stats.json and
     the reference sites from collections.json. Each counts only the collections with names or
     links. -->
<template>
  <section class="border-t border-rule py-12" :aria-labelledby="headingId">
    <h2 :id="headingId" class="caps-label text-muted">How it is made</h2>
    <p class="mt-3 text-xl font-semibold text-strong">
      By hand, by name, by reference.
    </p>
    <div class="mt-6 grid gap-8 md:grid-cols-3">
      <div>
        <h3 class="text-base font-semibold text-ink">Drawn by hand</h3>
        <p class="mt-2 text-sm text-body">
          Pen first, then markers, watercolour and now and then Photoshop. Each drawing
          comes with a short note on what worked and what did not.
        </p>
      </div>
      <div>
        <h3 class="text-base font-semibold text-ink">Named in Dhivehi</h3>
        <p class="mt-2 text-sm text-body">
          <template v-if="named">{{ named }} carry their Dhivehi name in Thaana, set in
            Faruma, with how to say it.</template>
          <template v-else>Each carries its Dhivehi name in Thaana where it has one.</template>
          Some have two, and both are kept.
        </p>
      </div>
      <div>
        <h3 class="text-base font-semibold text-ink">Checked against references</h3>
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
import { namedLine, referencesLine } from './aboutSentences.ts';

/** Names the section for a screen reader: its heading, by an id unique on the page. */
const headingId = useId();

const props = defineProps<{ collections: Collection[]; counts: CollectionCounts[] }>();

const named = computed(() => namedLine(props.counts, props.collections));
const references = computed(() => referencesLine(props.collections));
</script>
