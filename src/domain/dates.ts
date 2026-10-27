// Dates in the lists are `YYYY-MM-DD`, which JS parses as UTC midnight. Every date the site shows
// is read in UTC, so a drawing dated the 1st never slips into the month before for a visitor west
// of UTC, and named in English, whatever the visitor's language.

/** A list's `YYYY-MM-DD` as the instant it names: UTC midnight. */
export const parseDay = (iso: string): Date => new Date(`${iso}T00:00:00Z`);

/** "October 2025": the month a date falls in, by UTC. */
export const monthName = (date: Date): string =>
  `${date.toLocaleString('en', { month: 'long', timeZone: 'UTC' })} ${date.getUTCFullYear()}`;

/** "5 October 2025". */
export const dayName = (date: Date): string => `${date.getUTCDate()} ${monthName(date)}`;
