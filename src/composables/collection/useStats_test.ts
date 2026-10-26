import { afterEach, test } from 'vitest';
import { assertEquals } from '@std/assert';
import { useStats } from './useStats.ts';
import type { Stats } from '../../types/index.ts';

const STATS: Stats = { drawn: 1, total: 2, collections: [], first: null, newest: [] };

const original = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = original;
});
/** fetch answers with each response in turn (a number is an HTTP error); returns the urls asked. */
function answer(...responses: (Stats | number | string)[]): string[] {
  const urls: string[] = [];
  globalThis.fetch = ((input: string) => {
    urls.push(String(input));
    const next = responses.shift();
    if (typeof next === 'string') return Promise.reject(next);
    if (typeof next === 'number') return Promise.resolve(new Response('', { status: next }));
    return Promise.resolve(new Response(JSON.stringify(next)));
  }) as typeof fetch;
  return urls;
}

test('useStats: loads stats.json from the base once, however often a page asks', async () => {
  const urls = answer(STATS);
  const s = useStats();
  assertEquals([s.stats.value, s.error.value], [null, '']);
  await Promise.all([s.load(), s.load()]); // a second ask while loading fetches nothing
  await s.load(); // nor does one after it has loaded
  assertEquals(urls, ['/stats.json']);
  assertEquals([s.stats.value, s.error.value], [STATS, '']);
});

test('useStats: an error is kept as words; loading again clears it and tries again', async () => {
  const urls = answer(500, 'offline', STATS);
  const s = useStats('/base/stats.json');
  await s.load();
  assertEquals([s.stats.value, s.error.value], [null, 'HTTP 500 loading stats.json']);
  await s.load();
  assertEquals(s.error.value, 'offline'); // a thrown non-Error, as it is
  const again = s.load();
  assertEquals(s.error.value, ''); // cleared while it tries
  await again;
  assertEquals([s.stats.value, urls], [STATS, [
    '/base/stats.json',
    '/base/stats.json',
    '/base/stats.json',
  ]]);
});
