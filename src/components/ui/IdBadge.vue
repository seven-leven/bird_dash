<template>
  <span
    class="inline-flex items-center rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold tabular-nums"
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
     * overlay — on top of imagery (dark scrim, white text)
     * surface — on light/dark app surfaces
     * panel   — inside the dark info panel
     */
    variant?: 'overlay' | 'surface' | 'panel';
  }>(),
  { variant: 'surface' },
);

const variantClass = computed(() => {
  switch (props.variant) {
    case 'overlay':
      return 'bg-black/50 text-white/90 backdrop-blur-sm';
    case 'panel':
      return 'bg-white/10 text-white/70';
    default:
      return 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400';
  }
});
</script>
