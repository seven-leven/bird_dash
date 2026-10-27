<!-- "Try again", under a failure that says what failed (docs/DESIGN.md §11). What trying
     again means is the caller's: it listens for `retry`. -->
<template>
  <button class="btn-primary focus-ring mt-3" @click="emit('retry')">
    <Icon name="reset" class="size-4" aria-hidden="true" />
    Try again
  </button>
</template>

<script setup lang="ts">
import Icon from './Icon.vue';

const emit = defineEmits<{ retry: [] }>();
</script>
