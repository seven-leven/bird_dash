import { computed, nextTick, reactive, ref } from 'vue';
import {
  type CollectionItem,
  COLLECTIONS as RAW_COLLECTIONS,
  fetchCollectionData,
  getPlaceholder,
  initCollections,
} from '../types/collections.ts';

export function useCollection() {
  // ---------------------------------------------------------------------------
  // STATE
  // ---------------------------------------------------------------------------
  const collections = ref([...RAW_COLLECTIONS]);
  const isInitialized = ref(false);
  const activeCollectionId = ref('');
  const collectionCache = reactive<Record<string, CollectionItem[]>>({});

  const data = reactive({
    items: [] as CollectionItem[],
    loading: true,
    error: undefined as string | undefined,
  });

  // ---------------------------------------------------------------------------
  // COMPUTED
  // ---------------------------------------------------------------------------
  const activeCollection = computed(() => {
    if (!isInitialized.value) return undefined;
    return collections.value.find((c) => c.id === activeCollectionId.value) ?? collections.value[0];
  });

  const globalStats = computed(() => {
    let drawn = 0, total = 0;
    if (!isInitialized.value) return { drawn, total };
    for (const col of collections.value) {
      const cached = collectionCache[col.id] ?? [];
      total += cached.length;
      drawn += cached.filter((i) => i.imageUrl !== i.placeholderUrl).length;
    }
    return { drawn, total };
  });

  const placeholderImage = computed(() => getPlaceholder(activeCollectionId.value));

  // ---------------------------------------------------------------------------
  // ACTIONS
  // ---------------------------------------------------------------------------
  const loadData = async () => {
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

  const switchCollection = async (
    id: string,
    onSwitch?: () => void,
  ) => {
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

  const prefetchOtherCollections = async () => {
    for (const col of collections.value) {
      if (col.id === activeCollectionId.value || collectionCache[col.id]) continue;
      try {
        collectionCache[col.id] = await fetchCollectionData(col);
      } catch { /* silent fail */ }
    }
  };

  // ---------------------------------------------------------------------------
  // LIFECYCLE
  // ---------------------------------------------------------------------------
  const init = async () => {
    await initCollections();
    collections.value = [...RAW_COLLECTIONS]; // re-sync after initCollections populates the array
    if (collections.value.length > 0) {
      activeCollectionId.value = collections.value[0].id;
      isInitialized.value = true;
      await loadData();
      prefetchOtherCollections();
    }
  };

  return {
    // state
    isInitialized,
    activeCollectionId,
    collectionCache,
    data,
    // computed
    activeCollection,
    globalStats,
    placeholderImage,
    // actions
    loadData,
    switchCollection,
    prefetchOtherCollections,
    init,
    // pass-through for template (reactive ref)
    COLLECTIONS: collections,
  };
}
