import { test } from 'vitest';
import { assert, assertEquals, assertRejects } from '@std/assert';
import { fakeIo } from './fakeIo.ts';
import { readJson, writeJson } from './io.ts';

test('files are kept in memory: read what exists, keep what is written', async () => {
  const io = fakeIo({ files: { './a.json': '{"x":1}' } });
  assertEquals(await readJson(io, './a.json'), { x: 1 });
  await writeJson(io, './b.json', { y: 2 });
  assertEquals(io.files.get('./b.json'), '{\n  "y": 2\n}\n');
  await io.makeDir('./anywhere'); // folders need no making
});

test('a missing file fails as a missing file does', async () => {
  const failed = await fakeIo().readText('./nope.txt').catch((err) => err);
  assertEquals(failed.code, 'ENOENT');
  assert(failed.message.includes("'./nope.txt'"));
});

test('a folder lists its own files only, sorted, through the filter', async () => {
  const io = fakeIo({
    files: { './p/b.png': '', './p/a.png': '', './p/notes.txt': '', './p/sub/c.png': '' },
  });
  assertEquals(await io.listFiles('./p', (name) => name.endsWith('.png')), ['a.png', 'b.png']);
  assertEquals(await io.listFiles('./p/'), ['a.png', 'b.png', 'notes.txt']);
  assertEquals(await io.listFiles('./missing'), []);
});

test('git answers what it was given, and fails like a missing repository otherwise', async () => {
  const io = fakeIo({ git: { 'rev-parse HEAD': 'abc' } });
  assertEquals(await io.git('rev-parse', 'HEAD'), 'abc');
  await assertRejects(() => io.git('log'), Error, 'git log failed: not a git repository');
});

test("the commit count and id are git's answers to the version's two questions", async () => {
  const io = fakeIo({ commits: 310, commit: 'd3c113e', git: { 'rev-parse HEAD': 'full' } });
  assertEquals(await io.git('rev-list', '--count', 'HEAD'), '310');
  assertEquals(await io.git('rev-parse', '--short=7', 'HEAD'), 'd3c113e');
  assertEquals(await io.git('rev-parse', 'HEAD'), 'full'); // the rest are still given as `git`
});

test('the environment, the clock and the console are the test’s', () => {
  const io = fakeIo({ env: { CI: 'true' }, now: new Date(Date.UTC(2025, 5, 1)) });
  assertEquals([io.env('CI'), io.env('HOME')], ['true', undefined]);
  assertEquals(io.now().toISOString(), '2025-06-01T00:00:00.000Z');
  assertEquals(fakeIo().now().toISOString(), '2026-01-01T00:00:00.000Z');
  io.out('done');
  io.err('problem');
  assertEquals([io.outLines, io.errLines], [['done'], ['problem']]);
});

test('a script run is recorded, and exits as it was told to, or 0', async () => {
  const io = fakeIo({ exitCodes: { './tool.js': 2 } });
  assertEquals(await io.runNode('./tool.js', ['build']), 2);
  assertEquals(await io.runNode('./other.js', []), 0);
  assertEquals(io.ran, ['./tool.js build', './other.js']);
});
