// useDrawingNav.ts — moving through what the viewer shows: an item's images, then the drawings
// beside it.
import { computed, ref } from 'vue';
import { ratio } from '../domain/countWords.ts';
import type { Item } from '../domain/toCollectionItems.ts';

/**
 * The open drawing's place in the order the viewer pages through, which of its images is
 * showing, and the moves back and on: through the item's images first (`imageIds`), then to
 * the previous or next drawing, which opens on its first. The open item is the caller's (a
 * prop): a move to another only asks for it through `onNavigate`, and the caller feeds it back.
 */
export function useDrawingNav(deps: {
  item: () => Item | undefined;
  items: () => readonly Item[];
  onNavigate: (item: Item) => void;
}) {
  const currentItem = computed(deps.item);

  const currentIndex = computed(() => {
    if (!currentItem.value) return -1;
    return deps.items().findIndex((i) => i.itemId === currentItem.value?.itemId);
  });

  // Which of the item's images shows. The page is kept with the item it belongs to, so another
  // drawing opens on its first image at once, with no moment showing the old one's page.
  const paged = ref({ itemId: '', page: 0 });
  const page = computed(() => paged.value.itemId === currentItem.value?.id ? paged.value.page : 0);
  const turnTo = (next: number) => (paged.value = { itemId: currentItem.value!.id, page: next });
  const pages = computed(() => currentItem.value?.imageIds.length ?? 0);
  /** The image showing, by file name (`001`, `001-2`), or '' with no item. */
  const imageId = computed(() => currentItem.value?.imageIds[page.value] ?? '');

  const hasPreviousItem = computed(() => currentIndex.value > 0);
  const hasNextItem = computed(() =>
    currentIndex.value < deps.items().length - 1 && currentIndex.value !== -1
  );
  const hasPrevious = computed(() => page.value > 0 || hasPreviousItem.value);
  const hasNext = computed(() => page.value < pages.value - 1 || hasNextItem.value);

  const navigateTo = (index: number) => {
    const target = deps.items()[index];
    // Always found: callers check hasPreviousItem / hasNextItem first.
    /* c8 ignore next */
    if (target) deps.onNavigate(target);
  };

  const goToPrevious = () => {
    if (page.value > 0) turnTo(page.value - 1);
    else if (hasPreviousItem.value) navigateTo(currentIndex.value - 1);
  };
  const goToNext = () => {
    if (page.value < pages.value - 1) turnTo(page.value + 1);
    else if (hasNextItem.value) navigateTo(currentIndex.value + 1);
  };

  /** "3 of 18": where the open item sits in the order the viewer pages through. */
  const position = computed(() =>
    currentIndex.value === -1 ? '' : ratio(currentIndex.value + 1, deps.items().length)
  );
  /** "image 2 of 3", for an item with more than one; '' otherwise. */
  const imagePosition = computed(() =>
    pages.value > 1 ? `image ${ratio(page.value + 1, pages.value)}` : ''
  );

  return {
    currentItem,
    imageId,
    hasPrevious,
    hasNext,
    position,
    imagePosition,
    goToPrevious,
    goToNext,
  };
}
