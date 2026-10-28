import { test } from 'vitest';
import { assertEquals, assertRejects } from '@std/assert';
import { fetchJson } from './fetchJson.ts';
import { fakeFetch, json, status } from '../testing/fakes/fakeFetch.ts';

/** A check that finds nothing wrong. */
const anything = () => [];

test('the parsed file, from the url it was given', async () => {
  using fetch = fakeFetch({ '/base/stats.json': json({ drawn: 3 }) });
  assertEquals(
    await fetchJson<{ drawn: number }>('/base/stats.json', 'stats.json', anything),
    { drawn: 3 },
  );
  assertEquals(fetch.calls, ['/base/stats.json']);
});

test('an HTTP error says its status and what was loading', async () => {
  using _fetch = fakeFetch({ '/x.json': status(404) });
  await assertRejects(
    () => fetchJson('/x.json', 'Birds', anything),
    Error,
    'HTTP 404 loading Birds',
  );
});

test('a page that is not JSON (an HTML fallback) says so', async () => {
  using _fetch = fakeFetch({ '/x.json': new Response('<!DOCTYPE html>') });
  await assertRejects(
    () => fetchJson('/x.json', 'stats.json', anything),
    Error,
    'stats.json is not valid JSON',
  );
});

test('a file not of its shape names the first problem, and how many more there are', async () => {
  using _fetch = fakeFetch({ '/x.json': json({}) });
  await assertRejects(
    () => fetchJson('/x.json', 'Birds', () => ['Ducks[1].name is missing']),
    Error,
    'Birds is not as expected: Ducks[1].name is missing',
  );
  await assertRejects(
    () => fetchJson('/x.json', 'Birds', () => ['a', 'b', 'c']),
    Error,
    'Birds is not as expected: a (and 2 more)',
  );
});
