<script setup lang="ts">
import { ref, onMounted } from 'vue';
import appStyles from './styles/App.module.css';
// Import the new component and its type definition
import GridItemCard, { type GridItem } from './components/GridItemCard.vue'; // Adjust path if needed

// GridItem interface is now also exported from GridItemCard.vue,
// but it's good practice to keep type definitions close to where they are primarily used
// or define them in a shared types file. For this example, we can rely on the import.

const gridItems = ref<GridItem[]>([]);
const isLoading = ref(true);
const error = ref<string | null>(null);

const processRawData = (text: string): GridItem[] => {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const items: GridItem[] = [];
  let currentFamilyName: string | null = null;

  for (const line of lines) {
    const birdMatch = line.match(/^(\d+)[,\s]+(.+)/);

    if (birdMatch) {
      if (!currentFamilyName) {
        currentFamilyName = "Uncategorized Birds";
        if (!items.find(item => item.type === 'family' && item.name === currentFamilyName)) {
            items.push({ type: 'family', id: `family-${currentFamilyName.replace(/\s+/g, '-')}`, name: currentFamilyName });
        }
      }

      const id = birdMatch[1];
      const restOfLine = birdMatch[2];
      const parts = restOfLine.split(',');
      const name = parts[0].trim();
      const date = parts.length > 1 && parts[1].trim().match(/^\d{4}-\d{2}-\d{2}$/) ? parts[1].trim() : undefined;
      const imageUrl = date ? `/assets/${id}.png` : '/placeholder.png';

      items.push({
        type: 'bird',
        id: `bird-${id}`,
        birdId: id,
        name,
        date,
        imageUrl,
      });
    } else {
      currentFamilyName = line;
      items.push({
        type: 'family',
        id: `family-${currentFamilyName.replace(/\s+/g, '-')}`,
        name: currentFamilyName,
      });
    }
  }
  return items;
};

onMounted(async () => {
  try {
    isLoading.value = true;
    error.value = null;
    await new Promise(resolve => setTimeout(resolve, 500));
    const response = await fetch('/birds.txt');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} while fetching birds.txt`);
    }
    const textData = await response.text();
    gridItems.value = processRawData(textData);
  } catch (e: any) {
    console.error("Failed to load or parse bird data:", e);
    error.value = e.message || "Failed to load bird data.";
  } finally {
    isLoading.value = false;
  }
});

const skeletonCardsCount = 8;

// const handleCardInteraction = (item: GridItem) => {
//   console.log('Interaction with:', item);
//   // Handle navigation or modal display based on item.type
// };

</script>

<template>
  <div :class="appStyles.appContainer">
    <h1 :class="appStyles.appTitle">Bird Watchlist</h1>

    <div v-if="isLoading" :class="[appStyles.masterGrid, appStyles.loadingContainer]">
      <div
        v-for="n in skeletonCardsCount"
        :key="`skeleton-${n}`"
        :class="appStyles.skeletonCard"
      >
        <!-- Skeleton card is just a styled div, using appStyles.skeletonCard directly -->
        <!-- Note: If skeleton also needs to be a component, that's another refactor step -->
      </div>
    </div>

    <div v-if="error && !isLoading" class="error-message">
      <p>Error loading data: {{ error }}</p>
      <p>Please ensure <code>public/birds.txt</code> exists and is correctly formatted.</p>
    </div>

    <div v-if="!isLoading && !error" :class="appStyles.masterGrid">
      <div v-if="gridItems.length === 0" :class="appStyles.noItemsMessage">
        No birds or families found. Check your <code>birds.txt</code>.
      </div>

      <!-- Use the GridItemCard component -->
      <GridItemCard
        v-for="item in gridItems"
        :key="item.id"
        :item="item"
        />
        <!-- @item-click="handleCardInteraction" -->
    </div>
  </div>
</template>