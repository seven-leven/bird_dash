<!-- Key hints under the search results. The arrow and return keys are drawn with
     icons from the registry: Unicode arrows (↑↓ ↵) render at a different size
     and weight in every font. -->
<template>
  <div v-once class="px-4 py-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
    <template v-for="hint in hints" :key="hint.label">
      <kbd class="kbd-hint inline-flex items-center justify-center min-w-6 h-5" :aria-label="hint.name">
        <Icon v-if="hint.icon" :name="hint.icon" class="w-3 h-3" aria-hidden="true" />
        <template v-else>{{ hint.text }}</template>
      </kbd>
      <span class="text-micro text-muted mr-1">{{ hint.label }}</span>
    </template>
  </div>
</template>

<script setup lang="ts">
import Icon from '../icons/Icon.vue';
import type { IconName } from '../icons/icons.ts';

const hints: { icon?: IconName; text?: string; name: string; label: string }[] = [
  { icon: 'arrowsUpDown', name: 'Up and down arrow keys', label: 'navigate' },
  { icon: 'enter', name: 'Enter', label: 'select' },
  { text: 'esc', name: 'Escape', label: 'close' },
];
</script>
