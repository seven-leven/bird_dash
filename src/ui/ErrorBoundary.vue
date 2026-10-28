<!-- Whatever is inside it, until something in there throws (in a render, a hook, a watcher or
     an event handler): then the failure screen, saying what broke, instead of a blank or half-
     working page. The error still goes to the console, for whoever is fixing it. -->
<template>
  <slot v-if="!message" />
  <FailureScreen v-else title="Something went wrong" :hint="message" @retry="emit('retry')" />
</template>

<script setup lang="ts">
import { onErrorCaptured, ref } from 'vue';
import FailureScreen from './FailureScreen.vue';

const emit = defineEmits<{ retry: [] }>();

const message = ref('');
onErrorCaptured((err) => {
  console.error(err);
  message.value = err instanceof Error ? err.message : String(err);
  return false; // handled here: it goes no further
});
</script>
