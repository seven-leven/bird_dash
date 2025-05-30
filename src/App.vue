<script setup lang="ts">
import { ref, onMounted } from 'vue';
import appStyles from './styles/App.module.css';
import GridItemCard, { type GridItem } from './components/GridItemCard.vue';

const gridItems = ref<GridItem[]>([]);
const isLoading = ref(true);
const error = ref<string | null>(null);

const processRawData = (text: string): GridItem[] => {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const items: GridItem[] = [];
  let currentFamilyName: string | null = null;
  const baseUrl = import.meta.env.BASE_URL; // Vite's base URL, e.g., '/' or '/repository-name/'

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
      
      // Construct image URLs using BASE_URL to ensure they work with subpath deployments (GitHub Pages)
      // Assumes '1.png', '2.png' etc. are in 'public/assets/'
      // Assumes 'placeholder.png' is in 'public/' (root of public folder)
      const imageUrl = date 
        ? `${baseUrl}assets/${id}.png` 
        : `${baseUrl}placeholder.png`;

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
  isLoading.value = true;
  error.value = null;

  // Path to birds.txt, assuming it's in the 'public' directory.
  // import.meta.env.BASE_URL is configured in vite.config.js (e.g., '/bird_dash/' for GitHub Pages).
  const filePath = `${import.meta.env.BASE_URL}birds.txt`;

  try {
    // Optional: A small delay can be useful for UX if loading is very fast,
    // but typically not needed. Can be uncommented if desired.
    // await new Promise(resolve => setTimeout(resolve, 200));

    const response = await fetch(filePath);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} while fetching ${filePath}`);
    }
    const textData = await response.text();
    gridItems.value = processRawData(textData);
  } catch (e: any) {
    console.error("Failed to load or parse bird data:", e.message);
    // Provide a user-friendly error message.
    // The detailed error including filePath is logged to the console for debugging.
    error.value = `Failed to load bird data. Please check if '${filePath}' is accessible. Original error: ${e.message}`;
  } finally {
    isLoading.value = false;
  }
});

const skeletonCardsCount = 8;

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
      </div>
    </div>

    <div v-if="error && !isLoading" :class="appStyles.errorMessage">
      <p>Error loading data:</p>
      <pre>{{ error }}</pre>
      <p>
        Please ensure <code>public/birds.txt</code> exists and is correctly formatted.
        Also, check that image paths (e.g., in <code>public/assets/</code> for bird images,
        and <code>public/placeholder.png</code> for the placeholder) are correct and accessible.
        The <code>base</code> URL in your <code>vite.config.js</code> must be correctly set
        for your deployment environment (e.g., <code>base: '/bird_dash/'</code> for GitHub Pages).
      </p>
    </div>

    <div v-if="!isLoading && !error" :class="appStyles.masterGrid">
      <div v-if="gridItems.length === 0 && !isLoading" :class="appStyles.noItemsMessage">
        No birds or families found. Check your <code>birds.txt</code> data file.
      </div>

      <GridItemCard
        v-for="item in gridItems"
        :key="item.id"
        :item="item"
        />
    </div>
  </div>
</template>