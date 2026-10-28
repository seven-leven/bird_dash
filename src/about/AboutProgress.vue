<!-- Progress: the totals, then one card per collection; the cards fold after CARDS_FIT. -->
<template>
  <section class="border-t border-stone-200 py-12 dark:border-stone-800" :aria-labelledby="headingId">
    <h2 :id="headingId" class="caps-label text-muted">Progress</h2>
    <p class="mt-3 text-3xl font-semibold tabular-nums text-strong">
      {{ drawnOf(stats.drawn, stats.total) }}
    </p>
    <p class="mt-3 max-w-prose text-sm text-body">
      Counted honestly: a piece is drawn or it isn't. The rest are planned, and wait
      in the gallery as their collection's icon until their turn comes.
      <template v-if="latest">
        The latest drawing is the {{ latest.name }}, in {{ monthOf(latest.drawn) }}.
      </template>
    </p>

    <ul class="mt-6 grid gap-4 grid-cols-[repeat(auto-fill,minmax(15rem,1fr))]">
      <li v-for="card in shownCards" :key="card.id" :data-accent="card.accent">
        <a
          :href="`#${card.id}`"
          class="focus-ring flex h-full flex-col gap-3 rounded-card border p-4 transition-colors duration-fast
                 bg-white border-stone-200 hover:border-stone-300
                 dark:bg-stone-900 dark:border-stone-800 dark:hover:border-stone-700"
        >
          <span class="flex items-center gap-2 text-base font-semibold text-stone-900 dark:text-stone-100">
            <CollectionIcon :collection="card" class="size-5" />
            {{ card.label }}
          </span>
          <span class="text-sm tabular-nums text-body">{{ card.count }}</span>
          <span class="h-1 overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800" aria-hidden="true">
            <span class="block h-full rounded-full bg-accent-500" :style="{ width: `${card.percent}%` }" />
          </span>
          <span class="mt-auto text-xs text-muted">{{ card.meta }}</span>
        </a>
      </li>
    </ul>
    <button
      v-if="cards.length > CARDS_FIT"
      class="focus-ring mt-4 rounded-control text-sm link"
      :aria-expanded="allCards"
      @click="allCards = !allCards"
    >
      {{ allCards ? 'Show fewer' : `Show all ${cards.length} collections` }}
    </button>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, useId } from 'vue';
import CollectionIcon from '../ui/CollectionIcon.vue';
import { drawnOf } from '../domain/countWords.ts';
import type { Collection } from '../domain/toCollectionItems.ts';
import type { Stats } from '../data/files.ts';
import { cardsOf, monthOf } from './aboutSentences.ts';

/** Names the section for a screen reader: its heading, by an id unique on the page. */
const headingId = useId();

/** Collection cards shown before "Show all": two rows of three. */
const CARDS_FIT = 6;

const props = defineProps<{ collections: Collection[]; stats: Stats }>();

const latest = computed(() => props.stats.newest[0]);
const cards = computed(() => cardsOf(props.collections, props.stats.collections));
const allCards = ref(false);
const shownCards = computed(() => (allCards.value ? cards.value : cards.value.slice(0, CARDS_FIT)));
</script>
