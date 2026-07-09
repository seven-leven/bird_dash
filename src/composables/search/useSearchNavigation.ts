import { computed, ref } from 'vue';
import type { GlobalSearchCollectionGroup } from '../../types/index.ts';

export function useSearchNavigation(
  results: () => GlobalSearchCollectionGroup[],
  wrapperRef: () => HTMLElement | null,
) {
  const focusedIndex = ref(-1);

  const flatResults = computed(() => results().flatMap((g) => g.results));

  function getFlatIndex(collectionId: string, localIdx: number): number {
    let offset = 0;
    for (const g of results()) {
      if (g.collection.id === collectionId) return offset + localIdx;
      offset += g.results.length;
    }
    return -1;
  }

  function moveFocus(delta: number) {
    const total = flatResults.value.length;
    if (total === 0) return;
    focusedIndex.value = (focusedIndex.value + delta + total) % total;
    const el = wrapperRef()?.querySelector(
      `[data-result-idx="${focusedIndex.value}"]`,
    ) as HTMLElement;
    el?.scrollIntoView({ block: 'nearest' });
  }

  function resetFocus() {
    focusedIndex.value = -1;
  }

  function getFocusedResult() {
    const idx = focusedIndex.value;
    if (idx >= 0 && idx < flatResults.value.length) {
      return flatResults.value[idx];
    }
    return null;
  }

  return { focusedIndex, getFlatIndex, moveFocus, resetFocus, getFocusedResult };
}
