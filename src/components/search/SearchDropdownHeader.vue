<template>
  <div class="flex items-center justify-between px-4 py-2 border-b border-slate-100 dark:border-slate-800">
    <span class="caps-label text-muted">Results</span>
    <span class="count-pill">{{ count }}</span>
  </div>
</template>

<script setup lang="ts">
defineProps<{ count: number }>();
</script>
