<!-- The whole screen, when nothing else can be shown: what failed, why, and "Try again"
     (docs/DESIGN.md §11). What trying again means is the caller's: it listens for `retry`. -->
<template>
  <div
    class="flex flex-col items-center justify-center min-h-screen bg-stone-50 dark:bg-stone-950"
    role="alert"
  >
    <EmptyState :title="title" :hint="hint">
      <template #icon>
        <Icon name="close" class="size-6" />
      </template>
      <RetryButton @retry="emit('retry')" />
    </EmptyState>
  </div>
</template>

<script setup lang="ts">
import EmptyState from './EmptyState.vue';
import Icon from './Icon.vue';
import RetryButton from './RetryButton.vue';

defineProps<{ title: string; hint: string }>();
const emit = defineEmits<{ retry: [] }>();
</script>
