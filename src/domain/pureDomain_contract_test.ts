import { test } from 'vitest';
import { readFile } from 'node:fs/promises';
import { assert, assertEquals } from '@std/assert';
import { findFiles } from '../../script/testRunner/tiers.ts';

// docs/ARCHITECTURE.md, rule 3: `domain/` is plain TypeScript, the archive's rules and nothing
// else. It imports only from itself (and, until the site overhaul's phase 8 removes `types/`,
// types from there); it touches no browser, network or clock, so every rule in it can be tested
// with a value in and a value out.

const sources = async () =>
  (await findFiles(['src/domain'], '*.ts')).filter((path) => !path.endsWith('_test.ts'));

/** Every module specifier a file imports, type-only imports included. */
const importsOf = (code: string) =>
  [...code.matchAll(/(?:import|export)[^'"]*from\s*'([^']+)'/g)].map((m) => m[1]);

test('domain/ imports only from itself, and types from types/ until phase 8', async () => {
  const files = await sources();
  assert(files.length >= 10, `found only ${files.length} domain modules`);
  for (const file of files) {
    const code = await readFile(file, 'utf8');
    const outside = importsOf(code).filter((from) =>
      !from.startsWith('./') && !(from.startsWith('../types/') && /import type/.test(code))
    );
    assertEquals(outside, [], `${file} reaches outside domain/`);
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
