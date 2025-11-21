<template>
  <div :class="styles.appShell">
    <!-- Sidebar Navigation -->
    <aside
      id="appSidebar"
      ref="sidebarScrollableRef"
      :class="[styles.sidebar, { [styles.isOpen]: isSidebarOpen }]"
      aria-labelledby="sidebarTitleHeading"
    >
      <h1 id="sidebarTitleHeading" :class="styles.sidebarTitle">Bird Groups</h1>
      
      <ul v-if="uniqueFamilyNames.length > 0" :class="styles.sidebarList">
        <li
          v-for="familyName in uniqueFamilyNames"
          :key="familyName"
          :ref="setSidebarItemRef(familyName)"
          :class="[styles.sidebarItem, { [styles.sidebarItemActive]: familyName === stickyFamilyName }]"
          tabindex="0"
          @click="handleSidebarItemClick(familyName)"
          @keydown.enter="handleSidebarItemClick(familyName)"
          @keydown.space.prevent="handleSidebarItemClick(familyName)"
        >
          {{ familyName }}
        </li>
      </ul>
      
      <div v-else-if="!isLoading && !dataLoadingError" :class="styles.sidebarNoItems">
        No bird families found.
      </div>
    </aside>

    <!-- Main Content Area -->
    <main :class="styles.mainAreaWrapper">
      <div :class="styles.stickyFamilyHeaderDisplay">
        <div :class="styles.headerLeft">
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
          <span v-if="!isLoading && !dataLoadingError && uniqueFamilyNames.length > 0 && stickyFamilyName">
            {{ stickyFamilyName }}
          </span>
        </div>
        
        <div v-if="!isLoading && totalBirds > 0" :class="styles.progressDisplay" aria-live="polite">
          {{ drawnBirdCount }} of {{ totalBirds }} Drawn
        </div>
      </div>

      <div ref="scrollableContentRef" :class="styles.scrollableContent" @scroll="handleScroll">
        <!-- Loading Skeleton -->
        <div v-if="isLoading" :class="[styles.masterGrid, styles.loadingContainer]">
          <div v-for="n in 6" :key="`skeleton-${n}`" :class="styles.skeletonCard"></div>
        </div>

        <!-- Error Message -->
        <div v-else-if="dataLoadingError" :class="styles.errorMessage">
          <h2>Error Loading Data</h2>
          <p>{{ dataLoadingError }}</p>
          <p>
            Please ensure public/birds.txt exists and is accessible.
            Verify image paths and base URL configuration in vite.config.js.
          </p>
        </div>

        <!-- Empty State -->
        <div v-else-if="uniqueFamilyNames.length === 0" :class="styles.noItemsMessage">
          No birds or families found.<br />
          Check your public/birds.txt data file.
        </div>

        <!-- Bird Grid -->
        <template v-else>
          <section
            v-for="(birdsInFamily, familyName) in groupedBirds"
            :key="familyName"
            :id="`family-section-${familyName.replace(/\s+/g, '-')}`"
            :class="styles.familySection"
          >
            <h2 :ref="setFamilyHeaderRef(familyName)" :class="styles.familyTitleInContent">
              {{ familyName }}
            </h2>
            <div :class="styles.masterGrid" v-bind="$attrs">
              <GridItemCard
                v-for="bird in birdsInFamily"
                :key="bird.id"
                :id="`bird-card-${bird.birdId}`"
                :ref="setBirdCardRef(bird)"
                :bird="bird"
                :image-base-url="IMAGE_BASE_URL"
                :placeholder-image="PLACEHOLDER_IMAGE_URL"
                @card-click="openBirdOverlay"
              />
            </div>
          </section>
        </template>
      </div>
    </main>

    <!-- Mobile Sidebar Overlay -->
    <div
      v-if="isClient && isMobileView"
      :class="[styles.sidebarOverlay, { [styles.isOpen]: isSidebarOpen }]"
      @click="closeSidebar"
      aria-hidden="true"
    ></div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
import GridItemCard from './components/GridItemCard.vue';
import styles from './styles/App.module.css';

// ------------------------------------------------------------------
// CONFIGURATION & CONSTANTS
// ------------------------------------------------------------------
const DATA_URL = `${import.meta.env.BASE_URL}birds.txt`;
const IMAGE_BASE_URL = `${import.meta.env.BASE_URL}assets/`;
const PLACEHOLDER_IMAGE_URL = `${import.meta.env.BASE_URL}placeholder.webp`;

// ------------------------------------------------------------------
// LOGIC: DATA FETCHING & PARSING
// ------------------------------------------------------------------
function useBirdData(constants) {
  const allBirds = ref([]);
  const isLoading = ref(true);
  const dataLoadingError = ref(null);

  const totalBirds = computed(() => allBirds.value.length);
  
  const drawnBirdCount = computed(() =>
    allBirds.value.filter(bird => bird.imageUrl !== constants.PLACEHOLDER_IMAGE_URL).length
  );

  const groupedBirds = computed(() => {
    const groups = {};
    allBirds.value.forEach(bird => {
      if (!groups[bird.family]) groups[bird.family] = [];
      groups[bird.family].push(bird);
    });
    return groups;
  });

  const uniqueFamilyNames = computed(() => Object.keys(groupedBirds.value));

  const parseBirdData = (text) => {
    const lines = text.trim().split('\n');
    const parsedBirds = [];
    let currentFamily = '';
    let uniqueVueKeyCounter = 1;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.startsWith('//') || line.startsWith('#')) continue;

      const parts = line.split(',').map(part => part.trim().replace(/^"|"$/g, '').trim());

      if (parts.length >= 2 && parts[0] === '' && parts[1] !== '') {
        currentFamily = parts[1];
      } 
      else if (parts.length >= 3 && parts[0] !== '' && /^\d+$/.test(parts[0])) {
        
        const idString = parts[0]; 
        
        const commonName = parts[1];
        const scientificName = parts[2];
        const observationDate = parts.length > 3 ? parts[3] : '';

        if (commonName) {
          const hasImage = !!observationDate;
          const imageFileToUse = hasImage ? `${idString}.webp` : 'placeholder.webp';
          const imageUrlToUse = hasImage ? constants.IMAGE_BASE_URL + imageFileToUse : constants.PLACEHOLDER_IMAGE_URL;

          parsedBirds.push({
            // Unique internal key for Vue v-for
            id: `bird-vuekey-${uniqueVueKeyCounter++}`, 
            // The actual ID from the file (String "001") used for logic/display
            birdId: idString, 
            commonName,
            scientificName,
            family: currentFamily,
            imageFile: imageFileToUse,
            imageUrl: imageUrlToUse,
            observationDate,
          });
        }
      }
    }
    allBirds.value = parsedBirds;
  };

  const fetchData = async () => {
    isLoading.value = true;
    dataLoadingError.value = null;
    try {
      const response = await fetch(constants.DATA_URL);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const text = await response.text();
      parseBirdData(text);
    } catch (e) {
      dataLoadingError.value = e.message || 'Failed to load bird data.';
    } finally {
      isLoading.value = false;
    }
  };

  return { isLoading, dataLoadingError, groupedBirds, uniqueFamilyNames, fetchData, totalBirds, drawnBirdCount };
}

// ------------------------------------------------------------------
// LOGIC: UI STATE (SIDEBAR & RESPONSIVE)
// ------------------------------------------------------------------
function useUIState() {
  const isSidebarOpen = ref(false);
  const isMobileView = ref(false);
  const isClient = ref(false);

  const checkIfMobile = () => {
    if (typeof window !== 'undefined') {
      isMobileView.value = window.innerWidth < 992;
      if (!isMobileView.value && isSidebarOpen.value) {
        isSidebarOpen.value = false;
      }
    }
  };

  onMounted(() => {
    isClient.value = true;
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
  });

  onBeforeUnmount(() => {
    window.removeEventListener('resize', checkIfMobile);
  });

  const toggleSidebar = () => isSidebarOpen.value = !isSidebarOpen.value;
  const closeSidebar = () => { if (isSidebarOpen.value) isSidebarOpen.value = false; };

  return { isSidebarOpen, isMobileView, isClient, toggleSidebar, closeSidebar };
}

// ------------------------------------------------------------------
// LOGIC: SCROLLING & REFS
// ------------------------------------------------------------------
function useScrollAndRefs(uniqueFamilyNames, isMobileView, isSidebarOpen, closeSidebar) {
  const stickyFamilyName = ref('');
  const familyHeaderRefs = ref({});
  const sidebarItemRefs = ref({});
  const birdCardRefs = ref({});
  const scrollableContentRef = ref(null);

  // Element Setters
  const setFamilyHeaderRef = (familyName) => (el) => { if (el) familyHeaderRefs.value[familyName] = el; };
  const setSidebarItemRef = (familyName) => (el) => { if (el) sidebarItemRefs.value[familyName] = el; };
  const setBirdCardRef = (bird) => (el) => { if (el) birdCardRefs.value[bird.birdId] = el; };

  // Navigation
  const scrollToFamily = (familyName) => {
    const headerEl = familyHeaderRefs.value[familyName];
    if (headerEl && scrollableContentRef.value) {
      const offset = headerEl.offsetTop;
      scrollableContentRef.value.scrollTo({ top: offset, behavior: 'smooth' });
    }
  };

  const handleSidebarItemClick = (familyName) => {
    scrollToFamily(familyName);
    if (isMobileView.value && isSidebarOpen.value) closeSidebar();
  };

  const scrollToBird = (birdId) => {
    const componentInstance = birdCardRefs.value[birdId];
    if (componentInstance) {
      const element = componentInstance.$el;
      if (element && typeof element.scrollIntoView === 'function') {
        const observer = new IntersectionObserver(
          (entries, observerInstance) => {
            const [entry] = entries;
            if (entry.isIntersecting) {
              element.classList.add(styles.highlight);
              setTimeout(() => element.classList.remove(styles.highlight), 1500);
              observerInstance.disconnect();
            }
          },
          { root: scrollableContentRef.value, threshold: 0.9 }
        );
        observer.observe(element);
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  const handleScroll = () => {
    if (!scrollableContentRef.value || uniqueFamilyNames.value.length === 0) return;
    const scrollContainer = scrollableContentRef.value;
    const offset = scrollContainer.scrollTop + 5;
    
    let bestCandidate = null;
    for (const familyName of uniqueFamilyNames.value) {
      const el = familyHeaderRefs.value[familyName];
      if (el && el.offsetTop <= offset) {
        bestCandidate = familyName;
      }
    }

    if (bestCandidate) stickyFamilyName.value = bestCandidate;
    else if (uniqueFamilyNames.value.length > 0) stickyFamilyName.value = uniqueFamilyNames.value[0];
  };

  watch(stickyFamilyName, (newFamily) => {
    nextTick(() => {
      const activeItem = sidebarItemRefs.value[newFamily];
      if (activeItem?.scrollIntoView) {
        activeItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  });

  return {
    stickyFamilyName,
    scrollableContentRef,
    handleScroll,
    handleSidebarItemClick,
    scrollToBird,
    setFamilyHeaderRef,
    setSidebarItemRef,
    setBirdCardRef
  };
}

// ------------------------------------------------------------------
// COMPONENT INITIALIZATION
// ------------------------------------------------------------------
const { 
  isLoading, 
  dataLoadingError, 
  groupedBirds, 
  uniqueFamilyNames, 
  fetchData, 
  totalBirds, 
  drawnBirdCount 
} = useBirdData({ DATA_URL, IMAGE_BASE_URL, PLACEHOLDER_IMAGE_URL });

const { 
  isSidebarOpen, 
  isMobileView, 
  isClient, 
  toggleSidebar, 
  closeSidebar 
} = useUIState();

const {
  stickyFamilyName,
  scrollableContentRef,
  handleScroll,
  handleSidebarItemClick,
  scrollToBird,
  setFamilyHeaderRef,
  setSidebarItemRef,
  setBirdCardRef
} = useScrollAndRefs(uniqueFamilyNames, isMobileView, isSidebarOpen, closeSidebar);

const handleHashChange = () => {
  const hash = window.location.hash;
  if (hash) {
    const birdId = hash.substring(1);
    if (birdId) {
      nextTick(() => scrollToBird(birdId));
    }
  }
};

const openBirdOverlay = (bird) => {
  console.log('Card clicked:', bird);
};

watch(groupedBirds, (newGroups) => {
  if (Object.keys(newGroups).length > 0) {
    nextTick(() => {
      handleScroll();
      handleHashChange();
    });
  }
}, { deep: true });

onMounted(() => {
  fetchData();
  window.addEventListener('hashchange', handleHashChange);
});

onBeforeUnmount(() => {
  window.removeEventListener('hashchange', handleHashChange);
});
</script>