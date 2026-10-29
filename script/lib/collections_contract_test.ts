// Keeps: build (docs/TESTING.md, "Promises").
import { test } from 'vitest';
import { readFile, stat } from 'node:fs/promises';
import { assert, assertEquals } from '@std/assert';
import { COLLECTIONS } from './collections.ts';
import { readList } from './lists.ts';
import { readJson, realIo } from './io.ts';
import type { CollectionEntry } from '../../src/data/files.ts';
import { isIconName } from '../../src/ui/icons.ts';
import { PAGES } from '../../src/app/pages.ts';
import { checkCollections, checkList, checkStats } from '../../src/data/files.ts';

// The app is data-driven: a typo in public/*.json silently breaks routing, search
// or the timeline rather than failing a build. These tests are that missing gate.

const exists = (path: string) => stat(path).then(() => true, () => false);

test('collections.json, every list and stats.json pass the checks the site makes when it loads them', async () => {
  assertEquals(checkCollections(await readJson(realIo, './public/collections.json')), []);
  for (const col of COLLECTIONS) assertEquals(checkList(await readList(col)), [], col.id);
  assertEquals(checkStats(await readJson(realIo, './public/stats.json')), []);
});

test('collections.json: at least one collection, unique ids', () => {
  assert(COLLECTIONS.length > 0, 'no collections configured');
  const ids = COLLECTIONS.map((c) => c.id);
  assertEquals(new Set(ids).size, ids.length, `duplicate collection ids: ${ids}`);
});

test("collections.json: no collection takes a page's id (#about would show the page)", () => {
  const pages = new Set<string>(PAGES.map((p) => p.id));
  const taken = COLLECTIONS.map((c) => c.id).filter((id) => pages.has(id));
  assertEquals(taken, [], `collection ids that are also pages in src/app/pages.ts: ${taken}`);
});

test('collections.json: every accent names a palette defined in accents.css', async () => {
  const css = await readFile('./src/styles/accents.css', 'utf8');
  const palettes = new Set([...css.matchAll(/\[data-accent='([\w-]+)'\]/g)].map((m) => m[1]));
  assert(palettes.size > 0, 'no [data-accent] palettes found in accents.css');

  const raw = await readJson<CollectionEntry[]>(realIo, './public/collections.json');
  for (const col of raw) {
    if (col.accent === undefined) continue; // falls back to the default
    assert(
      palettes.has(col.accent),
      `${col.id}: accent "${col.accent}" has no palette in accents.css (have: ${[...palettes]})`,
    );
  }
});

test('collections.json: link templates only use known placeholders', async () => {
  const raw = await readJson<CollectionEntry[]>(realIo, './public/collections.json');
  for (const col of raw) {
    // A missing icon falls back to the emoji; a misspelt one would do so silently.
    if (col.icon !== undefined) {
      assert(isIconName(col.icon), `${col.id}: unknown icon "${col.icon}"`);
    }
    for (const link of col.links) {
      assert(link.label.trim(), `${col.id}: link without a label`);
      assert(/^https?:\/\//.test(link.url), `${col.id}/${link.label}: url must be http(s)`);
      const unknown = [...link.url.matchAll(/{{(\w+)}}/g)].map((m) => m[1])
        .filter((p) => p !== 'common' && p !== 'sci');
      assertEquals(unknown, [], `${col.id}/${link.label}: unknown placeholder(s)`);
    }
  }
});

test('collections.json: a medium, where one is named, is words', async () => {
  const raw = await readJson<CollectionEntry[]>(realIo, './public/collections.json');
  for (const col of raw) {
    if (col.medium !== undefined) assert(col.medium.trim(), `${col.id}: an empty medium`);
  }
});

for (const col of COLLECTIONS) {
  test(`${col.id}: list file has the files the app expects`, async () => {
    assert(await exists(col.paths.json), `missing ${col.paths.json}`);
  });

  test(`${col.id}: items have unique numeric ids, names, and valid drawn dates`, async () => {
    const data = await readList(col);
    const seen = new Set<string>();
    const problems: string[] = [];

    for (const [group, items] of Object.entries(data)) {
      if (!group.trim()) problems.push('empty group name');
      // Groups with no items are tolerated on purpose: the app builds groups from
      // items, so an empty one simply never renders.

      for (const item of items) {
        const where = `${group} / ${item.id || '(no id)'}`;
        // ids feed URLs (#col/<id>), DOM ids, and the numeric sort key.
        if (!/^\d+$/.test(item.id ?? '')) problems.push(`${where}: id must be digits`);
        if (seen.has(item.id)) problems.push(`${where}: duplicate id`);
        seen.add(item.id);

        if (!item.name?.trim()) problems.push(`${where}: missing name`);
        if (item.images !== undefined && !(Number.isInteger(item.images) && item.images >= 1)) {
          problems.push(`${where}: images must be a whole number, 1 or more`);
        }

        // '' means "not drawn yet"; anything else must be a real YYYY-MM-DD date.
        const drawn = item.drawn ?? '';
        if (drawn !== '') {
          const valid = /^\d{4}-\d{2}-\d{2}$/.test(drawn) &&
            new Date(drawn).toISOString().startsWith(drawn);
          if (!valid) problems.push(`${where}: drawn "${drawn}" is not a valid YYYY-MM-DD date`);
        }
      }
    }
    assertEquals(problems, [], problems.join('\n'));
  });
}
