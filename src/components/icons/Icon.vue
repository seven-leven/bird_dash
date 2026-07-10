<!-- Single line-icon component. Renders one entry from the icons registry inside
     a shared 24×24 stroke wrapper. Consumers size/colour it via class, e.g.
     <Icon name="search" class="w-4 h-4 text-muted" />. -->
<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    :stroke-width="def.strokeWidth ?? 2"
    stroke-linecap="round"
    stroke-linejoin="round"
    v-html="def.body"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { ICONS, type IconName } from './icons.ts';

const props = defineProps<{ name: IconName }>();
const def = computed(() => ICONS[props.name]);
</script>
