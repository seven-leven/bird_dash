<!-- The manifesto's first line, and the way to the rest of it on the docs site. -->
<template>
  <section class="border-t border-rule py-12" aria-label="Design">
    <blockquote class="max-w-prose text-xl font-semibold text-strong">
      The drawings carry the colour. Everything around them makes room.
    </blockquote>
    <p class="mt-3 max-w-prose text-sm text-body">
      Five principles shape the site, from the grey that waits for a drawing to the way
      each count is worded.
    </p>
    <p class="mt-4 text-sm">
      <a :href="MANIFESTO_URL" class="link-out">
        Read the design manifesto
      </a>
    </p>
  </section>
</template>

<script setup lang="ts">
// On the docs site, served beside the gallery (docs/.vitepress), so the link is relative.
const MANIFESTO_URL = 'docs/DESIGN.html';
</script>
