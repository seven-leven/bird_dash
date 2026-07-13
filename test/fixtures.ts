import { effectScope } from 'vue';
import type { CollectionConfig, CollectionItem } from '../src/types/index.ts';

let counter = 0;

/** Minimal CollectionConfig for logic tests (only `id` is read by search logic). */
export function makeCollection(
  id: string,
  overrides: Partial<CollectionConfig> = {},
): CollectionConfig {
  return {
    id,
    label: id,
    emoji: '🐦',
    dataUrl: '',
    imageBase: '',
    fullImageBase: '',
    groupLabel: 'Group',
    itemLabel: 'item',
    links: [],
    ...overrides,
  };
}

/**
 * Build a CollectionItem for logic tests. `searchText` is derived the same way
 * the loader builds it (lowercased name/sci/group/id/meta), so filter tests are
 * faithful. Pass `drawnTime` (epoch ms) to mark an item drawn on a given date.
 */
export function makeItem(overrides: Partial<CollectionItem> = {}): CollectionItem {
  counter += 1;
  const itemId = overrides.itemId ?? String(counter).padStart(3, '0');
  const commonName = overrides.commonName ?? `Common ${itemId}`;
  const scientificName = overrides.scientificName ?? `Scientific ${itemId}`;
  const group = overrides.group ?? 'Group A';
  const drawnTime = overrides.drawnTime ?? 0;
  const isDrawn = overrides.isDrawn ?? drawnTime > 0;
  const meta = overrides.meta;

  const searchText = overrides.searchText ??
    [commonName, scientificName, group, itemId, ...Object.values(meta ?? {})]
      .join(' ')
      .toLowerCase();

  return {
    id: overrides.id ?? `col-item-${counter}`,
    itemId,
    commonName,
    scientificName,
    group,
    imageUrl: overrides.imageUrl ?? `/thumb/${itemId}.webp`,
    placeholderUrl: overrides.placeholderUrl ?? '/placeholders/col.webp',
    isDrawn,
    sortKey: overrides.sortKey ?? (Number.parseInt(itemId, 10) || counter),
    drawnTime,
    searchText,
    illustratorNote: overrides.illustratorNote,
    meta,
  };
}

/** epoch ms for a UTC date, for deterministic drawnTime values. */
export function at(year: number, month1to12: number, day = 1): number {
  return Date.UTC(year, month1to12 - 1, day);
}

/**
 * Run a factory inside a Vue effect scope so composables using onScopeDispose
 * (useDebouncedRef, the stores) don't warn, and can be torn down after.
 */
export function runInScope<T>(fn: () => T): { value: T; stop: () => void } {
  const scope = effectScope();
  const value = scope.run(fn) as T;
  return { value, stop: () => scope.stop() };
}
