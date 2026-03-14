import { computed, type ComputedRef, nextTick, reactive, ref } from 'vue';
// Added .ts extension and fixed path based on your error log
import type {
  CollectionCache,
  CollectionConfig,
  CollectionItem,
  DataState,
  GlobalStats,
  RawCollectionConfig,
} from '../../types/index.ts';

const getBase = () => (import.meta.env?.BASE_URL as string) || '/';

const resolveUrl = (template: string, item: CollectionItem): string => {
  return template
    .replace(/{{common}}/g, encodeURIComponent(item.commonName))
    .replace(/{{sci}}/g, encodeURIComponent(item.scientificName));
};

export function useCollections() {
  const collections = ref<CollectionConfig[]>([]);
  const isInitialized = ref(false);
  const activeCollectionId = ref('');
  const collectionCache = reactive<CollectionCache>({});

  const data = reactive<DataState>({
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
      drawn += cached.filter((i: CollectionItem) => i.imageUrl !== i.placeholderUrl).length;
    });
    return { drawn, total };
  });

  const placeholderImage = computed(() =>
    `${getBase()}placeholders/${activeCollectionId.value}.webp`
  );

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

        items.push({
          id: `${col.id}-item-${counter++}`,
          itemId: String(r.id ?? ''),
          commonName: String(r.name ?? ''),
          scientificName: String(r.sci ?? ''),
          group: groupName,
          drawnDate: String(r.drawn ?? ''),
          imageUrl: hasImg ? `${col.imageBase}${r.id}.webp` : placeholder,
          placeholderUrl: placeholder,
          illustratorNote: String(r.illustratorNote ?? ''),
          meta: Object.keys(meta).length ? meta : undefined,
        });
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
        urlTemplate: l.url,
        getUrl: (item: CollectionItem) => resolveUrl(l.url, item),
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
    activeCollectionId,
    collectionCache,
    data,
    activeCollection,
    globalStats,
    placeholderImage,
    loadData,
    switchCollection,
    prefetchOtherCollections,
    init,
    COLLECTIONS: collections,
  };
}
