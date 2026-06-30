<template>
  <div class="px-4 py-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
    <template v-for="hint in hints" :key="hint.keys">
      <kbd class="text-[10px] px-1.5 py-0.5 rounded border font-mono
                  bg-slate-50 border-slate-200 text-slate-400
                  dark:bg-slate-800 dark:border-slate-700 dark:text-slate-500">{{ hint.keys }}</kbd>
      <span class="text-[10px] text-slate-300 dark:text-slate-600 mr-1">{{ hint.label }}</span>
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
