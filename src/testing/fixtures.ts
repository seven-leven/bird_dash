import type { Collection, Item } from '../types/index.ts';
import { buildNames, nameWords } from '../domain/itemNames.ts';

let counter = 0;

/** Minimal Collection for logic tests (only `id` is read by search logic). */
export function makeCollection(
  id: string,
  overrides: Partial<Collection> = {},
): Collection {
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
 * Build a Item for logic tests. `names` and `searchText` are derived the
 * same way the loader builds them, so filter tests are faithful: a Dhivehi name
 * given as `meta: { dhiv, dhiv_script }` (the list's own fields) becomes names and
 * leaves `meta`. Pass `drawnTime` (epoch ms) to mark an item drawn on a given date.
 */
export function makeItem(overrides: Partial<Item> = {}): Item {
  counter += 1;
  const itemId = overrides.itemId ?? String(counter).padStart(3, '0');
  const commonName = overrides.commonName ?? `Common ${itemId}`;
  const scientificName = overrides.scientificName ?? `Scientific ${itemId}`;
  const group = overrides.group ?? 'Group A';
  const drawnTime = overrides.drawnTime ?? 0;
  const isDrawn = overrides.isDrawn ?? drawnTime > 0;
  const { dhiv, dhiv_script, ...rest } = overrides.meta ?? {};
  const meta = Object.keys(rest).length ? rest : undefined;
  const names = overrides.names ??
    buildNames({ name: commonName, sci: scientificName, dhiv, dhiv_script });

  const searchText = overrides.searchText ??
    [...nameWords(names), group, itemId, ...Object.values(meta ?? {})]
      .join(' ')
      .toLowerCase();

  return {
    id: overrides.id ?? `col-item-${counter}`,
    itemId,
    commonName,
    scientificName,
    names,
    group,
    imageUrl: overrides.imageUrl ?? `/thumb/${itemId}.webp`,
    placeholderUrl: overrides.placeholderUrl ?? '/placeholders/col.webp',
    placeholderDarkUrl: overrides.placeholderDarkUrl ?? '/placeholders/col-dark.webp',
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
