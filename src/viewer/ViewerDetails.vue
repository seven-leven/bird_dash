<template>
  <div class="bg-white/95 border-slate-200 dark:bg-slate-900/95 dark:border-slate-800
              backdrop-blur-xl rounded-card p-6 w-full max-w-sm border shadow-float flex flex-col gap-5">

    <!-- Where it sits: its id, its group (a link back to it in the grid), and when it
         was drawn, in the month view's words; a series piece, what in. -->
    <div class="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
      <IdBadge :id="item.itemId" />
      <button
        class="focus-ring rounded-control link"
        :title="`Show ${item.group} in the grid`"
        @click="emit('go-to-group', item.group)"
      >
        {{ item.group }}
      </button>
      <template v-if="drawnMonth">
        <span aria-hidden="true">·</span>
        <span>Drawn {{ drawnMonth }}<template v-if="collection.medium">, in {{ collection.medium }}</template></span>
      </template>
    </div>

    <!-- The names, as one block in the tile's order: Dhivehi first and largest, then
         English, then scientific (docs/DESIGN.md §02). One language per line: how to say
         the Dhivehi sits on its own line, after the Thaana, so it can neither read as part
         of the English title below nor share a line with the Latin. A bird with more than
         one Dhivehi name gets a line per name: the first as the title, each other smaller,
         "also …", every Thaana name with its own romanisation. A gloss that does not fit
         beside its name wraps under it instead of splitting it. Each name's role
         (src/domain/itemNames.ts) picks its line; the block reads no field by name. -->
    <div>
      <template v-for="(name, n) in item.names" :key="n">
        <div
          v-if="name.lang === 'dv'"
          class="flex flex-wrap items-baseline gap-x-3 gap-y-1"
        >
          <component
            :is="name.role === 'title' ? 'h2' : 'p'"
            class="font-dhivehi font-bold text-strong text-left"
            :class="name.role === 'title' ? 'text-3xl' : 'text-xl'"
            dir="rtl"
          >
            {{ name.text }}
          </component>
          <span v-if="name.roman" class="text-sm text-muted">
            <template v-if="name.role === 'also'">also </template><span lang="dv-Latn">{{ name.roman }}</span>
          </span>
        </div>
        <h2 v-else-if="name.role === 'title'" class="text-xl font-semibold text-strong leading-tight tracking-tight">
          {{ name.text }}
        </h2>
        <p v-else-if="name.role === 'common'" class="text-base font-semibold text-strong leading-tight mt-1">
          {{ name.text }}
        </p>
        <p v-else class="text-muted italic text-sm mt-0.5">
          {{ name.text }}
        </p>
      </template>
    </div>

    <!-- Any other facts the list carries -->
    <div v-if="Object.keys(otherMeta).length" class="space-y-4">
      <div v-for="(value, key) in otherMeta" :key="key">
        <p class="caps-label text-muted mb-1">
          {{ formatMetaKey(key) }}
        </p>
        <p class="text-sm text-body">{{ value }}</p>
      </div>
    </div>

    <!-- Illustrator note: the illustrator's own words, marked by the rule beside them. A
         long one opens folded to its first lines; the panel itself scrolls. -->
    <div v-if="paragraphs.length">
      <p class="caps-label text-muted mb-2">
        From the illustrator
      </p>
      <blockquote class="pl-3 border-l border-slate-200 dark:border-slate-700">
        <div
          id="illustrator-note"
          class="space-y-2"
          :class="folded && 'max-h-36 overflow-hidden [mask-image:linear-gradient(to_bottom,black_60%,transparent)]'"
        >
          <p v-for="(parts, n) in paragraphs" :key="n" class="text-body text-sm leading-relaxed">
            <template v-for="(part, i) in parts" :key="i">
              <a
                v-if="part.href"
                :href="part.href"
                class="focus-ring rounded-control link underline hover:opacity-80"
              >{{ part.text }}</a>
              <template v-else>{{ part.text }}</template>
            </template>
          </p>
        </div>
        <button
          v-if="isLong"
          class="focus-ring rounded-control mt-2 text-xs link"
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
    <div v-if="links.length || item.isDrawn">
      <p v-if="links.length" class="caps-label text-muted mb-2">
        Learn more
      </p>
      <div class="flex flex-wrap items-center gap-x-4 gap-y-1">
        <ExternalLink
          v-for="link in links"
          :key="link.label"
          :href="link.url(item)"
          class="text-sm font-medium text-body
                 hover:underline underline-offset-2 transition-colors duration-fast"
        >
          {{ link.label }}
        </ExternalLink>
        <!-- At the row's far end. -->
        <ViewerShare
          v-if="item.isDrawn"
          :key="item.id"
          :collection-id="collection.id"
          :item-id="item.itemId"
          :title="item.commonName"
        />
      </div>
    </div>

  </div>
</template>
<script setup lang="ts">
import ExternalLink from '../ui/ExternalLink.vue';
import { computed, ref, watch } from 'vue';
import IdBadge from '../ui/IdBadge.vue';
import { noteSegments } from '../domain/noteSegments.ts';
import ViewerShare from './ViewerShare.vue';
import { monthName } from '../domain/dates.ts';
import type { Collection, Item } from '../domain/toCollectionItems.ts';

const props = defineProps<{
  item:       Item;
  collection: Collection;
}>();

const emit = defineEmits<{
  /** Show this group in the grid (the viewer closes to do it). */
  'go-to-group': [group: string];
}>();

// "October 2024", as the month view heads it; nothing for an undated drawing.
const drawnMonth = computed(() =>
  props.item.drawnTime ? monthName(new Date(props.item.drawnTime)) : ''
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

// Every other fact the list carries (the names are not among them: they are `names`)
const otherMeta = computed(() => props.item.meta ?? {});

// Convert snake_case / camelCase keys to readable labels
function formatMetaKey(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, c => c.toUpperCase());
}
</script>
