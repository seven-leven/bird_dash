<!-- The colour ramps, live: slate, then every accent a collection may choose, each read
     from src/styles/main.css and Tailwind's theme when the docs are built (ramps.data.ts).
     On GitHub the same place shows the text table. -->
<template>
  <div class="wi-ramps">
    <div v-for="ramp in ramps" :key="ramp.name" class="wi-ramp">
      <code class="wi-ramp-name">{{ ramp.name }}</code>
      <div class="wi-ramp-steps">
        <span
          v-for="(color, i) in ramp.colors"
          :key="STEPS[i]"
          class="wi-swatch"
          :class="STEPS[i] === '500' && 'is-marker'"
          :style="{ background: color }"
          :title="`${ramp.name}-${STEPS[i]}: ${color}`"
        />
      </div>
    </div>
    <div class="wi-ramp wi-ramp-scale" aria-hidden="true">
      <span />
      <div class="wi-ramp-steps">
        <span v-for="step in STEPS" :key="step">{{ step }}</span>
      </div>
    </div>
    <p class="wi-note">
      Slate is the interface; the rest are the accents on offer, the default first. The 500 step
      (outlined) draws the current marker and the focus ring; 700 carries white text.
    </p>
  </div>
</template>

<script setup lang="ts">
import { STEPS } from '../../../script/docs/accents.ts';
import { data } from './ramps.data.ts';

const ramps = [data.slate, ...data.accents];
</script>
