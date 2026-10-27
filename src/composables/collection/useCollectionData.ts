import { computed, type ComputedRef, type Ref, ref } from 'vue';
import { normalizeQuery } from '../../domain/normalizeQuery.ts';
import { monthName } from '../../domain/dates.ts';
import type {
  CollectionStats,
  GroupedData,
  Item,
  SidebarItem,
  ViewMode,
} from '../../types/index.ts';

const firstOfMonthUTC = (d: Date) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));

/** A run of this many empty months or more is folded into one sidebar row. */
export const FOLD_EMPTY_MONTHS = 3;

/**
 * The date view's sidebar rows, newest first: one per month, except that a run of
 * FOLD_EMPTY_MONTHS or more empty months becomes one disabled row naming the range
 * ("November 2024 – September 2025"), so a long gap does not fill the list.
 */
export function monthRows(
  monthsNewestFirst: string[],
  counts: Record<string, number>,
): SidebarItem[] {
  const rows: SidebarItem[] = [];
  let run: string[] = [];
  const flush = () => {
    if (run.length >= FOLD_EMPTY_MONTHS) {
      const [newest, oldest] = [run[0], run[run.length - 1]];
      rows.push({
        id: `${oldest} – ${newest}`,
        label: `${oldest} – ${newest}`,
        count: 0,
        total: 0,
        disabled: true,
      });
    } else {
      for (const m of run) rows.push({ id: m, label: m, count: 0, total: 0, disabled: true });
    }
    run = [];
  };
  for (const month of monthsNewestFirst) {
    const count = counts[month] ?? 0;
    if (count === 0) {
      run.push(month);
      continue;
    }
    flush();
    rows.push({ id: month, label: month, count, total: 0, disabled: false });
  }
  flush();
  return rows;
}

export function useCollectionData(
  items: Ref<Item[]>,
  searchQuery: Ref<string>,
  viewMode: Ref<ViewMode>,
  /** Family view: show drawn items only (and only the groups that have some). */
  drawnOnly: Ref<boolean> = ref(false),
) {
  // =============================================================================
  // FILTERING LOGIC
  // =============================================================================
  const query = computed(() => normalizeQuery(searchQuery.value));

  const allFilteredItems = computed(() => {
    const q = query.value;
    if (!q) return items.value;
    // searchText already includes name, scientific name, group, id, and the
    // Dhivehi name/script — so one substring test covers them all.
    return items.value.filter((i) => i.searchText.includes(q));
  });

  const drawnItems = computed(() => items.value.filter((i) => i.isDrawn));

  // Drawn items in chronological order (drawn date, then id) — this is what the
  // lightbox pages through, so prev/next follows the timeline, not item ids.
  const searchedDrawnItems = computed(() => {
    const q = query.value;
    const base = q ? drawnItems.value.filter((i) => i.searchText.includes(q)) : drawnItems.value;
    return [...base].sort((a, b) => a.drawnTime - b.drawnTime || a.sortKey - b.sortKey);
  });

  // =============================================================================
  // GROUP MODE LOGIC
  // =============================================================================
  const groupData: ComputedRef<GroupedData> = computed(() => {
    const grouped: Record<string, Item[]> = {};

    allFilteredItems.value.forEach((item) => {
      if (!grouped[item.group]) grouped[item.group] = [];
      grouped[item.group].push(item);
    });

    // The sidebar counts every item of a group ("4 of 8"), even when only the drawn
    // ones are shown, so what is hidden is still accounted for.
    const totals: Record<string, { drawn: number; total: number }> = {};
    for (const [g, list] of Object.entries(grouped)) {
      totals[g] = { drawn: list.filter((i) => i.isDrawn).length, total: list.length };
    }
    // "Drawn only" is one setting for every collection. In a collection with nothing
    // drawn it could only empty the page (and "Show what's planned" with it), so there
    // it does not apply; it filters again wherever something is drawn.
    if (drawnOnly.value && drawnItems.value.length > 0) {
      for (const g of Object.keys(grouped)) {
        grouped[g] = grouped[g].filter((i) => i.isDrawn);
        if (grouped[g].length === 0) delete grouped[g];
      }
    }

    Object.keys(grouped).forEach((g) => {
      grouped[g].sort((a, b) => {
        if (a.isDrawn !== b.isDrawn) return a.isDrawn ? -1 : 1;
        return a.sortKey - b.sortKey;
      });
    });

    return {
      grouped,
      sidebarItems: Object.keys(grouped).map((g): SidebarItem => ({
        id: g,
        label: g,
        count: totals[g].drawn,
        total: totals[g].total,
        disabled: false,
      })),
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

    const current = firstOfMonthUTC(new Date(minTime));
    const end = firstOfMonthUTC(new Date());

    while (current <= end) {
      months.push(monthName(current));
      current.setUTCMonth(current.getUTCMonth() + 1);
    }
    return months;
  });

  // The date view reads newest first: it is where a returning visitor looks for what
  // is new (docs/DESIGN.md §10). The viewer still pages in time order.
  const dateData: ComputedRef<GroupedData> = computed(() => {
    // searchedDrawnItems is in (drawnTime, sortKey) order; walk it backwards.
    const grouped: Record<string, Item[]> = {};
    for (let n = searchedDrawnItems.value.length - 1; n >= 0; n--) {
      const i = searchedDrawnItems.value[n];
      if (!i.drawnTime) continue;
      const key = monthName(new Date(i.drawnTime));
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(i);
    }
    const counts = Object.fromEntries(Object.entries(grouped).map(([m, list]) => [m, list.length]));

    return {
      grouped,
      sidebarItems: monthRows([...allMonths.value].reverse(), counts),
    };
  });

  // =============================================================================
  // EXPORTED UNIFIED STATE
  // =============================================================================
  const activeData: ComputedRef<GroupedData> = computed(() =>
    viewMode.value === 'group' ? groupData.value : dateData.value
  );

  const stats: ComputedRef<CollectionStats> = computed(() => ({
    total: viewMode.value === 'group' ? items.value.length : drawnItems.value.length,
    filtered: viewMode.value === 'group'
      ? allFilteredItems.value.length
      : searchedDrawnItems.value.length,
    filteredDrawn: searchedDrawnItems.value.length,
    drawn: drawnItems.value.length,
  }));

  return {
    activeData,
    stats,
    searchedDrawnItems, // Needed for ExpandedImage gallery navigation
  };
}
