<!-- components/ui/DrawnOnlySwitch.vue
     "Drawn only", drawn as a switch so it reads as something to press: a small track
     and knob beside the words, the accent when on (docs/DESIGN.md §05). A toggle
     button underneath (aria-pressed), so it is announced as one. -->
<template>
  <button
    class="group focus-ring inline-flex items-center gap-2 shrink-0 rounded-control px-2 py-1 text-xs font-medium
           text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800
           transition-colors duration-fast max-md:min-h-9"
    :aria-pressed="on"
    @click="emit('toggle')"
  >
    <span
      class="relative inline-flex h-4 w-7 shrink-0 rounded-full transition-colors duration-fast"
      :class="on
        ? 'bg-accent-600'
        : 'bg-slate-300 group-hover:bg-slate-400 dark:bg-slate-600 dark:group-hover:bg-slate-500'"
      aria-hidden="true"
    >
      <span
        class="absolute top-0.5 left-0.5 size-3 rounded-full bg-white shadow-lift transition-transform duration-fast"
        :class="on && 'translate-x-3'"
      />
    </span>
    Drawn only
  </button>
</template>

<script setup lang="ts">
defineProps<{ on: boolean }>();
const emit = defineEmits<{ toggle: [] }>();
</script>
