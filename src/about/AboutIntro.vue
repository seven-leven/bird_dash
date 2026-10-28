<!-- The opening: what the archive is, the way into it, and its first drawing. -->
<template>
  <section class="grid items-center gap-8 pt-4 pb-12 sm:pt-8 md:grid-cols-[1fr_15rem]">
    <div>
      <p class="caps-label text-muted">About</p>
      <h1 :id="titleId" class="mt-2 text-3xl font-semibold tracking-tight text-strong">
        An archive of drawings, in progress.
      </h1>
      <p class="mt-4 max-w-prose text-base text-body">
        <template v-if="collections.length">
          Wildlife Illustrated sets out to draw {{ subjectOf(collections) }}, one at a time.
          Each is shown with its name, and its scientific and Dhivehi names where it has them.
        </template>
        Every piece has its place from the start, drawn or not, so the gaps
        are part of the record.
      </p>
      <div class="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
        <a :href="`#${browseId}`" class="btn-primary focus-ring">Browse the collections</a>
        <ExternalLink :href="WRITE_UP_URL" class="link-out">How the site was built</ExternalLink>
      </div>
    </div>

    <figure v-if="first" class="w-full max-w-60">
      <a :href="drawingHref(first)" :class="PAPER" class="focus-ring block">
        <img :src="drawingImage(first, collections)" :alt="first.name" class="aspect-square w-full object-contain" />
      </a>
      <figcaption class="mt-3">
        <p v-if="firstName" class="flex flex-wrap items-baseline gap-x-2">
          <span class="font-dhivehi text-xl font-bold text-strong" dir="rtl" lang="dv">
            {{ firstName.script }}
          </span>
          <span v-if="firstName.roman" class="text-sm text-muted" lang="dv-Latn">{{ firstName.roman }}</span>
        </p>
        <p class="text-sm font-medium text-ink">{{ first.name }}</p>
        <p class="mt-1 text-xs text-muted">The first drawing · {{ dayOf(first.drawn) }}</p>
      </figcaption>
    </figure>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import ExternalLink from '../ui/ExternalLink.vue';
import { dhivehiNames } from '../domain/dhivehiNames.ts';
import { WRITE_UP_URL } from '../domain/links.ts';
import type { Collection } from '../domain/toCollectionItems.ts';
import type { NewestDrawing } from '../data/files.ts';
import { dayOf, subjectOf } from './aboutSentences.ts';
import { drawingHref, drawingImage, PAPER } from './drawingLinks.ts';

const props = defineProps<{
  /** The heading's id, which names the page (AboutPage.vue). */
  titleId: string;
  collections: Collection[];
  /** The collection "Browse the collections" opens. */
  browseId: string;
  /** The archive's first drawing, once the numbers have loaded. */
  first: NewestDrawing | null;
}>();

const firstName = computed(() =>
  props.first?.dhivehi ? dhivehiNames(props.first.dhivehi, props.first.roman)[0] : undefined
);
</script>
