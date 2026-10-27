import { test } from 'vitest';
import { assertEquals } from '@std/assert';
import { scanSources, toIds } from './scanSources.ts';
import { fakeIo } from '../lib/fakeIo.ts';
import { makeScriptCollection } from '../../src/testing/scriptFixtures.ts';

test('file names become bare ids, whatever the case of the extension', () => {
  assertEquals(
    [...toIds(['001.png', '002.webp', '003.PNG', '004.WEBP'])].sort(),
    ['001', '002', '003', '004'],
  );
  assertEquals([...toIds(['001.png', '001.webp'])], ['001']);
});

test('a scan reads the drawn ids and the three image folders, each for its own kind of file', async () => {
  const birds = makeScriptCollection('birds', {
    paths: { json: './lists/birds.json', sourceArt: './raw/', full: './full/', thumb: './thumb/' },
  });
  const io = fakeIo({
    files: {
      './lists/birds.json': JSON.stringify({
        Ducks: [{ id: '001', name: 'A', drawn: '2025-01-01' }, { id: '002', name: 'B' }],
        Geese: [{ id: '003', name: 'C', drawn: '2025-02-01' }],
      }),
      './raw/001.png': '',
      './raw/004.png': '',
      './raw/notes.txt': '',
      './full/001.webp': '',
      './full/001.png': '',
      // no thumbnails: a missing folder counts as empty
    },
  });
  const scan = await scanSources(birds, io);
  assertEquals([...scan.drawnIds].sort(), ['001', '003']); // 002 has no date
  assertEquals([...scan.sourceIds].sort(), ['001', '004']); // only .png
  assertEquals([...scan.fullIds], ['001']); // only .webp
  assertEquals([...scan.thumbIds], []);
});
