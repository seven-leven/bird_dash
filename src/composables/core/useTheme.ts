import { reactive, watch } from 'vue';

// Keep in sync with the inline script in index.html, which applies the same
// rule before first paint so dark-mode users never see a light flash.
const STORAGE_KEY = 'theme';

/** An explicit stored choice wins; otherwise follow the OS preference. */
export function resolveInitialTheme(stored: string | null, prefersDark: boolean): boolean {
  if (stored === 'dark') return true;
  if (stored === 'light') return false;
  return prefersDark;
}

const readStored = (): string | null => {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null; // storage blocked (private mode, sandboxed iframe)
  }
};

const writeStored = (dark: boolean): void => {
  try {
    localStorage.setItem(STORAGE_KEY, dark ? 'dark' : 'light');
  } catch {
    /* storage blocked — the choice just won't survive a reload */
  }
};

export function useTheme() {
  const prefersDark = globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  const theme = reactive({ isDark: resolveInitialTheme(readStored(), prefersDark) });

  // Only an explicit toggle is persisted, so users who never touch it keep
  // following their OS setting.
  const toggleTheme = () => {
    theme.isDark = !theme.isDark;
    writeStored(theme.isDark);
  };

  watch(() => theme.isDark, (val) => {
    document.documentElement.classList.toggle('dark', val);
  }, { immediate: true });

  return { theme, toggleTheme };
}
