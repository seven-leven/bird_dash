<!-- Single icon component. Renders one entry from the icons registry inside a
     shared 24×24 wrapper: a 2px round stroke for our own line icons, a solid fill
     for third-party brand marks. Consumers size/colour it via class, e.g.
     <Icon name="search" class="w-4 h-4 text-muted" />. -->
<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    :fill="def.filled ? 'currentColor' : 'none'"
    :stroke="def.filled ? 'none' : 'currentColor'"
    :stroke-width="def.strokeWidth ?? 2"
    stroke-linecap="round"
    stroke-linejoin="round"
    v-html="def.body"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { type IconDef, ICONS, type IconName } from './icons.ts';

const props = defineProps<{ name: IconName }>();
const def = computed<IconDef>(() => ICONS[props.name]);
</script>
