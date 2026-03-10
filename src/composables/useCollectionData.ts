import { computed, type ComputedRef, type Ref } from 'vue';
import type { CollectionItem } from '../types/collections.ts';
import type {
  CollectionStats,
  DateData,
  GroupedData,
  SidebarItem,
  ViewMode,
} from '../types/composables.ts';

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

  const drawnItems = computed(() => items.value.filter((i) => i.imageUrl !== i.placeholderUrl));

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
        const aDrawn = a.imageUrl !== a.placeholderUrl;
        const bDrawn = b.imageUrl !== b.placeholderUrl;
        if (aDrawn !== bDrawn) return bDrawn ? 1 : -1;
        return parseInt(a.itemId) - parseInt(b.itemId);
      });
    });

    return {
      grouped,
      sidebarItems: Object.keys(grouped).map((g): SidebarItem => {
        const list = grouped[g];
        const drawnCount = list.filter((i) => i.imageUrl !== i.placeholderUrl).length;
        return { id: g, label: g, count: drawnCount, total: list.length, disabled: false };
      }),
    };
  });

  // =============================================================================
  // DATE MODE LOGIC
  // =============================================================================
  const allMonths = computed(() => {
    const months: string[] = [];
    const dates = drawnItems.value
      .map((i) => i.drawnDate ? new Date(i.drawnDate) : null)
      .filter((d): d is Date => d !== null && !isNaN(d.getTime()));

    if (dates.length === 0) return months;

    const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
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
      const da = a.drawnDate ? new Date(a.drawnDate).getTime() : 0;
      const db = b.drawnDate ? new Date(b.drawnDate).getTime() : 0;
      if (da !== db) return da - db;
      return parseInt(a.itemId) - parseInt(b.itemId);
    });

    const grouped: Record<string, CollectionItem[]> = {};
    sorted.forEach((i) => {
      if (!i.drawnDate) return;
      const d = new Date(i.drawnDate);
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
