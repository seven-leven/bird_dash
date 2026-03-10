import { onMounted, reactive, watch } from 'vue';

export function useTheme() {
  const theme = reactive({ isDark: false });

  const toggleTheme = () => {
    theme.isDark = !theme.isDark;
  };

  onMounted(() => {
    theme.isDark = globalThis.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  watch(() => theme.isDark, (val) => {
    document.documentElement.classList.toggle('dark', val);
  }, { immediate: true });

  return { theme, toggleTheme };
}
