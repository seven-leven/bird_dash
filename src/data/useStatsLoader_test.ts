import { test } from 'vitest';
import { assertEquals } from '@std/assert';
import { useStatsLoader } from './useStatsLoader.ts';
import type { Stats } from './files.ts';
import { fails, fakeFetch, inTurn, json, status } from '../testing/fakes/fakeFetch.ts';

const STATS: Stats = { drawn: 1, total: 2, collections: [], first: null, newest: [] };

test('loads stats.json from the base once, however often a page asks', async () => {
  using fetch = fakeFetch({ '/stats.json': json(STATS) });
  const s = useStatsLoader();
  assertEquals([s.stats.value, s.error.value], [null, '']);
  await Promise.all([s.load(), s.load()]); // a second ask while loading fetches nothing
  await s.load(); // nor does one after it has loaded
  assertEquals(fetch.calls, ['/stats.json']);
  assertEquals([s.stats.value, s.error.value], [STATS, '']);
});

test('an error is kept as words; loading again clears it and tries again', async () => {
  using fetch = fakeFetch({
    '/base/stats.json': inTurn(status(500), fails('offline'), json(STATS)),
  });
  const s = useStatsLoader('/base/stats.json');
  await s.load();
  assertEquals([s.stats.value, s.error.value], [null, 'HTTP 500 loading stats.json']);
  await s.load();
  assertEquals(s.error.value, 'offline'); // a thrown non-Error, as it is
  const again = s.load();
  assertEquals(s.error.value, ''); // cleared while it tries
  await again;
  assertEquals([s.stats.value, fetch.calls.length], [STATS, 3]);
});
