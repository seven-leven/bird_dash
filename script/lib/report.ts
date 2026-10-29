// The frame the commands' reports share, so `check` and `ingest` print alike.
import { COLLECTIONS } from './collections.ts';

/** Wide enough for the longest collection id, so the collections' lines line up. */
export const ID_WIDTH = Math.max(...COLLECTIONS.map((collection) => collection.id.length));

/** The rule above and below a report. */
export const DIVIDER = '─'.repeat(52);
