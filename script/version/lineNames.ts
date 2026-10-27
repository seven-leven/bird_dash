/**
 * Each line of work (the `major.minor` in base_version.json) is named after a drawing:
 * the archive's Dhivehi names in the order they were drawn, so v0.1 is "Reyru", the
 * first drawing's. Worked out from the lists like the rest of the version.
 *
 *   order     by drawn date; on the same day in collection order, then by id
 *   a name    the first Dhivehi name of a drawing that has one with its romanisation
 *             ("Alhi Maakanaa / Maakanaa" gives "Alhi Maakanaa")
 *   once      a name already taken (the second "Reyru") is skipped
 *
 * Line `0.n` takes the n-th name. A 1.0 would need its own rule; until then there is
 * nothing to decide. A name stays put as long as new drawings are dated after the
 * ones already named; a back-dated drawing would shift the names after it, and the
 * changelog's contract test (its headings carry the names) says so.
 */
import { type Collection, COLLECTIONS } from '../lib/collections.ts';
import { eachDrawnItem, readList } from '../lib/lists.ts';
import { type Io, realIo } from '../lib/io.ts';
import { dhivehiNames } from '../../src/domain/dhivehiNames.ts';
import type { ListEntry, ListFile } from '../../src/data/files.ts';

export interface LineName {
  /** Romanised, as it is shown: "Valu Kukulhu". */
  roman: string;
  /** In Thaana: "ވަލު ކުކުޅު". */
  script: string;
  /** The English name of the drawing it comes from: "Watercock". */
  species: string;
}

/** Every line name the lists give, in order (pure; `readLineNames` reads the lists). */
export function lineNames(lists: { id: string; data: ListFile }[]): LineName[] {
  const drawn: { order: number; item: ListEntry }[] = [];
  lists.forEach(({ data }, order) => {
    for (const item of eachDrawnItem(data)) drawn.push({ order, item });
  });
  drawn.sort((a, b) =>
    a.item.drawn!.localeCompare(b.item.drawn!) || a.order - b.order ||
    a.item.id.localeCompare(b.item.id)
  );

  const names: LineName[] = [];
  const taken = new Set<string>();
  for (const { item } of drawn) {
    const [first] = dhivehiNames(item.dhiv_script ?? '', item.dhiv ?? '');
    if (!first?.roman || taken.has(first.roman.toLowerCase())) continue;
    taken.add(first.roman.toLowerCase());
    names.push({ roman: first.roman, script: first.script, species: item.name });
  }
  return names;
}

/** Every line name, from the lists as they are on disk. */
export async function readLineNames(
  io: Io = realIo,
  collections: Collection[] = COLLECTIONS,
): Promise<LineName[]> {
  const lists = await Promise.all(collections.map(async (collection) => ({
    id: collection.id,
    data: await readList(collection, io).catch(() => ({})), // a list not written yet
  })));
  return lineNames(lists);
}

/** The name of line `major.minor`, or null when the lists do not reach that far yet. */
export function lineName(names: LineName[], major: number, minor: number): LineName | null {
  return major === 0 ? names[minor - 1] ?? null : null;
}
