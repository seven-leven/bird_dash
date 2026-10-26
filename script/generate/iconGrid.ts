/**
 * Lay groups of icons out on a fixed grid of `cols` equal cells, so every icon
 * sits in a column and the columns line up from row to row. A group fills
 * consecutive cells, one empty cell separates it from the next group, and a
 * group that does not fit in what is left of the row starts a new row. Used by
 * the icon section of the design guide and by docs/assets/icons.png.
 *
 * With `tracks` above 1, each row is split into that many equal tracks, one empty
 * cell apart, and a group that does not fit in its track starts the next track. Every
 * track then starts in the same column in every row, so the groups' starts line up
 * down the page instead of falling wherever the row before left off.
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
  tracks = 1,
): PlacedGroup[] {
  const trackCols = (cols - (tracks - 1)) / tracks;
  if (!Number.isInteger(trackCols)) {
    throw new Error(`${cols} columns do not split into ${tracks} equal tracks`);
  }
  const placed: PlacedGroup[] = [];
  let row = 0;
  let track = 0;
  let col = 0; // within the track
  for (const group of groups) {
    if (col > 0 && col + group.icons.length > trackCols) {
      col = 0;
      track++;
      if (track === tracks) {
        track = 0;
        row++;
      }
    }
    const start = track * (trackCols + 1) + col;
    placed.push({
      label: group.label,
      row,
      col: start,
      icons: group.icons.map((name, i) => ({ name, col: start + i })),
    });
    col += group.icons.length + 1; // one empty cell between groups
  }
  return placed;
}
