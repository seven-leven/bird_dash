import { ref, type Ref } from 'vue';

// Define interfaces for better type safety
interface ScrollUI {
  scrollContainer: HTMLElement | null;
  headerRefs: Record<string, HTMLElement | null>;
}

interface UIState {
  mobile: boolean;
  sidebarOpen: boolean;
}

export function useScrollLogic(
  uiRef: Ref<ScrollUI | null>, 
  ui: UIState
) {
  const activeSection = ref<string>('');

  const updateActiveSection = () => {
    const container = uiRef.value?.scrollContainer;
    if (!container) return;
    
    const scrollPos = container.scrollTop + 100; // offset for header

    // Check all section headers
    const headers = uiRef.value?.headerRefs || {};
    let current = '';

    for (const [name, el] of Object.entries(headers)) {
      if (el && el.offsetTop <= scrollPos) {
        current = name;
      }
    }

    if (current && current !== activeSection.value) {
      activeSection.value = current;
    }
  };

  const goToSection = (name: string) => {
    const el = uiRef.value?.headerRefs?.[name];
    const container = uiRef.value?.scrollContainer;
    
    if (el && container) {
      container.scrollTo({
        top: el.offsetTop - 80, // account for sticky header
        behavior: 'smooth'
      });
      activeSection.value = name;
      
      // Close mobile sidebar
      if (ui.mobile) {
        ui.sidebarOpen = false;
      }
    }
  };

  const handleHash = () => {
    // Optional: handle URL hash for direct linking
  };

  return {
    activeSection,
    updateActiveSection,
    goToSection,
    handleHash
  };
}