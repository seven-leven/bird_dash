import { test } from 'vitest';
import { assert, assertEquals } from '@std/assert';
import { PassThrough } from 'node:stream';
import { styleText } from 'node:util';
import { colorMarks, readJson, realIo, writeJson } from './io.ts';
import { tempDir } from '../../src/testing/fakes/tempDir.ts';
import { captureConsole } from '../../src/testing/fakes/captureConsole.ts';

// The real Io, against a real (temporary) folder and the real console.

test('the real Io reads, writes and lists files on disk', async () => {
  await using dir = await tempDir('io');
  await realIo.makeDir(dir.join('deep', 'er'));
  await writeJson(realIo, dir.join('deep', 'a.json'), { drawn: 3 });
  assertEquals(await readJson(realIo, dir.join('deep', 'a.json')), { drawn: 3 });
  assertEquals(await realIo.readText(dir.join('deep', 'a.json')), '{\n  "drawn": 3\n}\n');
  assertEquals(await realIo.listFiles(dir.join('deep')), ['a.json']);
});

test('the real Io reaches the environment, the clock and the console', () => {
  assertEquals(realIo.env('PATH'), process.env.PATH);
  assert(Math.abs(realIo.now().getTime() - Date.now()) < 5000);
  using printed = captureConsole();
  realIo.out('a');
  realIo.err('b');
  assertEquals(printed.lines, [{ level: 'log', text: 'a' }, { level: 'error', text: 'b' }]);
});

test('the marks are coloured on a terminal and plain anywhere else', () => {
  // Whatever the machine says about colour, this test decides.
  const env = process.env;
  process.env = { ...env, NO_COLOR: undefined, FORCE_COLOR: undefined };
  try {
    const terminal = Object.assign(new PassThrough(), { isTTY: true, getColorDepth: () => 8 });
    const pipe = new PassThrough();
    const line = '✓ done · ✗ 2 issues';
    assertEquals(
      colorMarks(line, terminal as unknown as NodeJS.WriteStream),
      `${styleText('green', '✓', { validateStream: false })} done · ${
        styleText('red', '✗', { validateStream: false })
      } 2 issues`,
    );
    assertEquals(colorMarks(line, pipe as unknown as NodeJS.WriteStream), line);
  } finally {
    process.env = env;
  }
});

test('the real Io runs a script with this Node and gives back its exit code', async () => {
  await using dir = await tempDir('run');
  const script = dir.join('exit.js');
  await realIo.writeText(script, 'process.exit(Number(process.argv[2]));\n');
  assertEquals(await realIo.runNode(script, ['3']), 3);
  assertEquals(await realIo.runNode(script, ['0']), 0);
});
