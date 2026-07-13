import { nextTick, onMounted, onUnmounted, type Ref, watch } from 'vue';
import { flashItem } from '../lib/flashItem.ts';
import type { CollectionCache, CollectionConfig, CollectionItem } from '../types/index.ts';

/** Parse the hash grammar `#<collectionId>[/<itemId>]` (leading `#`/`/` optional). */
export function parseHash(hash: string): { collectionId: string; itemId: string } {
  const [collectionId = '', itemId = ''] = hash.replace(/^#\/?/, '').split('/');
  return { collectionId, itemId };
}

/** Build the hash body: `col` or `col/item` (empty item → collection only). */
export function buildHash(collectionId: string, itemId: string): string {
  return itemId ? `${collectionId}/${itemId}` : collectionId;
}

/**
 * The single owner of URL ⇄ state sync. Hash grammar:
 *   #<collectionId>            → a collection
 *   #<collectionId>/<itemId>   → that item's image (lightbox open)
 *
 * State → URL is a watch that mirrors (activeCollection, open item); URL → state
 * is `apply()`. A `last` sentinel ignores the hash changes we make ourselves,
 * and reflection stays off until the initial URL is consumed so a deep link
 * isn't clobbered by the default collection on load.
 */
export function useHashRoute(deps: {
  activeCollection: Ref<CollectionConfig | undefined>;
  expandedImage: { isOpen: boolean; item: CollectionItem | undefined };
  cache: CollectionCache;
  switchCollection: (id: string) => Promise<void>;
  openOverlay: (item: CollectionItem) => void;
}) {
  let last = '';
  // Skip the first state settle (the initial collection loading in) so a bare
  // load doesn't rewrite the URL; suppress reflection entirely while apply() is
  // consuming a URL, so an intermediate collection switch can't clobber the
  // item part of a deep link.
  let primed = false;
  let applying = false;

  const write = (hash: string): void => {
    const next = hash ? `#${hash}` : '';
    last = next;
    if (location.hash === next) return;
    if (next) location.hash = next;
    else history.replaceState(null, '', location.pathname + location.search);
  };

  // state → URL
  watch(
    () => {
      const col = deps.activeCollection.value?.id ?? '';
      const item = deps.expandedImage.isOpen ? deps.expandedImage.item?.itemId ?? '' : '';
      return buildHash(col, item);
    },
    (target) => {
      if (!primed) {
        primed = true; // adopt the load-time state without writing
        return;
      }
      if (!applying && target) write(target);
    },
  );

  // URL → state
  const apply = async (): Promise<void> => {
    if (location.hash === last) return;
    last = location.hash;

    const { collectionId, itemId } = parseHash(location.hash);
    if (!collectionId) return;

    applying = true;
    try {
      if (collectionId !== deps.activeCollection.value?.id) {
        await deps.switchCollection(collectionId);
      }
      if (!itemId) return;

      await nextTick();
      const item = deps.cache[collectionId]?.find((i) => i.itemId === itemId);
      if (item?.isDrawn) deps.openOverlay(item); // drawn → open the image
      else flashItem(itemId); // undrawn → just highlight the tile
    } finally {
      applying = false;
    }
  };

  // Consume the initial URL. Reflection begins after the first state settle.
  const start = (): Promise<void> => apply();

  onMounted(() => globalThis.addEventListener('hashchange', apply));
  onUnmounted(() => globalThis.removeEventListener('hashchange', apply));

  return { apply, start };
}
