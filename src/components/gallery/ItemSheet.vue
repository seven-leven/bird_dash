<template>
  <div class="bg-white/95 border-slate-200 dark:bg-slate-900/95 dark:border-slate-800
              backdrop-blur-xl rounded-card p-6 w-full max-w-sm border shadow-float flex flex-col gap-5">

    <!-- Where it sits: its id, its group (a link back to it in the grid), and when it
         was drawn, in the month view's words. -->
    <div class="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs viewer-label">
      <IdBadge :id="item.itemId" />
      <button
        class="focus-ring rounded-control font-medium text-accent-700 dark:text-accent-400 hover:underline underline-offset-2"
        :title="`Show ${item.group} in the grid`"
        @click="emit('go-to-group', item.group)"
      >
        {{ item.group }}
      </button>
      <template v-if="drawnMonth">
        <span aria-hidden="true">·</span>
        <span>Drawn {{ drawnMonth }}</span>
      </template>
    </div>

    <!-- The names, as one block in the tile's order: Dhivehi first and largest (with how
         to say it), then English, then scientific (docs/DESIGN.md §02). -->
    <div>
      <template v-if="item.meta?.dhiv_script">
        <h2 class="font-dhivehi text-3xl font-bold viewer-title text-left" dir="rtl">
          {{ item.meta.dhiv_script }}
        </h2>
        <p v-if="item.meta.dhiv" class="text-xs viewer-label -mt-1 mb-2">{{ item.meta.dhiv }}</p>
        <p class="text-base font-semibold viewer-title leading-tight">
          {{ item.commonName }}
        </p>
      </template>
      <h2 v-else class="text-xl font-semibold viewer-title leading-tight tracking-tight">
        {{ item.commonName }}
      </h2>
      <p class="viewer-label italic text-sm mt-0.5">
        {{ item.scientificName }}
      </p>
    </div>

    <!-- Any other facts the list carries -->
    <div v-if="Object.keys(otherMeta).length" class="space-y-4">
      <div v-for="(value, key) in otherMeta" :key="key">
        <p class="caps-label viewer-label mb-1">
          {{ formatMetaKey(key) }}
        </p>
        <p class="text-sm viewer-body">{{ value }}</p>
      </div>
    </div>

    <!-- Illustrator note: the illustrator's own words, marked by the rule beside them. A
         long one opens folded to its first lines; the panel itself scrolls. -->
    <div v-if="paragraphs.length">
      <p class="caps-label with-icon viewer-label mb-2">
        <Icon name="pencil" aria-hidden="true" />From the illustrator
      </p>
      <blockquote class="pl-3 border-l border-slate-200 dark:border-slate-700">
        <div
          id="illustrator-note"
          class="space-y-2"
          :class="folded && 'max-h-36 overflow-hidden [mask-image:linear-gradient(to_bottom,black_60%,transparent)]'"
        >
          <p v-for="(parts, n) in paragraphs" :key="n" class="viewer-body text-sm leading-relaxed">
            <template v-for="(part, i) in parts" :key="i">
              <a
                v-if="part.href"
                :href="part.href"
                class="focus-ring rounded-control font-medium text-accent-700 dark:text-accent-400 underline underline-offset-2 hover:opacity-80"
              >{{ part.text }}</a>
              <template v-else>{{ part.text }}</template>
            </template>
          </p>
        </div>
        <button
          v-if="isLong"
          class="focus-ring rounded-control mt-2 text-xs font-medium text-accent-700 dark:text-accent-400 hover:underline underline-offset-2"
          aria-controls="illustrator-note"
          :aria-expanded="!folded"
          @click="expanded = !expanded"
        >
          {{ folded ? 'Read more' : 'Show less' }}
        </button>
      </blockquote>
    </div>

    <!-- External links: plain links in a row, the least important thing in the panel. They
         leave the site, so they stay neutral; links within it (the group, "#11", Read more)
         are in the accent (docs/DESIGN.md §01). -->
    <div v-if="links.length">
      <p class="caps-label with-icon viewer-label mb-2">
        <Icon name="book" aria-hidden="true" />Learn more
      </p>
      <div class="flex flex-wrap gap-x-4 gap-y-1">
        <a
          v-for="link in links"
          :key="link.label"
          :href="link.url(item)"
          target="_blank"
          rel="noopener noreferrer"
          class="focus-ring rounded-control inline-flex items-center gap-1 text-sm font-medium viewer-body
                 hover:underline underline-offset-2 transition-colors duration-fast"
        >
          {{ link.label }}
          <Icon name="externalLink" class="size-3 opacity-60" />
          <span class="sr-only">(opens in a new tab)</span>
        </a>
      </div>
    </div>

  </div>
</template>
<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import IdBadge from '../ui/IdBadge.vue';
import Icon from '../icons/Icon.vue';
import { noteSegments } from '../../lib/noteLinks.ts';
import { monthKey } from '../../composables/collection/useCollectionData.ts';
import type { CollectionItem, CollectionConfig } from '../../types/index.ts';

const props = defineProps<{
  item:       CollectionItem;
  collection: CollectionConfig;
}>();

const emit = defineEmits<{
  /** Show this group in the grid (the viewer closes to do it). */
  'go-to-group': [group: string];
}>();

// "October 2024", as the month view heads it; nothing for an undated drawing.
const drawnMonth = computed(() =>
  props.item.drawnTime ? monthKey(new Date(props.item.drawnTime)) : ''
);

const note = computed(() => props.item.illustratorNote ?? '');

// The note in paragraphs (split at blank lines); "#11" in it links to that drawing
// (docs/DESIGN.md §03).
const paragraphs = computed(() =>
  note.value
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => noteSegments(p, props.collection.id, props.item.itemId.length))
);

// A note longer than this (or of more than two paragraphs) opens folded to its first
// lines, with "Read more"; a short one is shown whole.
const LONG_NOTE = 320;
const isLong = computed(() =>
  note.value.length > LONG_NOTE || paragraphs.value.length > 2
);
const expanded = ref(false);
const folded = computed(() => isLong.value && !expanded.value);
// Each drawing's note starts folded.
watch(() => props.item.id, () => (expanded.value = false));

// Links come straight from the collection config
const links = computed(() => props.collection.links);

// All meta keys except the names, which the name block shows
const SPECIAL_META_KEYS = new Set(['dhiv', 'dhiv_script']);

const otherMeta = computed(() => {
  if (!props.item.meta) return {};
  return Object.fromEntries(
    Object.entries(props.item.meta).filter(([k]) => !SPECIAL_META_KEYS.has(k))
  );
});

// Convert snake_case / camelCase keys to readable labels
function formatMetaKey(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, c => c.toUpperCase());
}
</script>
