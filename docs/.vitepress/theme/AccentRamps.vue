<!-- The colour ramps, live: slate, then every accent a collection may choose, in the
     order src/styles/accents.css lists them, each swatch the very CSS variable the site
     uses (`--color-teal-500`). On GitHub the same place shows the text. -->
<template>
  <div class="wi-ramps">
    <div v-for="name in ramps" :key="name" class="wi-ramp">
      <code class="wi-ramp-name">{{ name }}</code>
      <div class="wi-ramp-steps">
        <span
          v-for="step in STEPS"
          :key="step"
          class="wi-swatch"
          :class="step === '500' && 'is-marker'"
          :style="{ background: `var(--color-${name}-${step})` }"
          :title="`${name}-${step}`"
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
import { accentHues, STEPS } from '../../../script/docs/accents.ts';
import accentsCss from '../../../src/styles/accents.css?raw';

const ramps = ['slate', ...accentHues(accentsCss)];
</script>
