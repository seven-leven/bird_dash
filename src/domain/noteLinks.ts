/** A run of note text, or a reference to another drawing ("#11") with its address. */
export type NoteSegment = { text: string; href?: string };

/**
 * Split an illustrator's note into plain text and references to other drawings, so
 * "See note for #11 (Greater Flamingo)" can link to `#birds/011` (docs/DESIGN.md §3:
 * a reference to another drawing is a link to it). Ids are padded to the
 * collection's id length, so "#11" and "#011" reach the same drawing.
 */
export function noteSegments(note: string, collectionId: string, idLength: number): NoteSegment[] {
  const segments: NoteSegment[] = [];
  let last = 0;
  for (const m of note.matchAll(/#(\d+)/g)) {
    if (m.index > last) segments.push({ text: note.slice(last, m.index) });
    segments.push({ text: m[0], href: `#${collectionId}/${m[1].padStart(idLength, '0')}` });
    last = m.index + m[0].length;
  }
  if (last < note.length) segments.push({ text: note.slice(last) });
  return segments;
}
