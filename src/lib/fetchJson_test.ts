import { test } from 'vitest';
import { assertEquals, assertRejects } from '@std/assert';
import { fetchJson } from './fetchJson.ts';
import { fakeFetch, json, status } from '../testing/fakes/fakeFetch.ts';

test('the parsed file, from the url it was given', async () => {
  using fetch = fakeFetch({ '/base/stats.json': json({ drawn: 3 }) });
  assertEquals(await fetchJson<{ drawn: number }>('/base/stats.json', 'stats.json'), { drawn: 3 });
  assertEquals(fetch.calls, ['/base/stats.json']);
});

test('an HTTP error says its status and what was loading', async () => {
  using _fetch = fakeFetch({ '/x.json': status(404) });
  await assertRejects(() => fetchJson('/x.json', 'Birds'), Error, 'HTTP 404 loading Birds');
});

test('a page that is not JSON (an HTML fallback) says so', async () => {
  using _fetch = fakeFetch({ '/x.json': new Response('<!DOCTYPE html>') });
  await assertRejects(
    () => fetchJson('/x.json', 'stats.json'),
    Error,
    'stats.json is not valid JSON',
  );
});
