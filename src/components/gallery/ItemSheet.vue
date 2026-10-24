<template>
  <div class="bg-white/95 border-slate-200 dark:bg-slate-900/95 dark:border-slate-800
              backdrop-blur-xl rounded-card p-6 w-full max-w-sm border shadow-float flex flex-col gap-5">

    <!-- Header: ID badge + group + names -->
    <div>
      <div class="flex items-center gap-2 mb-3">
        <IdBadge :id="item.itemId" />
        <span class="viewer-label text-xs">{{ item.group }}</span>
      </div>

      <!-- Same order as the tile: Dhivehi name first when there is one, then
           English, then scientific. -->
      <template v-if="item.meta?.dhiv_script">
        <h2 class="font-dhivehi text-2xl font-bold viewer-title leading-tight" dir="rtl">
          {{ item.meta.dhiv_script }}
        </h2>
        <p class="text-base font-semibold viewer-body leading-tight mt-1">
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

    <!-- Meta fields -->
    <div v-if="item.meta?.dhiv || Object.keys(otherMeta).length" class="space-y-4">
      <div v-if="item.meta?.dhiv">
        <p class="caps-label with-icon viewer-label mb-1">
          <Icon name="languages" aria-hidden="true" />Dhivehi name (romanised)
        </p>
        <p class="text-sm viewer-body">{{ item.meta.dhiv }}</p>
      </div>

      <!-- Other meta -->
      <div v-for="(value, key) in otherMeta" :key="key">
        <p class="caps-label viewer-label mb-1">
          {{ formatMetaKey(key) }}
        </p>
        <p class="text-sm viewer-body">{{ value }}</p>
      </div>
    </div>

    <!-- Illustrator note -->
    <div v-if="item.illustratorNote">
      <p class="caps-label with-icon viewer-label mb-2">
        <Icon name="pencil" aria-hidden="true" />From the illustrator
      </p>
      <blockquote class="pl-3 border-l border-slate-200 dark:border-slate-700">
        <p class="viewer-body text-sm leading-relaxed italic">
          <template v-for="(part, i) in noteParts" :key="i">
            <a
              v-if="part.href"
              :href="part.href"
              class="focus-ring rounded-control not-italic font-medium viewer-title underline underline-offset-2 hover:opacity-80"
            >{{ part.text }}</a>
            <template v-else>{{ part.text }}</template>
          </template>
        </p>
      </blockquote>
    </div>

    <!-- External links -->
    <div v-if="links.length">
      <p class="caps-label with-icon viewer-label mb-2.5">
        <Icon name="book" aria-hidden="true" />Learn more
      </p>
      <div class="flex flex-wrap gap-2">
        <a
          v-for="link in links"
          :key="link.label"
          :href="link.url(item)"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-control
                 border text-xs font-medium transition-colors duration-fast viewer-body
                 border-slate-200 hover:text-slate-900 hover:border-slate-300 hover:bg-slate-50
                 dark:border-slate-800 dark:hover:text-white dark:hover:border-slate-700 dark:hover:bg-slate-800"
        >
          {{ link.label }}
          <Icon name="externalLink" class="size-3 opacity-60" />
        </a>
      </div>
    </div>

  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue';
import IdBadge from '../ui/IdBadge.vue';
import Icon from '../icons/Icon.vue';
import { noteSegments } from '../../lib/noteLinks.ts';
import type { CollectionItem, CollectionConfig } from '../../types/index.ts';

const props = defineProps<{
  item:       CollectionItem;
  collection: CollectionConfig;
}>();

// "#11" in a note links to that drawing (docs/DESIGN.md §3).
const noteParts = computed(() =>
  noteSegments(props.item.illustratorNote ?? '', props.collection.id, props.item.itemId.length)
);

// Links come straight from the collection config
const links = computed(() => props.collection.links || []);

// All meta keys except the ones we render specially
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
