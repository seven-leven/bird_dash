// Loading a page's component imports Vue's DOM renderer, which needs `document`.
import { test } from 'vitest';
import { assert, assertEquals } from '@std/assert';
import { findPage, PAGES } from './pages.ts';

test('findPage: a page by its id; a collection id is not a page', () => {
  assertEquals(findPage('about')?.label, 'About');
  assertEquals(findPage('birds'), undefined);
  assertEquals(findPage(''), undefined);
});

test('PAGES: unique ids that are hash-safe, each with a label and a component', () => {
  const ids = PAGES.map((p) => p.id);
  assertEquals(new Set(ids).size, ids.length);
  for (const p of PAGES) {
    assert(/^[a-z][a-z0-9-]*$/.test(p.id), `"${p.id}" must be a plain lowercase word for #${p.id}`);
    assert(p.label.trim(), `${p.id}: no label`);
    assert(p.component, `${p.id}: no component`);
  }
});

test("PAGES: each page's component loads (a page is code-split; a wrong path would fail here)", async () => {
  for (const p of PAGES) {
    const load = (p.component as { __asyncLoader?: () => Promise<unknown> }).__asyncLoader;
    assert(load, `${p.id}: not an async component`);
    assert(await load(), `${p.id}: the component did not load`);
  }
});
