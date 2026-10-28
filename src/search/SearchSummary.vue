<template>
  <div class="flex items-center justify-between px-4 py-2 border-b border-stone-100 dark:border-stone-800">
    <span class="caps-label text-muted">Results</span>
    <span class="text-xs tabular-nums text-muted">{{ matchesDrawn(count, drawn) }}</span>
  </div>
</template>

<script setup lang="ts">
import { matchesDrawn } from '../domain/countWords.ts';

defineProps<{ count: number; drawn: number }>();
</script>
