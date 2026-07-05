<template>
  <div v-once class="px-4 py-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
    <template v-for="hint in hints" :key="hint.keys">
      <kbd class="kbd-hint">{{ hint.keys }}</kbd>
      <span class="text-[10px] text-slate-500 dark:text-slate-400 mr-1">{{ hint.label }}</span>
    </template>
  </div>
</template>

<script setup lang="ts">
const hints = [
  { keys: '↑↓', label: 'navigate' },
  { keys: '↵',  label: 'select'   },
  { keys: 'esc', label: 'close'   },
];
</script>
