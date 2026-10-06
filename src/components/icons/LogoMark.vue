<!-- The logo mark (or, with `tile`, the solid version for small sizes). Size and
     colour come from the class, e.g. <LogoMark class="w-6 h-6 text-slate-900" />. -->
<template>
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" v-html="body" />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { LOGO_MARK, LOGO_TILE } from './logo.ts';

const props = defineProps<{ tile?: boolean }>();
const body = computed(() => (props.tile ? LOGO_TILE : LOGO_MARK));
</script>
