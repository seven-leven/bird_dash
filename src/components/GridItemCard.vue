<template>
  <div
    :class="[cardStyles.gridItem, cardStyles.birdCard]"
    :style="backgroundImageStyle"
    @click="$emit('cardClick', props.item)"
    tabindex="0"
    @keydown.enter="$emit('cardClick', props.item)"
    @keydown.space.prevent="$emit('cardClick', props.item)"
  >
    <div :class="cardStyles.birdIndex">{{ props.item.birdId }}</div>
    <div :class="cardStyles.birdNameContainer">
      <h3 :class="cardStyles.birdName">{{ props.item.name }}</h3>
      <p v-if="props.item.scientificName" :class="cardStyles.birdScientificName">
        {{ props.item.scientificName }}
      </p>
      <!-- <p v-if="props.item.observationDate" :class="cardStyles.birdObservationDate">{{ props.item.observationDate }}</p> -->
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import cardStyles from '../styles/Card.module.css'; // Path is relative to GridItemCard.vue

const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
  placeholderImage: {
    type: String,
    required: true,
  },
  // imageBaseUrl is not used here if App.vue provides full item.imageUrl
});

const emit = defineEmits(['cardClick']);

const imageToDisplay = ref('');

const loadImage = () => {
  const targetUrl = props.item.imageUrl;

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

watch(() => props.item.imageUrl, loadImage, { immediate: true });

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