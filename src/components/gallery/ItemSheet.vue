<template>
  <div class="bg-slate-900/95 backdrop-blur-xl rounded-xl p-6 w-full max-w-sm
              border border-white/8 shadow-2xl flex flex-col gap-5">

    <!-- Header: ID badge + group + names -->
    <div>
      <div class="flex items-center gap-2 mb-3">
        <IdBadge :id="item.itemId" variant="panel" />
        <span class="text-white/40 text-xs">{{ item.group }}</span>
      </div>

      <h2 class="text-xl font-semibold text-white leading-tight tracking-tight">
        {{ item.commonName }}
      </h2>
      <p class="text-white/45 italic text-sm mt-0.5">
        {{ item.scientificName }}
      </p>
    </div>

    <!-- Meta fields -->
    <div v-if="item.meta && Object.keys(item.meta).length" class="space-y-4">

      <!-- Dhivehi block -->
      <div v-if="item.meta.dhiv_script || item.meta.dhiv">
        <p class="caps-label text-white/30 mb-1.5">Dhivehi Name</p>
        <p v-if="item.meta.dhiv_script" class="font-dhivehi text-xl text-white leading-tight" dir="rtl">
          {{ item.meta.dhiv_script }}
        </p>
        <p v-if="item.meta.dhiv" class="text-sm text-white/50 mt-0.5">
          {{ item.meta.dhiv }}
        </p>
      </div>

      <!-- Other meta -->
      <div v-for="(value, key) in otherMeta" :key="key">
        <p class="caps-label text-white/30 mb-1">
          {{ formatMetaKey(key) }}
        </p>
        <p class="text-sm text-white/70">{{ value }}</p>
      </div>
    </div>

    <!-- Illustrator note -->
    <div v-if="item.illustratorNote">
      <p class="caps-label text-white/30 mb-2">From the Illustrator</p>
      <blockquote class="pl-3 border-l border-white/20">
        <p class="text-white/60 text-sm leading-relaxed italic">{{ item.illustratorNote }}</p>
      </blockquote>
    </div>

    <!-- External links -->
    <div v-if="links.length">
      <p class="caps-label text-white/30 mb-2.5">Learn More</p>
      <div class="flex flex-wrap gap-2">
        <a
          v-for="link in links"
          :key="link.label"
          :href="resolveUrl(link, item)"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg
                 border border-white/15 text-white/70 text-xs font-medium
                 transition-colors duration-150
                 hover:text-white hover:border-white/30 hover:bg-white/5"
        >
          {{ link.label }}
          <IconExternalLink class="w-3 h-3 opacity-60" />
        </a>
      </div>
    </div>

  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue';
import IdBadge from '../ui/IdBadge.vue';
import IconExternalLink from '../icons/IconExternalLink.vue';
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
