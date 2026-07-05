import { onScopeDispose, type Ref, ref, watch } from 'vue';

/**
 * A ref that trails `source` by `delay` ms. Reading stays cheap and reactive;
 * writes to `source` are coalesced so expensive downstream computeds
 * (filtering, grouping, cross-collection search) run once per burst instead of
 * once per keystroke.
 */
export function useDebouncedRef<T>(source: Ref<T>, delay = 120): Ref<T> {
  const debounced = ref(source.value) as Ref<T>;
  let timer: ReturnType<typeof setTimeout> | undefined;

  watch(source, (value) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      debounced.value = value;
    }, delay);
  });

  onScopeDispose(() => clearTimeout(timer));

  return debounced;
}
