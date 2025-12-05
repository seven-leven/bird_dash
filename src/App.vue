<template>
  <div :class="styles.appShell">
    <aside
      id="appSidebar"
      :class="[styles.sidebar, { [styles.isOpen]: ui.sidebarOpen }]"
      aria-labelledby="sidebarTitleHeading"
    >
      <h1 id="sidebarTitleHeading" :class="styles.sidebarTitle">Bird Groups</h1>
      
      <ul v-if="data.families.length" :class="styles.sidebarList">
        <li
          v-for="name in data.families"
          :key="name"
          :ref="el => refs.sidebar[name] = el"
          :class="[styles.sidebarItem, { [styles.sidebarItemActive]: name === scroll.activeFamily }]"
          tabindex="0"
          @click="goToFamily(name)"
          @keydown.enter="goToFamily(name)"
          @keydown.space.prevent="goToFamily(name)"
        >
          {{ name }}
        </li>
      </ul>
      
      <div v-else-if="!data.loading && !data.error" :class="styles.sidebarNoItems">
        No bird families found.
      </div>
    </aside>

    <main :class="styles.mainAreaWrapper">
      <div :class="styles.stickyFamilyHeaderDisplay">
        <div :class="styles.headerLeft">
          <button
            v-if="ui.mobile"
            :class="styles.sidebarToggleButton"
            @click="ui.sidebarOpen = !ui.sidebarOpen"
            aria-label="Toggle bird groups menu"
            :aria-expanded="ui.sidebarOpen.toString()"
            aria-controls="appSidebar"
          >
            <svg viewBox="0 0 100 80" width="24" height="24" fill="currentColor">
              <rect width="100" height="15" rx="8"></rect>
              <rect y="30" width="100" height="15" rx="8"></rect>
              <rect y="60" width="100" height="15" rx="8"></rect>
            </svg>
          </button>
          <span v-if="!data.loading && !data.error && scroll.activeFamily">
            {{ scroll.activeFamily }}
          </span>
        </div>
        
        <div v-if="!data.loading && data.total > 0" :class="styles.progressDisplay" aria-live="polite">
          {{ data.drawn }} of {{ data.total }} Drawn
        </div>
      </div>

      <div 
        ref="scrollRef" 
        :class="styles.scrollableContent" 
        @scroll="updateActiveFamily"
        style="padding-bottom: 150px;"
      >
        <div v-if="data.loading" :class="[styles.masterGrid, styles.loadingContainer]">
          <div v-for="n in 6" :key="n" :class="styles.skeletonCard"></div>
        </div>

        <div v-else-if="data.error" :class="styles.errorMessage">
          <h2>Error Loading Data</h2>
          <p>{{ data.error }}</p>
          <p>Please ensure public/birds.txt exists and is accessible.</p>
        </div>

        <div v-else-if="!data.families.length" :class="styles.noItemsMessage">
          No birds or families found.<br />Check your public/birds.txt data file.
        </div>

        <template v-else>
          <section
            v-for="(birds, family) in data.grouped"
            :key="family"
            :id="`family-section-${family.replace(/\s+/g, '-')}`"
            :class="styles.familySection"
          >
            <h2 :ref="el => refs.headers[family] = el" :class="styles.familyTitleInContent">
              {{ family }}
            </h2>
            <div :class="styles.masterGrid">
              <GridItemCard
                v-for="bird in birds"
                :key="bird.id"
                :id="`bird-card-${bird.birdId}`"
                :ref="el => refs.cards[bird.birdId] = el"
                :bird="bird"
                :image-base-url="IMAGE_BASE"
                :placeholder-image="PLACEHOLDER"
                @card-click="openBirdOverlay"
              />
            </div>
          </section>
        </template>
      </div>
    </main>

    <div
      v-if="ui.client && ui.mobile"
      :class="[styles.sidebarOverlay, { [styles.isOpen]: ui.sidebarOpen }]"
      @click="ui.sidebarOpen = false"
      aria-hidden="true"
    ></div>
  </div>
</template>

<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
import GridItemCard from './components/GridItemCard.vue';
import styles from './styles/App.module.css';

// ------------------------------------------------------------------
// CONFIGURATION & CONSTANTS
// ------------------------------------------------------------------
const BASE = import.meta.env.BASE_URL;
const IMAGE_BASE = `${BASE}assets/`;
const PLACEHOLDER = `${BASE}placeholder.webp`;
const DATA_URL = `${BASE}birds.json`;

// ------------------------------------------------------------------
// STATE: DATA, UI, SCROLL, REFS
// ------------------------------------------------------------------
const data = reactive({
  birds: [],
  loading: true,
  error: null,
  grouped: computed(() => {
    const groups = {};
    data.birds.forEach(b => {
      if (!groups[b.family]) groups[b.family] = [];
      groups[b.family].push(b);
    });
    return groups;
  }),
  families: computed(() => Object.keys(data.grouped)),
  total: computed(() => data.birds.length),
  drawn: computed(() => data.birds.filter(b => b.imageUrl !== PLACEHOLDER).length)
});

const ui = reactive({
  sidebarOpen: false,
  mobile: false,
  client: false
});

const scroll = reactive({
  activeFamily: ''
});

const refs = reactive({
  headers: {},
  sidebar: {},
  cards: {}
});

const scrollRef = ref(null);

// ------------------------------------------------------------------
// LOGIC: DATA FETCHING & PARSING
// ------------------------------------------------------------------
const checkMobile = () => {
  if (typeof window !== 'undefined') {
    ui.mobile = window.innerWidth < 992;
    if (!ui.mobile) ui.sidebarOpen = false;
  }
};

const loadData = async () => {
  data.loading = true;
  data.error = null;
  try {
    const res = await fetch(DATA_URL);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    
    const rawGroups = await res.json();
    const birds = [];
    let id = 1;

    for (const [family, list] of Object.entries(rawGroups)) {
      list.forEach(b => {
        const hasImg = !!b.drawn;
        const imgFile = hasImg ? `${b.id}.webp` : 'placeholder.webp';
        const imgUrl = hasImg ? IMAGE_BASE + imgFile : PLACEHOLDER;

        birds.push({
          id: `bird-vuekey-${id++}`,
          birdId: b.id,
          commonName: b.name,
          scientificName: b.sci,
          family,
          drawnDate: b.drawn || '',
          imageFile: imgFile,
          imageUrl: imgUrl
        });
      });
    }

    data.birds = birds;
  } catch (e) {
    console.error(e);
    data.error = e.message || 'Failed to load bird data.';
  } finally {
    data.loading = false;
  }
};

// ------------------------------------------------------------------
// LOGIC: NAVIGATION & SCROLLING
// ------------------------------------------------------------------
const goToFamily = (family) => {
  const el = refs.headers[family];
  if (el && scrollRef.value) {
    scrollRef.value.scrollTo({ top: el.offsetTop, behavior: 'smooth' });
  }
  if (ui.mobile && ui.sidebarOpen) ui.sidebarOpen = false;
};

const goToBird = (birdId) => {
  const comp = refs.cards[birdId];
  if (!comp) return;
  
  const el = comp.$el;
  if (el?.scrollIntoView) {
    const observer = new IntersectionObserver(
      (entries, obs) => {
        if (entries[0].isIntersecting) {
          el.classList.add(styles.highlight);
          setTimeout(() => el.classList.remove(styles.highlight), 1500);
          obs.disconnect();
        }
      },
      { root: scrollRef.value, threshold: 0.9 }
    );
    observer.observe(el);
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
};

const updateActiveFamily = () => {
  if (!scrollRef.value || !data.families.length) return;
  
  const offset = scrollRef.value.scrollTop + 5;
  let best = null;
  
  for (const family of data.families) {
    const el = refs.headers[family];
    if (el && el.offsetTop <= offset) best = family;
  }
  
  scroll.activeFamily = best || data.families[0];
};

const handleHash = () => {
  const hash = window.location.hash;
  if (hash) {
    const birdId = hash.substring(1);
    if (birdId) nextTick(() => goToBird(birdId));
  }
};

const openBirdOverlay = (bird) => {
  console.log('Card clicked:', bird);
};

// ------------------------------------------------------------------
// WATCHERS & LIFECYCLE
// ------------------------------------------------------------------
watch(() => scroll.activeFamily, (newFamily) => {
  nextTick(() => {
    const el = refs.sidebar[newFamily];
    if (el?.scrollIntoView) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  });
});

watch(() => data.grouped, (newGroups) => {
  if (Object.keys(newGroups).length > 0) {
    nextTick(() => {
      updateActiveFamily();
      handleHash();
    });
  }
}, { deep: true });

onMounted(() => {
  ui.client = true;
  checkMobile();
  window.addEventListener('resize', checkMobile);
  window.addEventListener('hashchange', handleHash);
  loadData();
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', checkMobile);
  window.removeEventListener('hashchange', handleHash);
});
</script>