import { test } from 'vitest';
import { readFile } from 'node:fs/promises';
import { assert, assertEquals } from '@std/assert';
import { findFiles } from '../../script/testRunner/tiers.ts';

// docs/ARCHITECTURE.md, rule 3: `domain/` is plain TypeScript, the archive's rules and nothing
// else. It imports only from itself, and types alone from two places: the shapes of the files it
// turns into items (`data/files.ts`), and `types/` until the site overhaul's phase 8 removes it.
// It touches no browser, network or clock, so every rule in it can be tested with a value in and
// a value out.

/** What `domain/` may import types (and only types) from, outside itself. */
const TYPES_FROM = ['../data/files.ts', '../types/'];

const sources = async () =>
  (await findFiles(['src/domain'], '*.ts')).filter((path) => !path.endsWith('_test.ts'));

/** Every import a file makes: where from, and whether it brings in types alone. */
const importsOf = (code: string) =>
  [...code.matchAll(/(import type|import|export)[^'"]*from\s*'([^']+)'/g)].map((m) => ({
    from: m[2],
    typesOnly: m[1] === 'import type',
  }));

test('domain/ imports only from itself, and the types it is given', async () => {
  const files = await sources();
  assert(files.length >= 10, `found only ${files.length} domain modules`);
  for (const file of files) {
    const code = await readFile(file, 'utf8');
    const outside = importsOf(code).filter(({ from, typesOnly }) =>
      !from.startsWith('./') &&
      !(typesOnly && TYPES_FROM.some((allowed) => from.startsWith(allowed)))
    );
    assertEquals(outside.map(({ from }) => from), [], `${file} reaches outside domain/`);
  }
});

test('domain/ touches no browser, network or clock', async () => {
  // Comments may name them ("JS parses this as UTC midnight"); code may not use them.
  const code = (text: string) => text.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '');
  const forbidden =
    /\b(document|window|globalThis|localStorage|sessionStorage|navigator|location|fetch)\b|Date\.now\(|new Date\(\)/;
  for (const file of await sources()) {
    const found = code(await readFile(file, 'utf8')).match(forbidden);
    assertEquals(found?.[0], undefined, `${file} uses ${found?.[0]}`);
  }
});
