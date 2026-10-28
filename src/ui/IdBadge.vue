<template>
  <span
    class="inline-flex items-center rounded-control px-1.5 py-0.5 font-mono text-xs font-semibold tabular-nums"
    :class="variantClass"
  >
    <slot>#{{ id }}</slot>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    id?: string;
    /**
     * overlay — on top of a drawing (dark scrim, white text)
     * surface — on any interface surface, the viewer's panel included
     */
    variant?: 'overlay' | 'surface';
  }>(),
  { variant: 'surface' },
);

const variantClass = computed(() => {
  switch (props.variant) {
    case 'overlay':
      return 'bg-black/50 text-white/70 backdrop-blur-sm';
    default:
      return 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400';
  }
});
</script>
