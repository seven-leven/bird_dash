import { test } from 'vitest';
import { readFile } from 'node:fs/promises';
import { assert, assertEquals } from '@std/assert';
import { findFiles } from '../../script/testRunner/tiers.ts';

// docs/ARCHITECTURE.md, "Naming": the rules a machine can check over the site's code. A file is
// named after what it makes, a composable says what it gives, and a helper is written once.

const sources = async () =>
  (await findFiles(['src'], '*.{ts,vue}')).filter((path) =>
    !/_test\.ts$/.test(path) && !path.startsWith('src/testing/') && !path.endsWith('.d.ts')
  );
const nameOf = (path: string) => path.split('/').at(-1)!.replace(/\.(ts|vue)$/, '');
const capital = (word: string) => word[0].toUpperCase() + word.slice(1);

/** The values a module exports by name (functions, constants, classes, and destructured pairs). */
const exportsOf = (code: string) => [
  ...[...code.matchAll(/^export (?:async )?(?:function|const|class|let) (\w+)/gm)].map((m) => m[1]),
  ...[...code.matchAll(/^export const \[([^\]]+)\]/gm)].flatMap((m) =>
    m[1].split(',').map((name) => name.trim())
  ),
];

test('a component is named in PascalCase; any other file in camelCase', async () => {
  const misnamed = (await sources()).filter((path) =>
    path.endsWith('.vue')
      ? !/^[A-Z][a-zA-Z]*$/.test(nameOf(path))
      : !/^[a-z][a-zA-Z]*$/.test(nameOf(path))
  );
  assertEquals(misnamed, []);
});

test('a file is named after what it makes: its one export, its composable, or its store', async () => {
  const wrong: string[] = [];
  for (const path of (await sources()).filter((p) => p.endsWith('.ts') && p !== 'src/main.ts')) {
    const name = nameOf(path);
    const exported = exportsOf(await readFile(path, 'utf8'));
    // A store or the app's actions: made by `create…`, shared by `provide…` and `use…`.
    const injected = exported.find((e) => e.startsWith('provide'));
    const expected = injected
      ? [`create${capital(name)}`, `provide${capital(name)}`, `use${capital(name)}`]
      : name.startsWith('use') || exported.length === 1
      ? [name]
      : [];
    const missing = expected.filter((e) => !exported.includes(e));
    if (missing.length) wrong.push(`${path}: exports ${exported.join(', ')}; expected ${missing}`);
  }
  assertEquals(wrong, []);
});

test('a composable says what it gives, never Logic, Data, Manager or Helper', async () => {
  const BANNED = /Logic|Data|Manager|Helper/;
  const composables = (await sources()).map(nameOf).filter((name) => name.startsWith('use'));
  assert(composables.length >= 10, `found only ${composables.length} composables`);
  assertEquals(composables.filter((name) => BANNED.test(name)), []);
});

test('no function is defined twice under one name: a helper two places need is written once', async () => {
  const where = new Map<string, string[]>();
  for (const path of await sources()) {
    const code = await readFile(path, 'utf8');
    const defined = code.matchAll(
      /^(?:export )?(?:async )?function (\w+)|^(?:export )?const (\w+) = (?:async )?\(/gm,
    );
    for (const m of defined) where.set(m[1] ?? m[2], [...where.get(m[1] ?? m[2]) ?? [], path]);
  }
  assertEquals([...where].filter(([, paths]) => paths.length > 1), []);
});
