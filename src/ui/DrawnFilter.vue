<!-- ui/DrawnFilter.vue
     A collection's count and its filter in one: "All 204 · Drawn 15", two tabs drawn
     like the header's view switch (.nav-item, the accent marker under the current
     one), so it reads as a choice and says how far along the collection is at once
     (docs/DESIGN.md §03, §05). -->
<template>
  <div class="flex items-center gap-0.5" role="group" aria-label="Show">
    <button
      v-for="option in options"
      :key="option.label"
      class="nav-item marker-b focus-ring flex items-baseline gap-1.5 px-2.5 py-1 text-xs max-md:min-h-9"
      :aria-pressed="option.drawnOnly === drawnOnly"
      @click="drawnOnly = option.drawnOnly"
    >
      {{ option.label }}
      <span class="tabular-nums font-normal opacity-70">{{ option.count }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{ drawn: number; total: number }>();
/** Whether only the drawings show: `v-model:drawn-only`. */
const drawnOnly = defineModel<boolean>('drawnOnly', { required: true });

const options = computed(() => [
  { label: 'All', count: props.total, drawnOnly: false },
  { label: 'Drawn', count: props.drawn, drawnOnly: true },
]);
</script>
