<template>
  <div class="bird-info-panel bg-slate-800/90 backdrop-blur-md rounded-xl p-6 w-full max-w-md border border-slate-700 shadow-2xl">
    <!-- Header with ID and Names -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-2">
        <span class="px-2 py-1 bg-blue-600 text-white text-xs font-bold rounded-md">
          #{{ formattedId }}
        </span>
        <span class="text-slate-400 text-sm">{{ bird.family }}</span>
      </div>
      
      <h2 class="text-2xl font-bold text-white mb-1 leading-tight">
        {{ bird.commonName }}
      </h2>
      
      <p class="text-slate-400 italic text-sm">
        {{ bird.scientificName }}
      </p>
    </div>
<!-- Dhivehi Name -->
<div v-if="bird.dhiv_script || bird.dhiv" class="mt-3">
  <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
    Dhivehi Name
  </h3>
<p class="font-dhivehi text-xl text-white leading-tight" dir="rtl">
  {{ bird.dhiv_script }}
</p>
  <p class="text-sm text-slate-400">
    {{ bird.dhiv }}
  </p>
</div>

    <!-- Illustrator Comment -->
    <div v-if="bird.illustratorNote" class="mb-6">
      <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
        From the Illustrator
      </h3>
      <blockquote class="relative pl-4 border-l-2 border-blue-500">
        <span class="absolute -left-1 -top-2 text-3xl text-blue-500/30 font-serif">"</span>
        <p class="text-slate-300 text-sm leading-relaxed italic">
          {{ bird.illustratorNote }}
        </p>
      </blockquote>
    </div>

    <!-- Learn More -->
    <div>
      <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
        Learn More
      </h3>
      <div class="grid grid-cols-3 gap-2">
        <!-- eBird -->
        <a
          :href="eBirdSearchUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center justify-center gap-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <path d="M8 12h8"/>
            <path d="M12 8v8"/>
          </svg>
          eBird
        </a>
        
        <!-- BirdLife -->
        <a
          :href="birdLifeSearchUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center justify-center gap-1 px-3 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium rounded-lg transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
            <path d="M12 6v6l4 2"/>
          </svg>
          BirdLife
        </a>
        
        <!-- Wikipedia -->
        <a
          :href="wikipediaSearchUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center justify-center gap-1 px-3 py-2 bg-slate-600 hover:bg-slate-500 text-white text-xs font-medium rounded-lg transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 16v-4"/>
            <path d="M12 8h.01"/>
          </svg>
          Wiki
        </a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Bird {
  id: string;
  birdId: string;
  commonName: string;
  scientificName: string;
  family: string;
  drawnDate: string;
  imageFile: string;
  imageUrl: string;
  illustratorNote?: string;
  dhiv?: string;
  dhiv_script?: string;
}
const props = defineProps<{
  bird: Bird;
}>();

// Use birdId instead of id - that's where the actual 001, 002, etc. is stored
const formattedId = computed(() => {
  return props.bird.birdId;
});

// eBird: Google search since species codes are unpredictable
const eBirdSearchUrl = computed(() => {
  const query = encodeURIComponent(`${props.bird.commonName} ebird`);
  return `https://www.google.com/search?q=${query}`;
});

// BirdLife: Direct search query
const birdLifeSearchUrl = computed(() => {
  const query = encodeURIComponent(props.bird.commonName);
  return `https://datazone.birdlife.org/search?search=${query}`;
});

// Wikipedia: Direct search
const wikipediaSearchUrl = computed(() => {
  const query = encodeURIComponent(props.bird.commonName);
  return `https://en.wikipedia.org/wiki/Special:Search?search=${query}`;
});
</script>