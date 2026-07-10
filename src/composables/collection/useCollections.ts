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

  const loadData = async (): Promise<void> => {
    if (!activeCollection.value) return;
    data.loading = true;
    data.error = undefined;
    try {
      const items = await fetchCollectionData(activeCollection.value);
      data.items = items;
      collectionCache[activeCollection.value.id] = items;
    } catch (e: unknown) {
      data.error = e instanceof Error ? e.message : String(e);
    } finally {
      data.loading = false;
    }
  };

  const switchCollection = async (id: string, onSwitch?: () => void): Promise<void> => {
    if (id === activeCollectionId.value) return;
    activeCollectionId.value = id;

    if (collectionCache[id]) {
      data.items = collectionCache[id];
      data.loading = false;
      nextTick(() => onSwitch?.());
    } else {
      await loadData();
    }
  };

  const prefetchOtherCollections = (): void => {
    for (const col of collections.value) {
      if (col.id === activeCollectionId.value || collectionCache[col.id]) continue;

      // Fire and forget: results are stored in cache when they resolve
      fetchCollectionData(col).then((items) => {
        collectionCache[col.id] = items;
      }).catch(() => {
        /* silent fail for background prefetch */
      });
    }
  };

  const init = async (): Promise<void> => {
    const response = await fetch(`${getBase()}collections.json`);
    const rawData: RawCollectionConfig[] = await response.json();

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

    if (collections.value.length > 0) {
      activeCollectionId.value = collections.value[0].id;
      isInitialized.value = true;
      await loadData();
      prefetchOtherCollections();
    }
  };

  return {
    isInitialized,
    collectionCache,
    data,
    activeCollection,
    globalStats,
    switchCollection,
    init,
    COLLECTIONS: collections,
  };
}
