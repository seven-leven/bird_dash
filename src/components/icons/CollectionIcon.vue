<!-- A collection's glyph: the line icon named by `icon` in collections.json, so
     it matches the rest of the icon set. A collection without one (or naming an
     icon that does not exist) falls back to its emoji. -->
<template>
  <Icon v-if="name" :name="name" aria-hidden="true" />
  <span v-else class="leading-none" aria-hidden="true">{{ collection.emoji }}</span>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import Icon from './Icon.vue';
import { isIconName } from './icons.ts';

const props = defineProps<{ collection: { icon?: string; emoji: string } }>();
const name = computed(() => (isIconName(props.collection.icon) ? props.collection.icon : null));
</script>
