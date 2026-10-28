import { computed, type ComputedRef, ref, shallowReactive } from 'vue';
import { toCollection, toCollectionItems } from '../domain/toCollectionItems.ts';
import { fetchJson, getBase } from './fetchJson.ts';
import type { Collection, Item } from '../domain/toCollectionItems.ts';
import type { CollectionEntry, ListFile } from './files.ts';

/** The collection on screen: its items, and whether they are loading or failed to. */
export interface LoadState {
  items: Item[];
  loading: boolean;
  error?: string;
}

/** How much of the whole archive is drawn, over every collection loaded so far. */
export interface ArchiveCounts {
  drawn: number;
  total: number;
}

/** Every collection's items loaded so far, by collection id. */
export type ItemsByCollection = Record<string, Item[]>;

/**
 * The archive from the network: `collections.json`, then each collection's list. The first
 * collection loads at once, the rest in the background; each list is fetched once and kept.
 */
export function useCollectionLoader() {
  const collections = ref<Collection[]>([]);
  const isInitialized = ref(false);
  const activeCollectionId = ref('');
  // shallowReactive: track the per-collection array references, but don't deeply
  // proxy the (frozen, immutable) items inside them.
  const itemsByCollection = shallowReactive<ItemsByCollection>({});

  const loadState = shallowReactive<LoadState>({
    items: [],
    loading: true,
    error: undefined,
  });

  const activeCollection: ComputedRef<Collection | undefined> = computed(() => {
    if (!isInitialized.value) return undefined;
    // The fallback cannot run: the active id always comes from this list.
    /* c8 ignore next 2 */
    return collections.value.find((c: Collection) => c.id === activeCollectionId.value) ??
      collections.value[0];
  });

  const archiveCounts: ComputedRef<ArchiveCounts> = computed(() => {
    let drawn = 0, total = 0;
    collections.value.forEach((col: Collection) => {
      const cached = itemsByCollection[col.id] ?? [];
      total += cached.length;
      for (const i of cached) if (i.isDrawn) drawn++;
    });
    return { drawn, total };
  });

  const fetchCollectionData = async (col: Collection): Promise<Item[]> => {
    const raw = await fetchJson<ListFile>(col.dataUrl, col.label);
    return toCollectionItems(col, raw);
  };

  // One in-flight request per collection, shared by the active load and the
  // background prefetch so neither duplicates the other's fetch.
  const inflight = new Map<string, Promise<Item[]>>();

  const loadCollection = (col: Collection): Promise<Item[]> => {
    const cached = itemsByCollection[col.id];
    if (cached) return Promise.resolve(cached);

    let request = inflight.get(col.id);
    if (!request) {
      request = fetchCollectionData(col)
        .then((items) => {
          itemsByCollection[col.id] = items;
          return items;
        })
        .finally(() => inflight.delete(col.id));
      inflight.set(col.id, request);
    }
    return request;
  };

  // Everything after the await is guarded on `col` still being the active
  // collection: a response for a collection the user has already left must not
  // overwrite what's on screen.
  const loadData = async (col: Collection): Promise<void> => {
    const isActive = () => activeCollection.value?.id === col.id;
    loadState.loading = true;
    loadState.error = undefined;
    try {
      const items = await loadCollection(col);
      if (isActive()) loadState.items = items;
    } catch (e: unknown) {
      if (isActive()) loadState.error = e instanceof Error ? e.message : String(e);
    } finally {
      if (isActive()) loadState.loading = false;
    }
  };

  const selectCollection = async (id: string): Promise<void> => {
    if (id === activeCollectionId.value) return;
    const col = collections.value.find((c) => c.id === id);
    if (!col) return; // unknown id: ignore
    activeCollectionId.value = id;

    const cached = itemsByCollection[id];
    if (cached) {
      loadState.items = cached;
      loadState.error = undefined;
      loadState.loading = false;
    } else {
      await loadData(col);
    }
  };

  const prefetchOtherCollections = (): void => {
    for (const col of collections.value) {
      if (col.id === activeCollectionId.value) continue;
      // Fire and forget: results land in the cache when they resolve.
      loadCollection(col).catch(() => {/* silent fail for background prefetch */});
    }
  };

  // Set instead of thrown so the app can render an error screen (App.vue) rather
  // than spinning on "Loading collections…" forever.
  const initError = ref<string | undefined>(undefined);

  const init = async (): Promise<void> => {
    initError.value = undefined;
    try {
      const rawData = await fetchJson<CollectionEntry[]>(
        `${getBase()}collections.json`,
        'collections.json',
      );
      if (!Array.isArray(rawData) || rawData.length === 0) {
        throw new Error('No collections are configured');
      }

      collections.value = rawData.map((c) => toCollection(c, getBase()));
    } catch (e: unknown) {
      initError.value = e instanceof Error ? e.message : String(e);
      return;
    }

    activeCollectionId.value = collections.value[0].id;
    isInitialized.value = true;
    await loadData(collections.value[0]);
    prefetchOtherCollections();
  };

  return {
    isInitialized,
    initError,
    itemsByCollection,
    loadState,
    activeCollection,
    archiveCounts,
    selectCollection,
    init,
    collections,
  };
}
