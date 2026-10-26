import { test } from 'vitest';
import { assert } from '@std/assert';
import { existsSync } from 'node:fs';
import { realIo } from './io.ts';
import { PATHS } from './paths.ts';
import { COLLECTIONS } from './collections.ts';

// PATHS against this repository: a path that moved without PATHS fails here first.

test('every fixed path in PATHS exists in this repository', () => {
  for (const [name, path] of Object.entries(PATHS)) {
    if (typeof path === 'string') assert(existsSync(path), `PATHS.${name}: ${path} is missing`);
  }
});

test("each collection's list and placeholders are where PATHS says", async () => {
  for (const { id } of COLLECTIONS) {
    await realIo.readText(PATHS.list(id));
    const placeholders = await realIo.listFiles(PATHS.placeholders);
    for (const theme of ['light', 'dark'] as const) {
      assert(
        placeholders.includes(PATHS.placeholder(id, theme).split('/').at(-1)!),
        `${id} ${theme}`,
      );
    }
  }
});
