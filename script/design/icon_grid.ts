/**
 * Lay groups of icons out on a fixed grid of `cols` equal cells, so every icon
 * sits in a column and the columns line up from row to row. A group fills
 * consecutive cells, one empty cell separates it from the next group, and a
 * group that does not fit in what is left of the row starts a new row. Used by
 * the icon section of the design guide and by docs/assets/icons.png.
 */
export interface PlacedGroup {
  label: string;
  /** The row, and the column of the group's first icon (both from 0). */
  row: number;
  col: number;
  icons: { name: string; col: number }[];
}

export function iconGridLayout(
  groups: { label: string; icons: readonly string[] }[],
  cols: number,
): PlacedGroup[] {
  const placed: PlacedGroup[] = [];
  let col = 0;
  let row = 0;
  for (const group of groups) {
    if (col > 0 && col + group.icons.length > cols) {
      col = 0;
      row++;
    }
    placed.push({
      label: group.label,
      row,
      col,
      icons: group.icons.map((name, i) => ({ name, col: col + i })),
    });
    col += group.icons.length + 1; // one empty cell between groups
  }
  return placed;
}
