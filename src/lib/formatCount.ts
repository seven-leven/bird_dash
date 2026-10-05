// The one place counts are worded, so the sidebar, section headers, progress
// bar, viewer and footer all say the same thing the same way.

/** "1 result", "3 results". */
export const plural = (n: number, noun: string): string => `${n} ${noun}${n === 1 ? '' : 's'}`;

/** "18 drawings". */
export const drawings = (n: number): string => plural(n, 'drawing');

/** "3 of 12" — a position or a share, where the context already says of what. */
export const ratio = (part: number, total: number): string => `${part} of ${total}`;

/** "15 of 204 drawn". */
export const drawnOf = (drawn: number, total: number): string => `${ratio(drawn, total)} drawn`;
