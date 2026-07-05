<template>
  <div class="flex items-center justify-between px-4 py-2 border-b border-slate-100 dark:border-slate-800">
    <span class="caps-label text-slate-500 dark:text-slate-400">Results</span>
    <span
      class="text-[10px] font-semibold tabular-nums px-2 py-0.5 rounded-full"
      :class="count > 0 ? 'bg-accent-700 text-white' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'"
    >
      {{ count }}
    </span>
  </div>
</template>

<script setup lang="ts">
defineProps<{ count: number }>();
</script>
