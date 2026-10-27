<!-- components/about/AboutPage.vue — the About page (#about).
     Every number on it comes from public/stats.json, which the asset build works out
     from the lists (script/generate/stats.ts), or from collections.json, so
     nothing here is typed by hand and a new collection shows up on its own. However many
     there are, the page holds them: the cards are a grid that folds after CARDS_FIT, and
     past NAMES_FIT collections the prose counts them instead of naming each. Links that stay on the site are in
     the accent; links that leave it are neutral, marked as leaving (docs/DESIGN.md §01). -->
<template>
  <article class="mx-auto max-w-4xl pb-8" aria-labelledby="about-title">

    <!-- Opening: what the archive is, and its first drawing. -->
    <section class="grid items-center gap-8 pt-4 pb-12 sm:pt-8 md:grid-cols-[1fr_15rem]">
      <div>
        <p class="caps-label text-muted">About</p>
        <h1 id="about-title" class="mt-2 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
          An archive of drawings, in progress.
        </h1>
        <p class="mt-4 max-w-prose text-base text-slate-600 dark:text-slate-300">
          Wildlife Illustrated sets out to draw {{ subject }}, one species at a time. Each is
          shown with its English and scientific names, and its Dhivehi name where it has one.
          Every species has its place from the start, drawn or not, so the gaps
          are part of the record.
        </p>
        <div class="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
          <a :href="`#${browseId}`" class="btn-primary focus-ring">Browse the collections</a>
          <a :href="WRITE_UP_URL" target="_blank" rel="noopener noreferrer" :class="externalLink">
            How the site was built
            <Icon name="externalLink" class="size-3 opacity-60" />
            <span class="sr-only">(opens in a new tab)</span>
          </a>
        </div>
      </div>

      <figure v-if="stats?.first" class="w-full max-w-60">
        <a :href="itemHref(stats.first)" :class="paper" class="focus-ring block">
          <img :src="imageOf(stats.first)" :alt="stats.first.name" class="aspect-square w-full object-contain" />
        </a>
        <figcaption class="mt-3">
          <p v-if="firstName" class="flex flex-wrap items-baseline gap-x-2">
            <span class="font-dhivehi text-xl font-bold text-slate-900 dark:text-white" dir="rtl" lang="dv">
              {{ firstName.script }}
            </span>
            <span v-if="firstName.roman" class="text-sm text-muted" lang="dv-Latn">{{ firstName.roman }}</span>
          </p>
          <p class="text-sm font-medium text-slate-900 dark:text-slate-100">{{ stats.first.name }}</p>
          <p class="mt-1 text-xs text-muted">The first drawing · {{ dayOf(stats.first.drawn) }}</p>
        </figcaption>
      </figure>
    </section>

    <!-- Loading: the sections' shape in grey; nothing to read yet. -->
    <div v-if="!stats && !error" class="space-y-4" aria-busy="true">
      <div class="h-8 w-48 rounded-control animate-pulse bg-slate-200 dark:bg-slate-800" />
      <div class="grid gap-4 grid-cols-[repeat(auto-fill,minmax(15rem,1fr))]">
        <div v-for="n in 3" :key="n" class="h-32 rounded-card animate-pulse bg-slate-200 dark:bg-slate-800" />
      </div>
      <p class="sr-only" role="status">Loading the numbers</p>
    </div>

    <EmptyState v-else-if="error" title="Couldn't load the numbers" :hint="error" role="alert">
      <button class="btn-primary focus-ring mt-3" @click="load()">
        <Icon name="reset" class="size-4" aria-hidden="true" />
        Try again
      </button>
    </EmptyState>

    <template v-else-if="stats">
      <!-- Progress: the totals, then one card per collection. -->
      <section class="border-t border-slate-200 py-12 dark:border-slate-800" aria-labelledby="about-progress">
        <h2 id="about-progress" class="caps-label text-muted">Progress</h2>
        <p class="mt-3 text-3xl font-semibold tabular-nums text-slate-900 dark:text-white">
          {{ drawnOf(stats.drawn, stats.total) }}
        </p>
        <p class="mt-3 max-w-prose text-sm text-slate-600 dark:text-slate-300">
          Counted honestly: a species is drawn or it isn't. The rest are planned, and wait
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
                     bg-white border-slate-200 hover:border-slate-300
                     dark:bg-slate-900 dark:border-slate-800 dark:hover:border-slate-700"
            >
              <span class="flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-slate-100">
                <CollectionIcon :collection="card" class="size-5" />
                {{ card.label }}
              </span>
              <span class="text-sm tabular-nums text-slate-600 dark:text-slate-300">{{ card.count }}</span>
              <span class="h-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800" aria-hidden="true">
                <span class="block h-full rounded-full bg-accent-500" :style="{ width: `${card.percent}%` }" />
              </span>
              <span class="mt-auto text-xs text-muted">{{ card.meta }}</span>
            </a>
          </li>
        </ul>
        <button
          v-if="cards.length > CARDS_FIT"
          class="focus-ring mt-4 rounded-control text-sm font-medium text-accent-700 dark:text-accent-400 hover:underline underline-offset-2"
          :aria-expanded="allCards"
          @click="allCards = !allCards"
        >
          {{ allCards ? 'Show fewer' : `Show all ${cards.length} collections` }}
        </button>
      </section>

      <!-- The newest pages, across every collection. -->
      <section
        v-if="recent.length"
        class="border-t border-slate-200 py-12 dark:border-slate-800"
        aria-labelledby="about-recent"
      >
        <h2 id="about-recent" class="caps-label text-muted">Recently drawn</h2>
        <p class="mt-3 text-xl font-semibold text-slate-900 dark:text-white">The newest pages, newest first.</p>
        <ul class="mt-6 grid gap-4 grid-cols-2 sm:grid-cols-[repeat(auto-fill,minmax(9rem,1fr))]">
          <li v-for="d in recent" :key="`${d.collection}/${d.id}`">
            <a :href="itemHref(d)" class="focus-ring block rounded-card">
              <span :class="paper" class="block">
                <img :src="imageOf(d)" :alt="d.name" loading="lazy" class="aspect-square w-full object-contain" />
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

      <!-- How each page is made. -->
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
              <template v-if="namedLine">{{ namedLine }} carry their Dhivehi name in Thaana, set in
                Faruma, with how to say it.</template>
              <template v-else>Each species carries its Dhivehi name in Thaana where it has one.</template>
              Some have two, and both are kept.
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-slate-900 dark:text-slate-100">Checked against references</h3>
            <p class="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Every page links to where to learn more<template v-if="referencesLine">: {{ referencesLine }}</template>.
            </p>
          </div>
        </div>
      </section>
    </template>

    <!-- History: what happened when. Dated events, not counts, so written here. -->
    <section class="border-t border-slate-200 py-12 dark:border-slate-800" aria-labelledby="about-history">
      <h2 id="about-history" class="caps-label text-muted">So far</h2>
      <p class="mt-3 text-xl font-semibold text-slate-900 dark:text-white">One page at a time.</p>
      <ol class="mt-6 space-y-6 border-l border-slate-200 pl-6 dark:border-slate-800">
        <li v-for="event in HISTORY" :key="event.when">
          <p class="text-xs font-semibold tabular-nums text-muted">{{ event.when }}</p>
          <p class="mt-1 max-w-prose text-sm text-slate-600 dark:text-slate-300">{{ event.what }}</p>
        </li>
      </ol>
      <p class="mt-6 text-sm">
        <a :href="WRITE_UP_URL" target="_blank" rel="noopener noreferrer" :class="externalLink">
          How the site was built, in the write-up
            <Icon name="externalLink" class="size-3 opacity-60" />
          <span class="sr-only">(opens in a new tab)</span>
        </a>
      </p>
    </section>

    <!-- The manifesto's first line. -->
    <section class="border-t border-slate-200 py-12 dark:border-slate-800" aria-label="Design">
      <blockquote class="max-w-prose text-xl font-semibold text-slate-900 dark:text-white">
        The drawings carry the colour. Everything around them makes room.
      </blockquote>
      <p class="mt-3 max-w-prose text-sm text-slate-600 dark:text-slate-300">
        Five principles shape the site, from the grey that waits for a drawing to the way
        each count is worded.
      </p>
      <p class="mt-4 text-sm">
        <a :href="MANIFESTO_URL" :class="externalLink">
          Read the design manifesto
        </a>
      </p>
    </section>

    <AppFooter />
  </article>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import EmptyState from '../ui/EmptyState.vue';
import Icon from '../icons/Icon.vue';
import CollectionIcon from '../icons/CollectionIcon.vue';
import AppFooter from '../layout/AppFooter.vue';
import { useCollectionsStore } from '../../stores/collections.ts';
import { useStatsStore } from '../../stores/stats.ts';
import { drawnOf, plural } from '../../domain/countWords.ts';
import { viewName } from '../../domain/viewName.ts';
import { dhivehiNames } from '../../domain/dhivehiNames.ts';
import { dayName, monthName, parseDay } from '../../domain/dates.ts';
import { WRITE_UP_URL } from '../../domain/links.ts';
import type { NewestDrawing } from '../../types/index.ts';

// On the docs site, served beside the gallery (docs/.vitepress), so the link is relative.
const MANIFESTO_URL = 'docs/DESIGN.html';
/** How many of the newest drawings the page shows (stats.json lists more). */
const RECENT_COUNT = 5;
/** Collection cards shown before "Show all": two rows of three. */
const CARDS_FIT = 6;
/** Collections a sentence names one by one; past this it counts them. */
const NAMES_FIT = 3;
/** Holds an empty line's height. */
const NBSP = String.fromCharCode(160); // a no-break space

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

// A drawing sits on white paper in both themes (docs/DESIGN.md §01).
const paper = 'overflow-hidden rounded-card bg-white ring-1 ring-slate-200 dark:ring-slate-800';

// A link that leaves the site: neutral, never the accent.
const externalLink = 'focus-ring rounded-control inline-flex items-center gap-1 font-medium text-slate-600 underline underline-offset-2 ' +
  'hover:text-slate-900 dark:text-slate-300 dark:hover:text-white';

const { list, activeCollection } = useCollectionsStore();

// The numbers come from the stats store, loaded the first time the page opens.
const { stats, error, load } = useStatsStore();
onMounted(load);

const byId = computed(() => new Map(list.value.map((c) => [c.id, c])));
const browseId = computed(() => activeCollection.value?.id ?? list.value[0]?.id ?? '');

/** "birds, sharks and shells". */
const joinAnd = (words: string[]): string =>
  words.length < 2 ? words.join('') : `${words.slice(0, -1).join(', ')} and ${words.at(-1)}`;
/** "the birds, sharks and shells in its lists", or with many, "the wildlife in its 7 collections".
 * Where a collection's species come from is its own business (not every list is Maldivian). */
const subject = computed(() =>
  list.value.length > NAMES_FIT
    ? `the wildlife in its ${list.value.length} collections`
    : `the ${joinAnd(list.value.map((c) => c.label.toLowerCase()))} in its lists`
);

// Dates in the lists are `YYYY-MM-DD`, read as UTC like the month view's (domain/dates.ts).
const monthOf = (iso: string) => monthName(parseDay(iso));
const dayOf = (iso: string) => dayName(parseDay(iso));

const itemHref = (d: NewestDrawing) => `#${d.collection}/${d.id}`;
const imageOf = (d: NewestDrawing) => `${byId.value.get(d.collection)?.imageBase ?? ''}${d.id}.webp`;
/** A species with two Dhivehi names ("a / b") is captioned by the first. */
const firstScript = (script: string) => script.split('/')[0].trim();
const firstName = computed(() => {
  const first = stats.value?.first;
  return first?.dhivehi ? dhivehiNames(first.dhivehi, first.roman)[0] : undefined;
});

// Read only once the numbers have loaded (the template's `v-else-if="stats"`), so these
// take them as there.
const loaded = () => stats.value!;

const latest = computed(() => loaded().newest[0]);
const recent = computed(() => loaded().newest.slice(0, RECENT_COUNT));

// One card per collection in collections.json, numbered from stats.json.
const cards = computed(() =>
  list.value.flatMap((col) => {
    const s = loaded().collections.find((c) => c.id === col.id);
    if (!s) return [];
    const groupWord = s.groups === 1 ? col.groupLabel : viewName('group', col.groupLabel);
    const groups = `${s.groups} ${groupWord.toLowerCase()}`;
    return [{
      id: col.id,
      label: col.label,
      icon: col.icon,
      emoji: col.emoji,
      accent: col.accent,
      count: s.drawn ? drawnOf(s.drawn, s.total) : 'Nothing drawn yet',
      percent: s.total ? Math.round((s.drawn / s.total) * 100) : 0,
      meta: s.firstDrawn ? `${groups} · since ${monthOf(s.firstDrawn)}` : `${groups} · ${plural(s.total, col.itemLabel)} planned`,
    }];
  })
);
const allCards = ref(false);
const shownCards = computed(() => (allCards.value ? cards.value : cards.value.slice(0, CARDS_FIT)));

// "191 of the 204 birds and 19 of the 42 sharks"; collections with no names are left out.
// With more than NAMES_FIT of them, one sum: "210 of the 246 species in 4 collections".
const namedLine = computed(() => {
  const named = loaded().collections.filter((s) => s.named && byId.value.has(s.id));
  if (named.length > NAMES_FIT) {
    const sum = (key: 'named' | 'total') => named.reduce((n, s) => n + s[key], 0);
    return `${sum('named')} of the ${sum('total')} species in ${named.length} collections`;
  }
  return joinAnd(named.map((s) => `${s.named} of the ${plural(s.total, byId.value.get(s.id)!.itemLabel)}`));
});

// "eBird, BirdLife and Wiki for birds; iNaturalist and Wiki for sharks", from collections.json.
// With more than NAMES_FIT collections, just the sites, each once.
const referencesLine = computed(() => {
  const linked = list.value.filter((c) => c.links.length);
  if (linked.length > NAMES_FIT) {
    return joinAnd([...new Set(linked.flatMap((c) => c.links.map((l) => l.label)))]);
  }
  return linked
    .map((c) => `${joinAnd(c.links.map((l) => l.label))} for ${c.label.toLowerCase()}`)
    .join('; ');
});
</script>
