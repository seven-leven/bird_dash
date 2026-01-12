<template>
  <UI
    ref="uiRef"
    :sidebar-open="ui.sidebarOpen"
    :mobile="ui.mobile"
    :client="ui.client"
    :is-dark="theme.isDark"
    :loading="data.loading"
    :error="data.error"
    :families="data.families"
    :grouped="data.grouped"
    :active-family="scroll.activeFamily"
    :total="data.total"
    :drawn="data.drawn"
    :image-base-url="config.imageBase"
    :placeholder-image="config.placeholder"
    @close-sidebar="ui.sidebarOpen = false"
    @toggle-sidebar="ui.sidebarOpen = !ui.sidebarOpen"
    @toggle-theme="theme.isDark = !theme.isDark"
    @go-to-family="goToFamily"
    @scroll="updateActiveFamily"
    @card-click="openBirdOverlay"
  />
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
import UI from './components/UI.vue';

// =============================================================================
// CONFIGURATION
// =============================================================================
const config = {
  base: import.meta.env.BASE_URL,
  get imageBase() { return `${this.base}assets/`; },
  get placeholder() { return `${this.base}placeholder.webp`; },
  get dataUrl() { return `${this.base}birds.json`; }
};

// =============================================================================
// STATE (Declarative)
// =============================================================================

// Data State
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
  drawn: computed(() => data.birds.filter(b => b.imageUrl !== config.placeholder).length)
});

// UI State
const ui = reactive({
  sidebarOpen: false,
  mobile: false,
  client: false
});

// Scroll State
const scroll = reactive({
  activeFamily: ''
});

// Theme State
const theme = reactive({
  isDark: false
});

// Component Refs
const uiRef = ref(null);

// =============================================================================
// DATA OPERATIONS (Imperative)
// =============================================================================

const loadData = async () => {
  data.loading = true;
  data.error = null;
  try {
    const res = await fetch(config.dataUrl);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    
    const rawGroups = await res.json();
    const birds = [];
    let id = 1;

    for (const [family, list] of Object.entries(rawGroups)) {
      list.forEach(b => {
        const hasImg = !!b.drawn;
        const imgFile = hasImg ? `${b.id}.webp` : 'placeholder.webp';
        const imgUrl = hasImg ? config.imageBase + imgFile : config.placeholder;

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

// =============================================================================
// UI OPERATIONS (Imperative)
// =============================================================================

const updateMobileState = () => {
  if (typeof window !== 'undefined') {
    ui.mobile = window.innerWidth < 1024;
    if (!ui.mobile) ui.sidebarOpen = false;
  }
};

// =============================================================================
// NAVIGATION OPERATIONS (Imperative)
// =============================================================================

const goToFamily = (family) => {
  if (!uiRef.value) return;
  
  const el = uiRef.value.headerRefs[family];
  const scrollContainer = uiRef.value.scrollContainer;
  
  if (el && scrollContainer) {
    const headerOffset = 80;
    const elementPosition = el.getBoundingClientRect().top;
    const offsetPosition = elementPosition + scrollContainer.scrollTop - headerOffset;

    scrollContainer.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    });
  }
  
  if (ui.mobile && ui.sidebarOpen) ui.sidebarOpen = false;
};

const goToBird = (birdId) => {
  if (!uiRef.value) return;
  
  const comp = uiRef.value.cardRefs[birdId];
  if (!comp) return;
  
  const el = comp.$el;
  const scrollContainer = uiRef.value.scrollContainer;
  
  if (el?.scrollIntoView) {
    const observer = new IntersectionObserver(
      (entries, obs) => {
        if (entries[0].isIntersecting) {
          const highlightClasses = ['ring-4', 'ring-blue-500', 'ring-offset-4', 'dark:ring-offset-slate-900', 'z-10', 'transition-all', 'duration-500'];
          el.classList.add(...highlightClasses);
          
          setTimeout(() => {
            el.classList.remove(...highlightClasses);
          }, 2000);
          
          obs.disconnect();
        }
      },
      { root: scrollContainer, threshold: 0.5 }
    );
    observer.observe(el);
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
};

const handleHash = () => {
  const hash = window.location.hash;
  if (hash) {
    const birdId = hash.substring(1);
    if (birdId) nextTick(() => goToBird(birdId));
  }
};

const updateActiveFamily = () => {
  if (!uiRef.value || !data.families.length) return;
  
  const scrollContainer = uiRef.value.scrollContainer;
  if (!scrollContainer) return;
  
  const offset = scrollContainer.scrollTop + 100;
  let best = null;
  
  for (const family of data.families) {
    const el = uiRef.value.headerRefs[family];
    if (el && el.offsetTop <= offset) best = family;
  }
  
  scroll.activeFamily = best || data.families[0];
};

// =============================================================================
// EVENT HANDLERS (Imperative)
// =============================================================================

const openBirdOverlay = (bird) => {
  console.log('Card clicked:', bird);
};

// =============================================================================
// REACTIVITY (Declarative)
// =============================================================================

// Sync sidebar scroll with active family
watch(() => scroll.activeFamily, (newFamily) => {
  if (!uiRef.value) return;
  
  nextTick(() => {
    const el = uiRef.value.sidebarRefs[newFamily];
    if (el?.scrollIntoView) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  });
});

// Update scroll position when data loads
watch(() => data.grouped, (newGroups) => {
  if (Object.keys(newGroups).length > 0) {
    nextTick(() => {
      updateActiveFamily();
      handleHash();
    });
  }
}, { deep: true });

// Sync theme with DOM
watch(() => theme.isDark, (val) => {
  if (val) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}, { immediate: true });

// =============================================================================
// LIFECYCLE
// =============================================================================

onMounted(() => {
  // Initialize UI state
  ui.client = true;
  updateMobileState();
  
  // Set up event listeners
  window.addEventListener('resize', updateMobileState);
  window.addEventListener('hashchange', handleHash);
  
  // Load data
  loadData();
  
  // Initialize theme from system preference
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  theme.isDark = systemPrefersDark;
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateMobileState);
  window.removeEventListener('hashchange', handleHash);
});
</script>