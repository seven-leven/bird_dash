/// <reference lib="deno.ns" />
import { assertEquals } from '@std/assert';
import { useCollections } from './useCollections.ts';

type Route = () => Response | Promise<Response>;

/** Replace `fetch` with a router keyed by URL path; returns a call counter + restore. */
function stubFetch(routes: Record<string, Route>) {
  const original = globalThis.fetch;
  const calls: string[] = [];
  globalThis.fetch = ((input: string | URL | Request) => {
    const url = String(input instanceof Request ? input.url : input);
    calls.push(url);
    const route = routes[url];
    return Promise.resolve(route ? route() : new Response('not found', { status: 404 }));
  }) as typeof fetch;
  return { calls, restore: () => (globalThis.fetch = original) };
}

const json = (body: unknown) => new Response(JSON.stringify(body));

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
const tick = () => new Promise((r) => setTimeout(r, 0));

Deno.test('init: an HTTP error sets initError instead of hanging or throwing', async () => {
  const { restore } = stubFetch({}); // everything 404s
  try {
    const c = useCollections();
    await c.init();
    assertEquals(c.isInitialized.value, false);
    assertEquals(c.initError.value, 'HTTP 404 loading collections');
  } finally {
    restore();
  }
});

Deno.test('init: a non-JSON response (e.g. an SPA fallback page) gets a readable message', async () => {
  const { restore } = stubFetch({ '/collections.json': () => new Response('<!DOCTYPE html>') });
  try {
    const c = useCollections();
    await c.init();
    assertEquals(c.isInitialized.value, false);
    assertEquals(c.initError.value, 'collections.json is missing or not valid JSON');
  } finally {
    restore();
  }
});

Deno.test('init: an empty collection list is reported, not silently ignored', async () => {
  const { restore } = stubFetch({ '/collections.json': () => json([]) });
  try {
    const c = useCollections();
    await c.init();
    assertEquals(c.isInitialized.value, false);
    assertEquals(c.initError.value, 'No collections are configured');
  } finally {
    restore();
  }
});

Deno.test('init: loads the first collection and clears any previous error', async () => {
  const { restore } = stubFetch({
    '/collections.json': () => json([col('a'), col('b')]),
    '/lists/a.json': () => json(list('a')),
    '/lists/b.json': () => json(list('b')),
  });
  try {
    const c = useCollections();
    await c.init();
    assertEquals(c.isInitialized.value, true);
    assertEquals(c.initError.value, undefined);
    assertEquals(names(c.data.items), ['item of a']);
    assertEquals(c.data.loading, false);
  } finally {
    restore();
  }
});

Deno.test('a slow load for a collection the user left cannot overwrite the screen or the cache', async () => {
  const slowB = deferred<Response>();
  const { restore } = stubFetch({
    '/collections.json': () => json([col('a'), col('b'), col('c')]),
    '/lists/a.json': () => json(list('a')),
    '/lists/b.json': () => slowB.promise,
    '/lists/c.json': () => json(list('c')),
  });
  try {
    const c = useCollections();
    await c.init(); // a is shown; b (slow) and c (fast) are prefetching
    await tick(); // let c land in the cache

    const toB = c.switchCollection('b'); // b is still in flight
    await c.switchCollection('c'); // user moves on to c before b returns
    assertEquals(names(c.data.items), ['item of c']);

    slowB.resolve(json(list('b')));
    await toB;
    await tick();

    // Screen still shows c; b's late response did not clobber it...
    assertEquals(names(c.data.items), ['item of c']);
    assertEquals(c.data.loading, false);
    assertEquals(c.data.error, undefined);
    // ...and each cache slot holds its own collection's items.
    assertEquals(names(c.collectionCache['c']), ['item of c']);
    assertEquals(names(c.collectionCache['b']), ['item of b']);
  } finally {
    restore();
  }
});

Deno.test('a failed load for a collection the user left does not show an error', async () => {
  const slowB = deferred<Response>();
  const { restore } = stubFetch({
    '/collections.json': () => json([col('a'), col('b')]),
    '/lists/a.json': () => json(list('a')),
    '/lists/b.json': () => slowB.promise,
  });
  try {
    const c = useCollections();
    await c.init();
    const toB = c.switchCollection('b');
    await c.switchCollection('a'); // back to the cached collection
    slowB.resolve(new Response('boom', { status: 500 }));
    await toB;
    assertEquals(c.data.error, undefined);
    assertEquals(names(c.data.items), ['item of a']);
  } finally {
    restore();
  }
});

Deno.test('prefetch and an explicit switch share one request per collection', async () => {
  const slowB = deferred<Response>();
  const { calls, restore } = stubFetch({
    '/collections.json': () => json([col('a'), col('b')]),
    '/lists/a.json': () => json(list('a')),
    '/lists/b.json': () => slowB.promise,
  });
  try {
    const c = useCollections();
    await c.init(); // prefetch of b starts
    const toB = c.switchCollection('b'); // must reuse it, not fetch again
    slowB.resolve(json(list('b')));
    await toB;
    assertEquals(calls.filter((u) => u === '/lists/b.json').length, 1);
    assertEquals(names(c.data.items), ['item of b']);
  } finally {
    restore();
  }
});

Deno.test('switching to an unknown collection id is a no-op', async () => {
  const { restore } = stubFetch({
    '/collections.json': () => json([col('a')]),
    '/lists/a.json': () => json(list('a')),
  });
  try {
    const c = useCollections();
    await c.init();
    await c.switchCollection('nope');
    assertEquals(c.activeCollection.value?.id, 'a');
    assertEquals(names(c.data.items), ['item of a']);
  } finally {
    restore();
  }
});

Deno.test('a collection whose list fails to load shows the error, and loading stops', async () => {
  const { restore } = stubFetch({
    '/collections.json': () => json([col('a'), col('b')]),
    '/lists/a.json': () => json(list('a')),
    '/lists/b.json': () => new Response('gone', { status: 404 }),
  });
  try {
    const c = useCollections();
    await c.init();
    await c.switchCollection('b');
    assertEquals(c.data.error, 'HTTP 404 loading B');
    assertEquals(c.data.loading, false);

    await c.switchCollection('a'); // going back to a good collection clears it
    assertEquals(c.data.error, undefined);
    assertEquals(names(c.data.items), ['item of a']);
  } finally {
    restore();
  }
});

Deno.test('globalStats counts drawn and total across every loaded collection', async () => {
  const { restore } = stubFetch({
    '/collections.json': () => json([col('a'), col('b')]),
    '/lists/a.json': () =>
      json({ G: [{ id: '001', name: 'x', drawn: '2025-01-01' }, { id: '002', name: 'y' }] }),
    '/lists/b.json': () => json({ G: [{ id: '001', name: 'z' }] }),
  });
  try {
    const c = useCollections();
    await c.init();
    await tick(); // let the background prefetch of b land
    assertEquals(c.globalStats.value, { drawn: 1, total: 3 });
  } finally {
    restore();
  }
});

Deno.test('link templates from collections.json become functions of the item', async () => {
  const { restore } = stubFetch({
    '/collections.json': () =>
      json([{
        ...col('a'),
        links: [{ label: 'Wiki', color: 'bg-x', url: 'https://w.test/?q={{common}}' }],
      }]),
    '/lists/a.json': () => json(list('a')),
  });
  try {
    const c = useCollections();
    await c.init();
    const link = c.activeCollection.value!.links[0];
    assertEquals(link.url(c.data.items[0]), 'https://w.test/?q=item%20of%20a');
    assertEquals(c.activeCollection.value!.dataUrl, '/lists/a.json');
  } finally {
    restore();
  }
});
