import { computed, type ComputedRef, nextTick, ref, shallowReactive } from 'vue';
import type {
  CollectionCache,
  CollectionConfig,
  CollectionItem,
  DataState,
  GlobalStats,
  RawCollectionConfig,
} from '../../types/index.ts';

// Self-contained cast (not import.meta.env directly): under `deno check`, the
// ImportMetaEnv type only resolves when vite-env.d.ts is in the same check set,
// so keep this file independent of that ambient reference.
const getBase = () =>
  (import.meta as unknown as { env?: { BASE_URL?: string } }).env?.BASE_URL ?? '/';

const resolveUrl = (template: string, item: CollectionItem): string => {
  return template
    .replace(/{{common}}/g, encodeURIComponent(item.commonName))
    .replace(/{{sci}}/g, encodeURIComponent(item.scientificName));
};

export function useCollections() {
  const collections = ref<CollectionConfig[]>([]);
  const isInitialized = ref(false);
  const activeCollectionId = ref('');
  // shallowReactive: track the per-collection array references, but don't deeply
  // proxy the (frozen, immutable) items inside them.
  const collectionCache = shallowReactive<CollectionCache>({});

  const data = shallowReactive<DataState>({
    items: [],
    loading: true,
    error: undefined,
  });

  const activeCollection: ComputedRef<CollectionConfig | undefined> = computed(() => {
    if (!isInitialized.value) return undefined;
    return collections.value.find((c: CollectionConfig) => c.id === activeCollectionId.value) ??
      collections.value[0];
  });

  const globalStats: ComputedRef<GlobalStats> = computed(() => {
    let drawn = 0, total = 0;
    collections.value.forEach((col: CollectionConfig) => {
      const cached = collectionCache[col.id] ?? [];
      total += cached.length;
      for (const i of cached) if (i.isDrawn) drawn++;
    });
    return { drawn, total };
  });

  const fetchCollectionData = async (col: CollectionConfig): Promise<CollectionItem[]> => {
    const res = await fetch(col.dataUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status} loading ${col.label}`);

    const rawGroups: Record<string, Record<string, unknown>[]> = await res.json();
    const items: CollectionItem[] = [];
    const placeholder = `${getBase()}placeholders/${col.id}.webp`;
    const knownKeys = new Set(['id', 'name', 'sci', 'drawn', 'illustratorNote']);

    let counter = 1;
    for (const [groupName, list] of Object.entries(rawGroups)) {
      list.forEach((r: Record<string, unknown>) => {
        const hasImg = !!r.drawn;
        const meta: Record<string, string> = {};
        Object.keys(r).forEach((k: string) => {
          if (!knownKeys.has(k) && typeof r[k] === 'string') {
            meta[k] = r[k] as string;
          }
        });

        const drawnTime = hasImg ? (new Date(String(r.drawn)).getTime() || 0) : 0;
        const itemId = String(r.id ?? '');
        const commonName = String(r.name ?? '');
        const scientificName = String(r.sci ?? '');

        // Search haystack — includes Dhivehi name + Thaana script (any meta value).
        const searchText = [commonName, scientificName, groupName, itemId, ...Object.values(meta)]
          .join(' ')
          .toLowerCase();

        // Frozen: items never mutate after load, so freezing documents that and
        // lets the shallowReactive store skip proxying them.
        items.push(Object.freeze({
          id: `${col.id}-item-${counter++}`,
          itemId,
          commonName,
          scientificName,
          group: groupName,
          imageUrl: hasImg ? `${col.imageBase}${r.id}.webp` : placeholder,
          placeholderUrl: placeholder,
          isDrawn: hasImg,
          sortKey: Number.parseInt(itemId, 10) || 0,
          drawnTime,
          searchText,
          illustratorNote: String(r.illustratorNote ?? ''),
          meta: Object.keys(meta).length ? meta : undefined,
        }));
      });
    }
    return items;
  };

  // One in-flight request per collection, shared by the active load and the
  // background prefetch so neither duplicates the other's fetch.
  const inflight = new Map<string, Promise<CollectionItem[]>>();

  const loadCollection = (col: CollectionConfig): Promise<CollectionItem[]> => {
    const cached = collectionCache[col.id];
    if (cached) return Promise.resolve(cached);

    let request = inflight.get(col.id);
    if (!request) {
      request = fetchCollectionData(col)
        .then((items) => {
          collectionCache[col.id] = items;
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
  const loadData = async (col: CollectionConfig): Promise<void> => {
    const isActive = () => activeCollection.value?.id === col.id;
    data.loading = true;
    data.error = undefined;
    try {
      const items = await loadCollection(col);
      if (isActive()) data.items = items;
    } catch (e: unknown) {
      if (isActive()) data.error = e instanceof Error ? e.message : String(e);
    } finally {
      if (isActive()) data.loading = false;
    }
  };

  const switchCollection = async (id: string, onSwitch?: () => void): Promise<void> => {
    if (id === activeCollectionId.value) return;
    if (!collections.value.some((c) => c.id === id)) return; // unknown id: ignore
    activeCollectionId.value = id;

    const cached = collectionCache[id];
    if (cached) {
      data.items = cached;
      data.error = undefined;
      data.loading = false;
      nextTick(() => onSwitch?.());
    } else if (activeCollection.value) {
      await loadData(activeCollection.value);
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
      const response = await fetch(`${getBase()}collections.json`);
      if (!response.ok) throw new Error(`HTTP ${response.status} loading collections`);
      const rawData: RawCollectionConfig[] = await response.json().catch(() => {
        throw new Error('collections.json is missing or not valid JSON');
      });
      if (!Array.isArray(rawData) || rawData.length === 0) {
        throw new Error('No collections are configured');
      }

      collections.value = rawData.map((c: RawCollectionConfig) => ({
        ...c,
        dataUrl: `${getBase()}lists/${c.id}.json`,
        imageBase: `${getBase()}thumb/${c.id}/`,
        fullImageBase: `${getBase()}full/${c.id}/`,
        links: c.links.map((l) => ({
          label: l.label,
          color: l.color,
          url: (item: CollectionItem) => resolveUrl(l.url, item),
        })),
      }));
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
    collectionCache,
    data,
    activeCollection,
    globalStats,
    switchCollection,
    init,
    COLLECTIONS: collections,
  };
}
