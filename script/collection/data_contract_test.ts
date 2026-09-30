/// <reference lib="deno.ns" />
import { assert, assertEquals } from '@std/assert';
import { COLLECTIONS } from './registry.ts';
import { loadCollectionData } from './record.ts';
import { readJson } from '../lib/fs.ts';

// The app is data-driven: a typo in public/*.json silently breaks routing, search
// or the timeline rather than failing a build. These tests are that missing gate.

const exists = (path: string) => Deno.stat(path).then(() => true, () => false);

Deno.test('collections.json: at least one collection, unique ids', () => {
  assert(COLLECTIONS.length > 0, 'no collections configured');
  const ids = COLLECTIONS.map((c) => c.id);
  assertEquals(new Set(ids).size, ids.length, `duplicate collection ids: ${ids}`);
});

Deno.test('collections.json: link templates only use known placeholders', async () => {
  type Raw = { id: string; links: { label: string; url: string }[] };
  const raw = await readJson<Raw[]>('./public/collections.json');
  for (const col of raw) {
    for (const link of col.links) {
      assert(link.label.trim(), `${col.id}: link without a label`);
      assert(/^https?:\/\//.test(link.url), `${col.id}/${link.label}: url must be http(s)`);
      const unknown = [...link.url.matchAll(/{{(\w+)}}/g)].map((m) => m[1])
        .filter((p) => p !== 'common' && p !== 'sci');
      assertEquals(unknown, [], `${col.id}/${link.label}: unknown placeholder(s)`);
    }
  }
});

for (const col of COLLECTIONS) {
  Deno.test(`${col.id}: list file has the files the app expects`, async () => {
    assert(await exists(col.paths.json), `missing ${col.paths.json}`);
    assert(await exists(col.paths.placeholder), `missing ${col.paths.placeholder}`);
  });

  Deno.test(`${col.id}: items have unique numeric ids, names, and valid drawn dates`, async () => {
    const data = await loadCollectionData(col);
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
