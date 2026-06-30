<template>
  <div class="flex items-center justify-between px-4 py-2 border-b border-slate-100 dark:border-slate-800">
    <span class="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">Results</span>
    <span
      class="text-[10px] font-semibold tabular-nums px-2 py-0.5 rounded-full"
      :class="count > 0 ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'"
    >
      {{ count }}
    </span>
  </div>
</template>

<script setup lang="ts">
defineProps<{ count: number }>();
</script>
