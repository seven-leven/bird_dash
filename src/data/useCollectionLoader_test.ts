// Keeps: failures (docs/TESTING.md, "Promises").
import { test } from 'vitest';
import { assertEquals } from '@std/assert';
import { useCollectionLoader } from './useCollectionLoader.ts';
import { fails, fakeFetch, json, status } from '../testing/fakes/fakeFetch.ts';
import { settle } from '../testing/settle.ts';

function deferred<T>() {
  let resolve!: (v: T) => void;
  const promise = new Promise<T>((r) => (resolve = r));
  return { promise, resolve };
}

const col = (id: string) => ({
  id,
  label: id.toUpperCase(),
  emoji: '🐦',
  groupLabel: 'Group',
  itemLabel: 'item',
  links: [],
});

/** A one-item list whose common name says which collection it belongs to. */
const list = (id: string) => ({
  G: [{ id: '001', name: `item of ${id}`, sci: 'x', drawn: '2025-01-15' }],
});

const names = (items: { commonName: string }[]) => items.map((i) => i.commonName);

test('an HTTP error at start sets initError instead of hanging or throwing', async () => {
  using _fetch = fakeFetch({}); // everything 404s
  const c = useCollectionLoader();
  await c.init();
  assertEquals(c.isInitialized.value, false);
  assertEquals(c.initError.value, 'HTTP 404 loading collections.json');
});

test('a response at start that is not JSON (a fallback page) gets a readable message', async () => {
  using _fetch = fakeFetch({ '/collections.json': new Response('<!DOCTYPE html>') });
  const c = useCollectionLoader();
  await c.init();
  assertEquals(c.isInitialized.value, false);
  assertEquals(c.initError.value, 'collections.json is not valid JSON');
});

test('an empty list of collections at start is reported, not ignored', async () => {
  using _fetch = fakeFetch({ '/collections.json': json([]) });
  const c = useCollectionLoader();
  await c.init();
  assertEquals(c.isInitialized.value, false);
  assertEquals(c.initError.value, 'No collections are configured');
});

test('starting loads the first collection and clears any earlier error', async () => {
  using _fetch = fakeFetch({
    '/collections.json': json([col('a'), col('b')]),
    '/lists/a.json': json(list('a')),
    '/lists/b.json': json(list('b')),
  });
  const c = useCollectionLoader();
  await c.init();
  assertEquals(c.isInitialized.value, true);
  assertEquals(c.initError.value, undefined);
  assertEquals(names(c.loadState.items), ['item of a']);
  assertEquals(c.loadState.loading, false);
});

test('a slow load for a collection the user left cannot overwrite the screen or the cache', async () => {
  const slowB = deferred<Response>();
  using _fetch = fakeFetch({
    '/collections.json': json([col('a'), col('b'), col('c')]),
    '/lists/a.json': json(list('a')),
    '/lists/b.json': slowB.promise,
    '/lists/c.json': json(list('c')),
  });
  const c = useCollectionLoader();
  await c.init(); // a is shown; b (slow) and c (fast) are prefetching
  await settle(); // let c land in the cache

  const toB = c.selectCollection('b'); // b is still in flight
  await c.selectCollection('c'); // user moves on to c before b returns
  assertEquals(names(c.loadState.items), ['item of c']);

  slowB.resolve(json(list('b')));
  await toB;
  await settle();

  // Screen still shows c; b's late response did not clobber it...
  assertEquals(names(c.loadState.items), ['item of c']);
  assertEquals(c.loadState.loading, false);
  assertEquals(c.loadState.error, undefined);
  // ...and each cache slot holds its own collection's items.
  assertEquals(names(c.itemsByCollection['c']!), ['item of c']);
  assertEquals(names(c.itemsByCollection['b']!), ['item of b']);
});

test('a failed load for a collection the user left does not show an error', async () => {
  const slowB = deferred<Response>();
  using _fetch = fakeFetch({
    '/collections.json': json([col('a'), col('b')]),
    '/lists/a.json': json(list('a')),
    '/lists/b.json': slowB.promise,
  });
  const c = useCollectionLoader();
  await c.init();
  const toB = c.selectCollection('b');
  await c.selectCollection('a'); // back to the cached collection
  slowB.resolve(new Response('boom', { status: 500 }));
  await toB;
  assertEquals(c.loadState.error, undefined);
  assertEquals(names(c.loadState.items), ['item of a']);
});

test('prefetch and an explicit switch share one request per collection', async () => {
  const slowB = deferred<Response>();
  using fetch = fakeFetch({
    '/collections.json': json([col('a'), col('b')]),
    '/lists/a.json': json(list('a')),
    '/lists/b.json': slowB.promise,
  });
  const c = useCollectionLoader();
  await c.init(); // prefetch of b starts
  const toB = c.selectCollection('b'); // must reuse it, not fetch again
  slowB.resolve(json(list('b')));
  await toB;
  assertEquals(fetch.calls.filter((u) => u === '/lists/b.json').length, 1);
  assertEquals(names(c.loadState.items), ['item of b']);
});

test('switching to an unknown collection id is a no-op', async () => {
  using _fetch = fakeFetch({
    '/collections.json': json([col('a')]),
    '/lists/a.json': json(list('a')),
  });
  const c = useCollectionLoader();
  await c.init();
  await c.selectCollection('nope');
  assertEquals(c.activeCollection.value?.id, 'a');
  assertEquals(names(c.loadState.items), ['item of a']);
});

test('a collection whose list fails to load shows the error, and loading stops', async () => {
  using _fetch = fakeFetch({
    '/collections.json': json([col('a'), col('b')]),
    '/lists/a.json': json(list('a')),
    '/lists/b.json': status(404),
  });
  const c = useCollectionLoader();
  await c.init();
  await c.selectCollection('b');
  assertEquals(c.loadState.error, 'HTTP 404 loading B');
  assertEquals(c.loadState.loading, false);

  await c.selectCollection('a'); // going back to a good collection clears it
  assertEquals(c.loadState.error, undefined);
  assertEquals(names(c.loadState.items), ['item of a']);
});

test('globalStats counts drawn and total across every loaded collection', async () => {
  using _fetch = fakeFetch({
    '/collections.json': json([col('a'), col('b')]),
    '/lists/a.json': json({
      G: [{ id: '001', name: 'x', drawn: '2025-01-01' }, { id: '002', name: 'y' }],
    }),
    '/lists/b.json': json({ G: [{ id: '001', name: 'z' }] }),
  });
  const c = useCollectionLoader();
  await c.init();
  await settle(); // let the background prefetch of b land
  assertEquals(c.archiveCounts.value, { drawn: 1, total: 3 });
});

test('link templates from collections.json become functions of the item', async () => {
  using _fetch = fakeFetch({
    '/collections.json': json([{
      ...col('a'),
      links: [{ label: 'Wiki', url: 'https://w.test/?q={{common}}' }],
    }]),
    '/lists/a.json': json(list('a')),
  });
  const c = useCollectionLoader();
  await c.init();
  const link = c.activeCollection.value!.links[0];
  assertEquals(link!.url(c.loadState.items[0]!), 'https://w.test/?q=item%20of%20a');
  assertEquals(c.activeCollection.value!.dataUrl, '/lists/a.json');
});

test('before init there is no active collection', () => {
  assertEquals(useCollectionLoader().activeCollection.value, undefined);
});

test('switching to the collection already shown does not reload it', async () => {
  using fetch = fakeFetch({
    '/collections.json': json([col('a')]),
    '/lists/a.json': json(list('a')),
  });
  const c = useCollectionLoader();
  await c.init();
  const before = fetch.calls.length;
  await c.selectCollection('a');
  assertEquals(fetch.calls.length, before);
});

test('a request that fails with a non-Error value still gives a readable message', async () => {
  using _fetch = fakeFetch({ '/collections.json': fails('offline') });
  const c = useCollectionLoader();
  await c.init();
  assertEquals(c.initError.value, 'offline');
});

test('a list that fails with a non-Error value shows that value as the error', async () => {
  using _fetch = fakeFetch({
    '/collections.json': json([col('a')]),
    '/lists/a.json': fails('list unavailable'),
  });
  const c = useCollectionLoader();
  await c.init();
  assertEquals(c.loadState.error, 'list unavailable');
  assertEquals(c.loadState.loading, false);
});

test('globalStats counts a collection whose list has not arrived as empty', async () => {
  const pending = deferred<Response>();
  using _fetch = fakeFetch({
    '/collections.json': json([col('a'), col('b')]),
    '/lists/a.json': json(list('a')),
    '/lists/b.json': pending.promise, // never answers during the test
  });
  const c = useCollectionLoader();
  await c.init();
  assertEquals(c.archiveCounts.value, { drawn: 1, total: 1 });
});

test('init again (a retry) reuses the lists already loaded', async () => {
  using fetch = fakeFetch({
    '/collections.json': json([col('a')]),
    '/lists/a.json': json(list('a')),
  });
  const c = useCollectionLoader();
  await c.init();
  await c.init();
  assertEquals(fetch.calls.filter((u) => u === '/lists/a.json').length, 1);
  assertEquals(names(c.loadState.items), ['item of a']);
});
