<template>
  <div :class="styles.appShell">
    <aside
      :class="[styles.sidebar, { [styles.isOpen]: isSidebarOpen }]"
      ref="sidebarScrollableRef"
      id="appSidebar"
      aria-labelledby="sidebarTitleHeading"
    >
      <h1 :class="styles.sidebarTitle" id="sidebarTitleHeading">Bird Groups</h1>
      <ul :class="styles.sidebarList" v-if="uniqueFamilyNames.length > 0">
        <li
          v-for="familyName in uniqueFamilyNames"
          :key="familyName"
          :class="[styles.sidebarItem, { [styles.sidebarItemActive]: familyName === currentStickyFamily }]"
          @click="handleSidebarItemClick(familyName)"
          tabindex="0"
          @keydown.enter="handleSidebarItemClick(familyName)"
          @keydown.space.prevent="handleSidebarItemClick(familyName)"
          :ref="setSidebarItemRef(familyName)"
        >
          {{ familyName }}
        </li>
      </ul>
      <div v-else-if="!isLoading && !error" :class="styles.sidebarNoItems">
        No bird families found.
      </div>
    </aside>

    <main :class="styles.mainAreaWrapper">
      <div :class="styles.stickyFamilyHeaderDisplay">
        <button
          v-if="isMobileView"
          :class="styles.sidebarToggleButton"
          @click="toggleSidebar"
          aria-label="Toggle bird groups menu"
          :aria-expanded="isSidebarOpen.toString()"
          aria-controls="appSidebar"
        >
          <svg viewBox="0 0 100 80" width="24" height="24" fill="currentColor">
            <rect width="100" height="15" rx="8"></rect>
            <rect y="30" width="100" height="15" rx="8"></rect>
            <rect y="60" width="100" height="15" rx="8"></rect>
          </svg>
        </button>
        <span v-if="!isLoading && !error && uniqueFamilyNames.length > 0 && currentStickyFamily">
          {{ currentStickyFamily }}
        </span>
      </div>

      <div :class="styles.scrollableContent" ref="scrollableContentRef" @scroll="handleScroll">
        <div v-if="isLoading" :class="[styles.masterGrid, styles.loadingContainer]">
          <div v-for="n in 6" :key="`skeleton-${n}`" :class="styles.skeletonCard"></div>
        </div>
        <div v-else-if="error" :class="styles.errorMessage">
          <h2>Error Loading Data</h2>
          <p>{{ error }}</p>
          <p>
            Please ensure public/birds.txt exists, is correctly formatted, and accessible.
            Also, verify image paths (e.g., in public/thumb/ for bird images, and public/placeholder.webp for the placeholder) are correct.
            The base URL in your vite.config.js must be correctly set for your deployment environment (e.g., base: '/your-repo-name/' for GitHub Pages).
          </p>
        </div>
        <div v-else-if="uniqueFamilyNames.length === 0" :class="styles.noItemsMessage">
          No birds or families found.<br />
          Check your public/birds.txt data file or the file content.
        </div>
        <template v-else>
          <section
            v-for="(birdsInFamily, familyName) in groupedBirds"
            :key="familyName"
            :class="styles.familySection"
            :id="`family-section-${familyName.replace(/\s+/g, '-')}`"
          >
            <h2 :class="styles.familyTitleInContent" :ref="setFamilyHeaderRef(familyName)">
              {{ familyName }}
            </h2>
            <div :class="styles.masterGrid">
              <GridItemCard
                v-for="bird in birdsInFamily"
                :key="bird.id" 
                :item="bird" 
                :image-base-url="IMAGE_BASE_URL"
                :placeholder-image="PLACEHOLDER_IMAGE_URL"
                @card-click="openBirdOverlay"
              />
            </div>
          </section>
        </template>
      </div>
    </main>

    <div
      v-if="isClient && isMobileView"
      :class="[styles.sidebarOverlay, { [styles.isOpen]: isSidebarOpen }]"
      @click="closeSidebar"
      aria-hidden="true" 
    ></div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'; // Added onBeforeUnmount
import GridItemCard from './GridItemCard.vue';
import styles from './styles/App.module.css';

// Constants
const DATA_URL = `${import.meta.env.BASE_URL}birds.txt`;
const IMAGE_BASE_URL = `${import.meta.env.BASE_URL}thumb`;
const PLACEHOLDER_IMAGE_URL = `${import.meta.env.BASE_URL}placeholder.webp`;

// Reactive State
const allBirds = ref([]);
const isLoading = ref(true);
const error = ref(null);
const groupedBirds = ref({});
const currentStickyFamily = ref('');

// Refs for scrolling and DOM elements
const familyHeaderRefs = ref({});
const scrollableContentRef = ref(null);
const sidebarScrollableRef = ref(null);
const sidebarItemRefs = ref({});

// Mobile sidebar state
const isSidebarOpen = ref(false);
const isMobileView = ref(false);
const isClient = ref(false); // To ensure window-dependent logic runs client-side

const openBirdOverlay = (bird) => {
  console.log('Card clicked, bird:', bird);
};

// --- Mobile Sidebar Logic ---
const checkIfMobile = () => {
  if (typeof window !== 'undefined') {
    isMobileView.value = window.innerWidth < 992;
    if (!isMobileView.value && isSidebarOpen.value) {
      // If resized to desktop view and mobile sidebar was open, close it.
      isSidebarOpen.value = false;
    }
  }
};

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value;
};

const closeSidebar = () => {
  if (isSidebarOpen.value) {
    isSidebarOpen.value = false;
  }
};

const handleSidebarItemClick = (familyName) => {
  scrollToFamily(familyName);
  if (isMobileView.value && isSidebarOpen.value) {
    closeSidebar();
  }
};


// --- Data Fetching and Parsing (remains the same as previous correct version) ---
const fetchData = async () => { /* ... same as before ... */
  isLoading.value = true;
  error.value = null;
  try {
    const response = await fetch(DATA_URL);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status} while fetching ${DATA_URL}`);
    const text = await response.text();
    parseBirdData(text);
  } catch (e) {
    error.value = e.message || 'Failed to load bird data.';
  } finally {
    isLoading.value = false;
  }
};

const parseBirdData = (text) => {
  const lines = text.trim().split('\n');
  const parsedBirds = [];
  let currentFamily = '';
  let uniqueVueKeyCounter = 1; // For Vue's :key, separate from display birdId
  
  console.log(`[App.vue] Parsing ${lines.length} lines from birds.txt (new CSV format).`);

  // Skip header line (first line)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith('//') || line.startsWith('#')) { // Skip empty or comment lines
      // console.log(`[App.vue] Line ${i + 1}: Skipped (comment or empty)`);
      continue;
    }

    // Basic CSV splitting, assumes fields don't contain unescaped commas unless quoted
    // and quotes are only at the very start/end of a field.
    const parts = line.split(',').map(part => part.trim().replace(/^"|"$/g, '').trim());
    // Example: "field" -> field,  field -> field, "" -> ""

    // Debugging parts
    // console.log(`[App.vue] Line ${i + 1} parts:`, parts);

    if (parts.length >= 2 && parts[0] === '' && parts[1] !== '') {
      // This is a family line, e.g., ,"Family Name",
      currentFamily = parts[1];
      console.log(`[App.vue] Line ${i + 1}: Set family to "${currentFamily}"`);
    } else if (parts.length >= 3 && parts[0] !== '' && !isNaN(parseInt(parts[0], 10))) {
      // This is a bird line, e.g., 1,"Common Name","Scientific Name",OptionalDate
      const birdIndexInFile = parseInt(parts[0], 10);
      const birdName = parts[1];
      const scientificName = parts[2]; // New: store scientific name
      const observationDate = parts.length > 3 ? parts[3] : ''; // Date is optional (4th element)

      if (birdName) {
        let imageUrlToUse;
        let imageFileToUse = '';

        if (observationDate) { // Date is present, use indexed image
          imageFileToUse = `${birdIndexInFile}.webp`;
          imageUrlToUse = IMAGE_BASE_URL + imageFileToUse;
        } else { // No date, use placeholder
          imageUrlToUse = PLACEHOLDER_IMAGE_URL;
          imageFileToUse = 'placeholder.webp';
        }
        
        parsedBirds.push({
          id: `bird-vuekey-${uniqueVueKeyCounter++}`, // Unique ID for Vue :key
          birdId: birdIndexInFile,    // Global index from file for display
          name: birdName,
          scientificName: scientificName, // Store scientific name
          family: currentFamily,
          imageFile: imageFileToUse,
          imageUrl: imageUrlToUse,
          observationDate: observationDate,
        });
        // console.log(`[App.vue] Added bird: ${birdName} (Sci: ${scientificName}), Index: ${birdIndexInFile}, Family: ${currentFamily}, Date: ${observationDate || 'N/A'}`);
      } else {
        console.warn(`[App.vue] Line ${i + 1}: Skipped bird line in family "${currentFamily}" due to missing name. Line: "${line}"`);
      }
    } else if (parts.length > 0 && parts.join("").trim() !== "") { // Avoid logging for truly empty lines after split
      console.warn(`[App.vue] Line ${i + 1}: Could not parse line or no current family set. Line: "${line}", Parts:`, parts);
    }
  }

  console.log(`[App.vue] Finished parsing. Total birds added: ${parsedBirds.length}`);
  if (parsedBirds.length === 0 && lines.length > 1) {
     console.warn('[App.vue] No birds were successfully parsed. Please check birds.txt format and console logs for parsing details.');
  }

  allBirds.value = parsedBirds;
  groupBirdsByFamily();
};

const groupBirdsByFamily = () => { /* ... same as before ... */
  const groups = {};
  allBirds.value.forEach(bird => {
    if (!groups[bird.family]) groups[bird.family] = [];
    groups[bird.family].push(bird);
  });
  groupedBirds.value = groups;
  if (uniqueFamilyNames.value.length > 0 && !currentStickyFamily.value) {
    currentStickyFamily.value = uniqueFamilyNames.value[0];
  }
};

const uniqueFamilyNames = computed(() => Object.keys(groupedBirds.value));

// --- Scrolling Logic (remains the same) ---
const setFamilyHeaderRef = (familyName) => (el) => { /* ... */ if (el) familyHeaderRefs.value[familyName] = el; else delete familyHeaderRefs.value[familyName]; };
const setSidebarItemRef = (familyName) => (el) => { /* ... */ if (el) sidebarItemRefs.value[familyName] = el; else delete sidebarItemRefs.value[familyName]; };

const scrollToFamily = (familyName) => { /* ... same as before ... */
  const headerElement = familyHeaderRefs.value[familyName];
  if (headerElement && scrollableContentRef.value) {
    const scrollableRect = scrollableContentRef.value.getBoundingClientRect();
    const elementRect = headerElement.getBoundingClientRect();
    const scrollTopTarget = (elementRect.top - scrollableRect.top) + scrollableContentRef.value.scrollTop;
    scrollableContentRef.value.scrollTo({ top: scrollTopTarget, behavior: 'smooth' });
  }
};

const handleScroll = () => { /* ... same as before ... */
  if (!scrollableContentRef.value || uniqueFamilyNames.value.length === 0) return;
  const scrollContainerTop = scrollableContentRef.value.getBoundingClientRect().top;
  const stickyHeaderHeight = document.querySelector(`.${styles.stickyFamilyHeaderDisplay}`)?.offsetHeight || 0;
  const stickyLineViewport = scrollContainerTop + stickyHeaderHeight;
  let bestCandidateFamily = null;
  let maxTopValAmongCandidates = -Infinity;
  for (const familyName of uniqueFamilyNames.value) {
    const el = familyHeaderRefs.value[familyName];
    if (!el) continue;
    const rect = el.getBoundingClientRect();
    if (rect.top <= stickyLineViewport) {
      if (rect.top > maxTopValAmongCandidates) {
        maxTopValAmongCandidates = rect.top;
        bestCandidateFamily = familyName;
      }
    }
  }
  if (bestCandidateFamily) {
    currentStickyFamily.value = bestCandidateFamily;
  } else if (uniqueFamilyNames.value.length > 0 && scrollableContentRef.value.scrollTop < 50) {
    currentStickyFamily.value = uniqueFamilyNames.value[0];
  }
};

// --- Lifecycle Hooks and Watchers ---
onMounted(() => {
  isClient.value = true; // Component is now mounted on the client
  fetchData();
  checkIfMobile(); // Initial check for mobile view
  window.addEventListener('resize', checkIfMobile);

  watch(isLoading, (newIsLoading) => {
    if (!newIsLoading && !error.value && uniqueFamilyNames.value.length > 0) {
      nextTick(() => {
        handleScroll();
        if (currentStickyFamily.value && sidebarItemRefs.value[currentStickyFamily.value]) {
           const activeItem = sidebarItemRefs.value[currentStickyFamily.value];
           if(activeItem && typeof activeItem.scrollIntoView === 'function') {
               activeItem.scrollIntoView({ block: 'nearest' });
           }
        }
      });
    }
  });
});

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', checkIfMobile);
  }
});

watch(currentStickyFamily, (newFamilyName) => { /* ... same sidebar scroll logic ... */
  if (newFamilyName && sidebarScrollableRef.value && sidebarItemRefs.value[newFamilyName]) {
    nextTick(() => {
        const activeItemElement = sidebarItemRefs.value[newFamilyName];
        if (activeItemElement && typeof activeItemElement.scrollIntoView === 'function') {
            activeItemElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    });
  }
});

watch(groupedBirds, () => { /* ... same as before ... */
    if (uniqueFamilyNames.value.length > 0 && scrollableContentRef.value && !isLoading.value) {
        nextTick(() => { handleScroll(); });
    }
}, { deep: true });

</script>