// useDrawingNav.ts — moving between drawings: where the open one sits, and the ones beside it.
import { computed } from 'vue';
import { ratio } from '../../lib/formatCount.ts';
import type { CollectionItem } from '../../types/index.ts';

/**
 * The open drawing's place in the order the viewer pages through, and the moves to the
 * previous and next one. The open item is the caller's (a prop): a move only asks for
 * the new item through `onNavigate`, and the caller feeds it back.
 */
export function useDrawingNav(deps: {
  item: () => CollectionItem | undefined;
  items: () => readonly CollectionItem[];
  onNavigate: (item: CollectionItem) => void;
}) {
  const currentItem = computed(deps.item);

  const currentIndex = computed(() => {
    if (!currentItem.value) return -1;
    return deps.items().findIndex((i) => i.itemId === currentItem.value?.itemId);
  });

  const hasPrevious = computed(() => currentIndex.value > 0);
  const hasNext = computed(() =>
    currentIndex.value < deps.items().length - 1 && currentIndex.value !== -1
  );

  const navigateTo = (index: number) => {
    const target = deps.items()[index];
    // Always found: callers check hasPrevious / hasNext first.
    /* c8 ignore next */
    if (target) deps.onNavigate(target);
  };

  const goToPrevious = () => hasPrevious.value && navigateTo(currentIndex.value - 1);
  const goToNext = () => hasNext.value && navigateTo(currentIndex.value + 1);

  /** "3 of 18": where the open item sits in the order the viewer pages through. */
  const position = computed(() =>
    currentIndex.value === -1 ? '' : ratio(currentIndex.value + 1, deps.items().length)
  );

  return { currentItem, hasPrevious, hasNext, position, goToPrevious, goToNext };
}
