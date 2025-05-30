<script setup lang="ts">
import { computed } from 'vue';
import cardStyles from '../styles/Card.module.css'; // Adjust path if needed

// Define the GridItem type that this component expects
export interface GridItem {
  type: 'family' | 'bird';
  id: string;
  name: string;
  imageUrl?: string;
  birdId?: string;
  date?: string;
}

const props = defineProps<{
  item: GridItem;
}>();

// const emit = defineEmits(['item-click']); // If you want to emit click events

// const handleClick = () => {
//   emit('item-click', props.item);
// };

const cardSpecificClass = computed(() => {
  return props.item.type === 'family' ? cardStyles.familyCard : cardStyles.birdCard;
});

const backgroundImageStyle = computed(() => {
  if (props.item.type === 'bird' && props.item.imageUrl) {
    return { backgroundImage: `url(${props.item.imageUrl})` };
  }
  return {};
});
</script>

<template>
  <div
    :class="[cardStyles.gridItem, cardSpecificClass]"
    :style="backgroundImageStyle"
    @click="() => {} /* handleClick */"
    role="button"
    :aria-label="`View details for ${props.item.name}`"
    tabindex="0"
  >
    <!-- Family Card Content -->
    <template v-if="props.item.type === 'family'">
      <h2 :class="cardStyles.familyName">{{ props.item.name }}</h2>
    </template>

    <!-- Bird Card Content -->
    <template v-else-if="props.item.type === 'bird'">
      <div :class="cardStyles.birdIndex" v-if="props.item.birdId">{{ props.item.birdId }}</div>
      <div :class="cardStyles.birdNameContainer">
        <h3 :class="cardStyles.birdName">{{ props.item.name }}</h3>
        <!-- Optional: Display date if design allows
        <p v-if="props.item.date" :class="cardStyles.birdDate">{{ props.item.date }}</p>
        -->
      </div>
    </template>
  </div>
</template>