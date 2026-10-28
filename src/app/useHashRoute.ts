import { nextTick, onMounted, onUnmounted, type Ref, watch } from 'vue';
import { findPage, type PageId } from './pages.ts';
import type { Collection, Item } from '../domain/toCollectionItems.ts';
import type { ItemsByCollection } from '../data/useCollectionLoader.ts';
import type { Page } from '../shell/layoutStore.ts';

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
 *   #<pageId>                  → a page in src/pages.ts (no collection shares its id)
 *
 * State → URL is a watch that mirrors (activeCollection, open item); URL → state
 * is `apply()`. A `last` sentinel ignores the hash changes we make ourselves,
 * and reflection stays off until the initial URL is consumed so a deep link
 * isn't clobbered by the default collection on load.
 */
export function useHashRoute(deps: {
  activeCollection: Ref<Collection | undefined>;
  isViewerOpen: Readonly<Ref<boolean>>;
  viewerItem: Readonly<Ref<Item | undefined>>;
  itemsByCollection: ItemsByCollection;
  selectCollection: (id: string) => Promise<void>;
  openViewer: (item: Item) => void;
  closeViewer: () => void;
  ringTile: (item: Item) => Promise<void>;
  page: Readonly<Ref<Page>>;
  showPage: (page: Page) => void;
}) {
  let last = '';
  // Skip the first state settle (the initial collection loading in) so a bare
  // load doesn't rewrite the URL; suppress reflection entirely while apply() is
  // consuming a URL, so an intermediate collection switch can't clobber the
  // item part of a deep link.
  let primed = false;
  let applying = false;

  // Only ever called with a non-empty hash: there is always an active collection.
  const write = (hash: string): void => {
    const next = `#${hash}`;
    last = next;
    if (location.hash !== next) location.hash = next;
  };

  // state → URL
  watch(
    () => {
      if (deps.page.value !== 'gallery') return deps.page.value;
      const col = deps.activeCollection.value?.id ?? '';
      const item = deps.isViewerOpen.value ? deps.viewerItem.value?.itemId ?? '' : '';
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
    if (findPage(collectionId)) {
      deps.showPage(collectionId as PageId);
      return;
    }
    deps.showPage('gallery');

    applying = true;
    try {
      if (collectionId !== deps.activeCollection.value?.id) {
        await deps.selectCollection(collectionId);
      }
      if (!itemId) {
        // An address without an item (the back button, after opening one) closes the viewer.
        if (deps.isViewerOpen.value) deps.closeViewer();
        return;
      }

      await nextTick();
      const item = deps.itemsByCollection[collectionId]?.find((i) => i.itemId === itemId);
      if (item?.isDrawn) deps.openViewer(item); // drawn → open the image
      else if (item) await deps.ringTile(item); // not drawn yet → show and ring its tile
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
