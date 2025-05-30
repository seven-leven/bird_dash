<script setup lang="ts">
import { onMounted } from 'vue';
import appStyles from './styles/App.module.css';
import GridItemCard from './components/GridItemCard.vue'; // Assuming GridItem type is exported here
import { useBirdData } from './composables/useBirdData';

// --- Constants ---
const SKELETON_CARD_COUNT = 8;
const APP_TITLE = "Bird Watchlist";

// --- Composable for Data ---
const { gridItems, isLoading, error, fetchData } = useBirdData();

// --- Lifecycle Hooks ---
onMounted(() => {
  fetchData();
});

</script>

<template>
  <div :class="appStyles.appContainer" :aria-busy="isLoading">
    <header>
      <h1 :class="appStyles.appTitle">{{ APP_TITLE }}</h1>
    </header>

    <main>
      <div
        v-if="isLoading"
        :class="[appStyles.masterGrid, appStyles.loadingContainer]"
        aria-label="Loading bird data"
        role="status"
      >
        <div
          v-for="n in SKELETON_CARD_COUNT"
          :key="`skeleton-${n}`"
          :class="appStyles.skeletonCard"
          aria-hidden="true"
        >
          <!-- Content for skeleton card, if any, or just styled div -->
        </div>
      </div>

      <div
        v-else-if="error"
        :class="appStyles.errorMessage"
        role="alert"
      >
        <h2>Error Loading Data</h2>
        <p>{{ error }}</p>
        <p>
          Please ensure <code>public/birds.txt</code> exists, is correctly formatted, and accessible.
          Also, verify image paths (e.g., in <code>public/assets/</code> for bird images,
          and <code>public/placeholder.png</code> for the placeholder) are correct.
          The <code>base</code> URL in your <code>vite.config.js</code> must be correctly set
          for your deployment environment (e.g., <code>base: '/your-repo-name/'</code> for GitHub Pages).
        </p>
      </div>

      <div
        v-else-if="gridItems.length > 0"
        :class="appStyles.masterGrid"
      >
        <GridItemCard
          v-for="item in gridItems"
          :key="item.id"
          :item="item"
        />
      </div>

      <div
        v-else
        :class="appStyles.noItemsMessage"
        role="status"
      >
        <p>No birds or families found.</p>
        <p>Check your <code>public/birds.txt</code> data file or the file content.</p>
      </div>
    </main>
  </div>
</template>