<!-- Hands out a drawing's link preview, which has its own title and image: a phone's share
     sheet, else the link copied. What happened shows on the button, in a word that keeps it on
     the links' line; a screen reader hears the whole sentence. In the accent, as the link stays
     within the site. Keyed by the drawing, so each one starts at "Share". -->
<template>
  <button
    class="ml-auto focus-ring rounded-control inline-flex items-center gap-1 text-sm link"
    @click="share"
  >
    <Icon name="share" class="size-3" />
    {{ OUTCOMES[outcome].label }}
  </button>
  <span role="status" class="sr-only">{{ OUTCOMES[outcome].note }}</span>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import Icon from '../ui/Icon.vue';
import { previewUrl, type ShareOutcome, shareLink } from './shareLink.ts';

const OUTCOMES: Record<ShareOutcome, { label: string; note: string }> = {
  sheet: { label: 'Share', note: '' },
  copied: { label: 'Copied', note: 'Link copied' },
  failed: { label: "Couldn't copy", note: "Couldn't copy the link" },
};

const props = defineProps<{ collectionId: string; itemId: string; title: string }>();

const outcome = ref<ShareOutcome>('sheet');
async function share() {
  outcome.value = await shareLink(previewUrl(location.href, props.collectionId, props.itemId), props.title);
}
</script>
