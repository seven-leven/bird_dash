import { onMounted, onUnmounted, ref } from 'vue';

export function useBreakpoints(width = 1024) {
  const isMobile = ref(false);

  const checkSize = () => {
    isMobile.value = globalThis.innerWidth < width;
  };

  onMounted(() => {
    checkSize();
    globalThis.addEventListener('resize', checkSize);
  });

  onUnmounted(() => {
    globalThis.removeEventListener('resize', checkSize);
  });

  return { isMobile };
}
