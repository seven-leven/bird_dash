<template>
  <div
    :class="[cardStyles.gridItem, cardStyles.birdCard]"
    :style="backgroundImageStyle"
    @click="$emit('cardClick', props.bird)"
    tabindex="0"
    @keydown.enter="$emit('cardClick', props.bird)"
    @keydown.space.prevent="$emit('cardClick', props.bird)"
  >
    <div :class="cardStyles.birdIndex">{{ props.bird.birdId }}</div>
    <div :class="cardStyles.birdNameContainer">
      <h3 :class="cardStyles.birdName">{{ props.bird.commonName }}</h3>
      <p v-if="props.bird.scientificName" :class="cardStyles.birdScientificName">
        {{ props.bird.scientificName }}
      </p>
      <!-- <p v-if="props.bird.observationDate" :class="cardStyles.birdObservationDate">{{ props.bird.observationDate }}</p> -->
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import cardStyles from '../styles/Card.module.css'; // Path is relative to GridItemCard.vue

const props = defineProps({
  bird: { // Renamed from 'item'
    type: Object,
    required: true,
  },
  placeholderImage: {
    type: String,
    required: true,
  },
  // imageBaseUrl is not used here if App.vue provides full bird.imageUrl
});

const emit = defineEmits(['cardClick']);

const imageToDisplay = ref('');

const loadImage = () => {
  const targetUrl = props.bird.imageUrl; // Changed from props.item.imageUrl

  if (!targetUrl || targetUrl === props.placeholderImage) {
    imageToDisplay.value = props.placeholderImage;
    return;
  }

  const img = new Image();
  img.onload = () => {
    imageToDisplay.value = targetUrl;
  };
  img.onerror = () => {
    console.warn(`[GridItemCard] Failed to load image: ${targetUrl}. Using placeholder.`);
    imageToDisplay.value = props.placeholderImage;
  };
  img.src = targetUrl;
};

watch(() => props.bird.imageUrl, loadImage, { immediate: true }); // Changed from props.item.imageUrl

const backgroundImageStyle = computed(() => {
  // Styles for background-size: contain, etc., are now primarily in Card.module.css
  // This computed property just sets the URL.
  if (imageToDisplay.value) {
    return { backgroundImage: `url('${imageToDisplay.value}')` };
  }
  // If imageToDisplay is empty initially, CSS class will handle fallback bg color.
  return {};
});

</script>