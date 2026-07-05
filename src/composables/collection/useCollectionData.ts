import { computed, type ComputedRef, type Ref } from 'vue';
import type {
  CollectionItem,
  CollectionStats,
  DateData,
  GroupedData,
  SidebarItem,
  ViewMode,
} from '../../types/index.ts';

export function useCollectionData(
  items: Ref<CollectionItem[]>,
  searchQuery: Ref<string>,
  viewMode: Ref<ViewMode>,
) {
  // =============================================================================
  // FILTERING LOGIC
  // =============================================================================
  const allFilteredItems = computed(() => {
    const q = searchQuery.value.toLowerCase().trim();
    if (!q) return items.value;
    return items.value.filter((i) =>
      i.commonName.toLowerCase().includes(q) ||
      i.group.toLowerCase().includes(q) ||
      i.scientificName.toLowerCase().includes(q)
    );
  });

  const drawnItems = computed(() => items.value.filter((i) => i.isDrawn));

  const searchedDrawnItems = computed(() => {
    const q = searchQuery.value.toLowerCase().trim();
    if (!q) return drawnItems.value;
    return drawnItems.value.filter((i) =>
      i.commonName.toLowerCase().includes(q) ||
      i.group.toLowerCase().includes(q) ||
      i.scientificName.toLowerCase().includes(q)
    );
  });

  // =============================================================================
  // GROUP MODE LOGIC
  // =============================================================================
  const groupData: ComputedRef<GroupedData> = computed(() => {
    const grouped: Record<string, CollectionItem[]> = {};

    allFilteredItems.value.forEach((item) => {
      if (!grouped[item.group]) grouped[item.group] = [];
      grouped[item.group].push(item);
    });

    Object.keys(grouped).forEach((g) => {
      grouped[g].sort((a, b) => {
        if (a.isDrawn !== b.isDrawn) return a.isDrawn ? -1 : 1;
        return a.sortKey - b.sortKey;
      });
    });

    return {
      grouped,
      sidebarItems: Object.keys(grouped).map((g): SidebarItem => {
        const list = grouped[g];
        let drawnCount = 0;
        for (const i of list) if (i.isDrawn) drawnCount++;
        return { id: g, label: g, count: drawnCount, total: list.length, disabled: false };
      }),
    };
  });

  // =============================================================================
  // DATE MODE LOGIC
  // =============================================================================
  const allMonths = computed(() => {
    const months: string[] = [];

    // Single pass for the earliest drawn timestamp (avoids spreading into Math.min).
    let minTime = Infinity;
    for (const i of drawnItems.value) {
      if (i.drawnTime && i.drawnTime < minTime) minTime = i.drawnTime;
    }
    if (minTime === Infinity) return months;

    const minDate = new Date(minTime);
    const current = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
    const end = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    while (current <= end) {
      months.push(
        `${current.toLocaleString('default', { month: 'long' })} ${current.getFullYear()}`,
      );
      current.setMonth(current.getMonth() + 1);
    }
    return months;
  });

  const dateData: ComputedRef<DateData> = computed(() => {
    const sorted = [...searchedDrawnItems.value].sort((a, b) => {
      if (a.drawnTime !== b.drawnTime) return a.drawnTime - b.drawnTime;
      return a.sortKey - b.sortKey;
    });

    const grouped: Record<string, CollectionItem[]> = {};
    sorted.forEach((i) => {
      if (!i.drawnTime) return;
      const d = new Date(i.drawnTime);
      const key = `${d.toLocaleString('default', { month: 'long' })} ${d.getFullYear()}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(i);
    });

    return {
      grouped,
      sidebarItems: allMonths.value.map((month): SidebarItem => ({
        id: month,
        label: month,
        count: grouped[month]?.length || 0,
        total: 0,
        disabled: !grouped[month] || grouped[month].length === 0,
      })),
    };
  });

  // =============================================================================
  // EXPORTED UNIFIED STATE
  // =============================================================================
  const activeData: ComputedRef<GroupedData | DateData> = computed(() =>
    viewMode.value === 'group' ? groupData.value : dateData.value
  );

  const stats: ComputedRef<CollectionStats> = computed(() => ({
    total: viewMode.value === 'group' ? items.value.length : drawnItems.value.length,
    filtered: viewMode.value === 'group'
      ? allFilteredItems.value.length
      : searchedDrawnItems.value.length,
    drawn: drawnItems.value.length,
    mode: viewMode.value,
  }));

  return {
    activeData,
    stats,
    searchedDrawnItems, // Needed for ExpandedImage gallery navigation
  };
}
