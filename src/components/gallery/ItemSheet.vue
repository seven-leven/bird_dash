<template>
  <div class="bg-slate-800/90 backdrop-blur-md rounded-xl p-6 w-full max-w-md border border-slate-700 shadow-2xl">

    <!-- Header: ID badge + group -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-2">
        <span class="px-2 py-1 bg-blue-600 text-white text-xs font-bold rounded-md">
          #{{ item.itemId }}
        </span>
        <span class="text-slate-400 text-sm">{{ item.group }}</span>
      </div>

      <h2 class="text-2xl font-bold text-white mb-1 leading-tight">
        {{ item.commonName }}
      </h2>

      <p class="text-slate-400 italic text-sm">
        {{ item.scientificName }}
      </p>
    </div>

    <!-- Meta fields — rendered generically.
         Special case: dhiv_script rendered RTL with Dhivehi font.
         All other meta keys rendered as plain labelled rows. -->
    <div v-if="item.meta && Object.keys(item.meta).length" class="mb-6 space-y-3">

      <!-- Dhivehi block (birds-specific, but panel doesn't hardcode it — just checks meta) -->
      <div v-if="item.meta.dhiv_script || item.meta.dhiv">
        <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
          Dhivehi Name
        </h3>
        <p v-if="item.meta.dhiv_script" class="font-dhivehi text-xl text-white leading-tight" dir="rtl">
          {{ item.meta.dhiv_script }}
        </p>
        <p v-if="item.meta.dhiv" class="text-sm text-slate-400 mt-0.5">
          {{ item.meta.dhiv }}
        </p>
      </div>

      <!-- Any other meta fields rendered as generic key/value rows -->
      <div
        v-for="(value, key) in otherMeta"
        :key="key"
      >
        <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
          {{ formatMetaKey(key) }}
        </h3>
        <p class="text-sm text-slate-300">{{ value }}</p>
      </div>
    </div>

    <!-- Illustrator note -->
    <div v-if="item.illustratorNote" class="mb-6">
      <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
        From the Illustrator
      </h3>
      <blockquote class="relative pl-4 border-l-2 border-blue-500">
        <span class="absolute -left-1 -top-2 text-3xl text-blue-500/30 font-serif">"</span>
        <p class="text-slate-300 text-sm leading-relaxed italic">
          {{ item.illustratorNote }}
        </p>
      </blockquote>
    </div>

    <!-- External links — driven entirely by collection.links config -->
    <div v-if="links.length">
      <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
        Learn More
      </h3>
      <div class="flex flex-wrap gap-2">
        <a
          v-for="link in links"
          :key="link.label"
          :href="resolveUrl(link, item)"
          target="_blank"
          rel="noopener noreferrer"
          :class="`inline-flex items-center justify-center gap-1 px-3 py-2 ${link.color} text-white text-xs font-medium rounded-lg transition-colors`"
        >
          {{ link.label }}
        </a>
      </div>
    </div>

  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue';
import type { CollectionItem, CollectionConfig } from '../../types/';

const props = defineProps<{
  item:       CollectionItem;
  collection: CollectionConfig;
}>();

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

// Helper to resolve dynamic or static URLs
function resolveUrl(link: any, item: CollectionItem): string | undefined {
  if (typeof link.url === 'function') {
    return link.url(item);
  }
  return link.url;
}

// Convert snake_case / camelCase keys to readable labels
function formatMetaKey(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, c => c.toUpperCase());
}
</script>