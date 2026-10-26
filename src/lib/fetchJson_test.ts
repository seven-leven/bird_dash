import { afterEach, test } from 'vitest';
import { assertEquals, assertRejects } from '@std/assert';
import { fetchJson } from './fetchJson.ts';

const original = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = original;
});
const respond = (res: Response) => {
  const urls: string[] = [];
  globalThis.fetch = ((input: string) => {
    urls.push(String(input));
    return Promise.resolve(res);
  }) as typeof fetch;
  return urls;
};

test('fetchJson: the parsed file, from the url it was given', async () => {
  const urls = respond(new Response('{"drawn":3}'));
  assertEquals(await fetchJson<{ drawn: number }>('/base/stats.json', 'stats.json'), { drawn: 3 });
  assertEquals(urls, ['/base/stats.json']);
});

test('fetchJson: an HTTP error says its status and what was loading', async () => {
  respond(new Response('', { status: 404 }));
  await assertRejects(() => fetchJson('/x.json', 'Birds'), Error, 'HTTP 404 loading Birds');
});

test('fetchJson: a page that is not JSON (an HTML fallback) says so', async () => {
  respond(new Response('<!DOCTYPE html>'));
  await assertRejects(
    () => fetchJson('/x.json', 'stats.json'),
    Error,
    'stats.json is not valid JSON',
  );
});
