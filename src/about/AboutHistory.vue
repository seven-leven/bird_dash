<!-- History: what happened when. Dated events, not counts, so written here. -->
<template>
  <section class="border-t border-stone-200 py-12 dark:border-stone-800" :aria-labelledby="headingId">
    <h2 :id="headingId" class="caps-label text-muted">So far</h2>
    <p class="mt-3 text-xl font-semibold text-strong">One page at a time.</p>
    <ol class="mt-6 space-y-6 border-l border-stone-200 pl-6 dark:border-stone-800">
      <li v-for="event in HISTORY" :key="event.when">
        <p class="text-xs font-semibold tabular-nums text-muted">{{ event.when }}</p>
        <p class="mt-1 max-w-prose text-sm text-body">{{ event.what }}</p>
      </li>
    </ol>
    <p class="mt-6 text-sm">
      <ExternalLink :href="WRITE_UP_URL" class="link-out">
        How the site was built, in the write-up
      </ExternalLink>
    </p>
  </section>
</template>

<script setup lang="ts">
import { useId } from 'vue';
import ExternalLink from '../ui/ExternalLink.vue';
import { WRITE_UP_URL } from '../domain/links.ts';

/** Names the section for a screen reader: its heading, by an id unique on the page. */
const headingId = useId();

const HISTORY = [
  {
    when: 'October 2024',
    what: 'The first drawing, the Lesser Whistling-Duck, goes online. The Cotton Pygmy-Goose follows five days later.',
  },
  {
    when: 'October 2025',
    what: 'Six birds drawn in a rush for a book on N. Kendhikulhudhoo, and up on the site in one day.',
  },
  { when: 'February 2026', what: 'Every drawing gains its Dhivehi name, written in Thaana.' },
  { when: 'March 2026', what: 'Sharks and shells join the birds, on the same day.' },
];
</script>
