import { test } from 'vitest';
import { glob, readFile } from 'node:fs/promises';
import { assertEquals } from '@std/assert';

// docs/TESTING.md, rule 4: one way to fake each outside thing, from the kit in src/testing/.
// A test that swaps a global by hand can forget to put it back, and every file did it its own
// way; the kit's fakes put it back when their `using` block ends.

const HAND_MADE = [
  {
    what: 'fetch swapped by hand (use fakeFetch)',
    pattern: /\b(?:globalThis|window|self)\.fetch\s*=[^=]/,
  },
  { what: 'the console swapped by hand (use captureConsole)', pattern: /\bconsole\.\w+\s*=[^=]/ },
  { what: 'the console spied on (use captureConsole)', pattern: /spyOn\(console\b/ },
  { what: 'a temporary folder made by hand (use tempDir)', pattern: /\bmkdtemp\(/ },
];

test('no test fakes the outside world by hand; the kit in src/testing/ does', async () => {
  const found: string[] = [];
  for await (const file of glob(['src/**/*_test.ts', 'script/**/*_test.ts'])) {
    const path = file.replaceAll('\\', '/');
    if (path.startsWith('src/testing/')) continue; // the kit, and this test, which names them
    const source = await readFile(file, 'utf8');
    for (const { what, pattern } of HAND_MADE) {
      if (pattern.test(source)) found.push(`${path}: ${what}`);
    }
  }
  assertEquals(found, []);
});
