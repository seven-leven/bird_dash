<!-- The grid while it loads: tiles shaped like the real ones (image and caption), so nothing
     jumps when they arrive. Its padding and what screen readers are told are the caller's. -->
<template>
  <div class="tile-grid">
    <div
      v-for="n in 10"
      :key="n"
      class="rounded-card overflow-hidden animate-pulse bg-slate-200 dark:bg-slate-800"
    >
      <div class="aspect-square" />
      <div class="h-14" />
    </div>
  </div>
</template>
