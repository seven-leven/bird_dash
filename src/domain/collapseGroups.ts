/** A group with this many results or more starts collapsed… */
export const COLLAPSE_AT = 10;
/** …showing only this many, with a "show more" row for the rest. */
export const COLLAPSED_SIZE = 7;

/** The shape of a group of results this folds: the collection it is in, and its results. */
interface Group {
  collection: { id: string };
  results: readonly unknown[];
}

/**
 * Shorten long groups so a collection with dozens of matches does not push the
 * next collection out of sight. `count` stays the group's true total; `results`
 * is what is listed (and what the arrow keys move through); `hidden` is how many
 * a "show more" row would reveal. Groups named in `expanded` are left whole.
 */
export function collapseGroups<G extends Group>(
  groups: G[],
  expanded: ReadonlySet<string>,
): (G & { hidden: number })[] {
  return groups.map((group) => {
    const collapse = group.results.length >= COLLAPSE_AT && !expanded.has(group.collection.id);
    if (!collapse) return { ...group, hidden: 0 };
    return {
      ...group,
      results: group.results.slice(0, COLLAPSED_SIZE),
      hidden: group.results.length - COLLAPSED_SIZE,
    };
  });
}
