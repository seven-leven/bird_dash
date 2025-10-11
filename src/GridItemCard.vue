<template>
  <div
    :class="[$style.gridItem, $style.birdCard]"
    :style="{ backgroundImage: `url('${props.item.image}')` }"
    @click="handleClick"
    role="button"
    :aria-label="`View details for ${props.item.name}`"
    tabindex="0"
    @keydown.enter="handleClick"
    @keydown.space="handleClick"
  >
    <span :class="$style.birdIndex">{{ props.item.birdId }}</span>
    <div :class="$style.birdNameContainer">
      <h3 :class="$style.birdName">{{ props.item.name }}</h3>
      <p :class="$style.birdScientificName">{{ props.item.scientificName }}</p>
    </div>
  </div>
</template>

<script setup>
import cardStyles from './styles/Card.module.css';

const props = defineProps({
  item: {
    type: Object, // Expects { name, scientificName, image, birdId, ... }
    required: true,
  },
});

const emit = defineEmits(['card-click']);

const handleClick = () => {
  // Assuming only bird items are passed to this card, or add a type check
  // if (props.item.type === 'bird') {
  emit('card-click', props.item);
  // }
};

// Make Card.module.css available as $style in the template
const $style = cardStyles;
</script>