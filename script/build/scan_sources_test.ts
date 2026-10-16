import { test } from 'vitest';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { assertEquals } from '@std/assert';
import { scanCollection, toIds } from './scan_sources.ts';

test('toIds strips .png/.webp (case-insensitive) to bare ids', () => {
  assertEquals(
    [...toIds(['001.png', '002.webp', '003.PNG', '004.WEBP'])].sort(),
    ['001', '002', '003', '004'],
  );
});

test('toIds dedupes ids shared across extensions', () => {
  assertEquals([...toIds(['001.png', '001.webp'])], ['001']);
});

test('scanCollection reads the drawn ids and the three image folders', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'bird_dash_scan_'));
  try {
    const paths = {
      json: `${dir}/list.json`,
      raw: `${dir}/raw/`,
      full: `${dir}/full/`,
      thumb: `${dir}/thumb/`, // never created: a missing folder counts as empty
      placeholder: '',
      placeholderDark: '',
    };
    await writeFile(
      paths.json,
      JSON.stringify({
        Ducks: [{ id: '001', name: 'A', drawn: '2025-01-01' }, { id: '002', name: 'B' }],
        Geese: [{ id: '003', name: 'C', drawn: '2025-02-01' }],
      }),
    );
    await mkdir(paths.raw);
    await mkdir(paths.full);
    for (const f of ['001.png', '004.png', 'notes.txt']) {
      await writeFile(paths.raw + f, '');
    }
    for (const f of ['001.webp', '001.png']) await writeFile(paths.full + f, '');

    const state = await scanCollection({ id: 'x', label: 'X', emoji: '', paths });
    assertEquals([...state.drawnIds].sort(), ['001', '003']); // 002 has no date
    assertEquals([...state.rawIds].sort(), ['001', '004']); // only .png
    assertEquals([...state.fullIds], ['001']); // only .webp
    assertEquals([...state.thumbIds], []);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
