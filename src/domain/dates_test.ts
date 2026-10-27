import { test } from 'vitest';
import { assertEquals } from '@std/assert';
import { dayName, monthName, parseDay } from './dates.ts';

test('a month is named by UTC, so a date on the 1st never slips back a month', () => {
  // `YYYY-MM-DD` parses as UTC midnight; a local-time month would report
  // September for this instant anywhere west of UTC.
  assertEquals(monthName(new Date('2025-10-01')), 'October 2025');
  assertEquals(monthName(new Date('2025-01-01')), 'January 2025');
  assertEquals(monthName(new Date('2025-12-31')), 'December 2025');
});

test("a month is named in English whatever the visitor's language", () => {
  // A browser set to German: any date formatted without a language comes out in German.
  const original = Date.prototype.toLocaleString;
  Date.prototype.toLocaleString = function (
    this: Date,
    locales?: Intl.LocalesArgument,
    options?: Intl.DateTimeFormatOptions,
  ) {
    return original.call(
      this,
      locales === undefined || locales === 'default' ? 'de' : locales,
      options,
    );
  };
  try {
    assertEquals(
      new Date('2025-10-01').toLocaleString('default', { month: 'long', timeZone: 'UTC' }),
      'Oktober',
    );
    assertEquals(monthName(new Date('2025-10-01')), 'October 2025');
  } finally {
    Date.prototype.toLocaleString = original;
  }
});

test('a list date is read as UTC midnight, and named as a day', () => {
  assertEquals(parseDay('2025-10-01').toISOString(), '2025-10-01T00:00:00.000Z');
  assertEquals(dayName(parseDay('2025-10-05')), '5 October 2025');
});
