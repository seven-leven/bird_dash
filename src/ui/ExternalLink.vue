<!-- A link that leaves the site: it opens in a new tab and says so to screen readers
     (docs/DESIGN.md §01). Its look is the caller's, through `class`; `icon` leads the text
     (the footer's GitHub mark), otherwise the "leaves the site" arrow trails it. -->
<template>
  <a
    :href="href"
    target="_blank"
    rel="noopener noreferrer"
    class="focus-ring rounded-control inline-flex items-center gap-1"
  >
    <Icon v-if="icon" :name="icon" class="size-3" aria-hidden="true" />
    <slot />
    <Icon v-if="!icon" name="externalLink" class="size-3 opacity-60" aria-hidden="true" />
    <span class="sr-only"> (opens in a new tab)</span>
  </a>
</template>

<script setup lang="ts">
import Icon from './Icon.vue';
import type { IconName } from './icons.ts';

defineProps<{ href: string; icon?: IconName }>();
</script>
