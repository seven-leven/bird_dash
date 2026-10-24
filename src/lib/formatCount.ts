// The one place counts are worded, so the sidebar, section headers, progress
// bar, viewer and footer all say the same thing the same way.

/** "1 result", "3 results". */
export const plural = (n: number, noun: string): string => `${n} ${noun}${n === 1 ? '' : 's'}`;

/** "18 drawings". */
export const drawings = (n: number): string => plural(n, 'drawing');

/** "3 of 12" — a position or a share, where the context already says of what. */
export const ratio = (part: number, total: number): string => `${part} of ${total}`;

/** "1 match", "10 matches". */
export const matches = (n: number): string => `${n} ${n === 1 ? 'match' : 'matches'}`;

/** The search dropdown's summary: "10 matches, 1 drawn" (docs/DESIGN.md §10). */
export const matchesDrawn = (n: number, drawn: number): string => `${matches(n)}, ${drawn} drawn`;

/** "15 of 204 drawn". */
export const drawnOf = (drawn: number, total: number): string => `${ratio(drawn, total)} drawn`;
