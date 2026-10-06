/// <reference lib="deno.ns" />
import { assertEquals } from '@std/assert';
import { scanCollection, toIds } from './scan.ts';

Deno.test('toIds strips .png/.webp (case-insensitive) to bare ids', () => {
  assertEquals(
    [...toIds(['001.png', '002.webp', '003.PNG', '004.WEBP'])].sort(),
    ['001', '002', '003', '004'],
  );
});

Deno.test('toIds dedupes ids shared across extensions', () => {
  assertEquals([...toIds(['001.png', '001.webp'])], ['001']);
});

Deno.test('scanCollection reads the drawn ids and the three image folders', async () => {
  const dir = await Deno.makeTempDir({ prefix: 'bird_dash_scan_' });
  try {
    const paths = {
      json: `${dir}/list.json`,
      raw: `${dir}/raw/`,
      full: `${dir}/full/`,
      thumb: `${dir}/thumb/`, // never created: a missing folder counts as empty
      placeholder: '',
      placeholderDark: '',
    };
    await Deno.writeTextFile(
      paths.json,
      JSON.stringify({
        Ducks: [{ id: '001', name: 'A', drawn: '2025-01-01' }, { id: '002', name: 'B' }],
        Geese: [{ id: '003', name: 'C', drawn: '2025-02-01' }],
      }),
    );
    await Deno.mkdir(paths.raw);
    await Deno.mkdir(paths.full);
    for (const f of ['001.png', '004.png', 'notes.txt']) {
      await Deno.writeTextFile(paths.raw + f, '');
    }
    for (const f of ['001.webp', '001.png']) await Deno.writeTextFile(paths.full + f, '');

    const state = await scanCollection({ id: 'x', label: 'X', emoji: '', paths });
    assertEquals([...state.drawnIds].sort(), ['001', '003']); // 002 has no date
    assertEquals([...state.rawIds].sort(), ['001', '004']); // only .png
    assertEquals([...state.fullIds], ['001']); // only .webp
    assertEquals([...state.thumbIds], []);
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
});
