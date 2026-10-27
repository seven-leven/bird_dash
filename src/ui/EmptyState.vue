<template>
  <div class="flex flex-col items-center justify-center gap-1.5 py-12 px-4 text-center">
    <div v-if="$slots.icon" class="mb-1 text-muted">
      <slot name="icon" />
    </div>
    <h2 class="text-sm font-semibold text-slate-600 dark:text-slate-300">{{ title }}</h2>
    <p v-if="hint" class="max-w-sm text-xs text-muted">{{ hint }}</p>
    <slot />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  hint?: string;
}>();
</script>
