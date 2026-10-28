import { test } from 'vitest';
import { readFile } from 'node:fs/promises';
import { posix } from 'node:path';
import { assert, assertEquals } from '@std/assert';
import { findFiles } from '../../script/testRunner/tiers.ts';

// docs/ARCHITECTURE.md, rules 1, 2 and 6: the layers point one way, `app/` → the features →
// `ui/`, `browser/`, `data/` → `domain/`, and a feature does not reach into another. What a
// feature may take from another is its store (or the app's actions), to inject: App.vue makes
// and provides every store, so injecting one is reading shared state, not another feature's
// code. Whatever a feature places of another's (the search box in the top bar, the footer after
// a page) the app places, through a slot. Tests and the test kit are outside these rules.

const FEATURES = ['gallery', 'viewer', 'search', 'about', 'shell'];

/** What each layer may import from, besides itself. */
const MAY_IMPORT: Record<string, string[]> = {
  domain: [], // and the file shapes, types alone: pureDomain_contract_test.ts
  data: ['domain'],
  browser: ['domain'],
  ui: ['domain', 'browser'],
  ...Object.fromEntries(FEATURES.map((f) => [f, ['domain', 'data', 'browser', 'ui']])),
  app: ['domain', 'data', 'browser', 'ui', 'styles', ...FEATURES],
  styles: [],
};

/** The layer a path under src/ is in: its first folder, or `app` for main.ts. */
const layerOf = (path: string) => path === 'src/main.ts' ? 'app' : path.split('/')[1];

/** A store a feature may inject from another: `<feature>/<name>Store.ts`, or the app's actions. */
const isInjected = (target: string) =>
  /^src\/[a-z]+\/[a-zA-Z]+Store\.ts$/.test(target) || target === 'src/app/actions.ts';

const sources = async () =>
  (await findFiles(['src'], '*.{ts,vue}')).filter((path) =>
    !/_test\.ts$/.test(path) && !path.startsWith('src/testing/') && path !== 'src/env.d.ts'
  );

/** Every module a file imports from inside src/, as a path from the repository's root. */
const importsOf = (path: string, code: string) =>
  [...code.matchAll(/(?:import|export)[^'"();]*from\s*'(\.[^']+)'|import\s*\(?'(\.[^']+)'/g)]
    .map((m) => posix.normalize(posix.join(posix.dirname(path), m[1] ?? m[2])))
    .filter((target) => target.startsWith('src/'));

test('every layer imports only from the layers below it', async () => {
  const files = await sources();
  assert(files.length > 80, `found only ${files.length} source files`);
  const wrong: string[] = [];
  for (const file of files) {
    const from = layerOf(file);
    assert(from in MAY_IMPORT, `${file}: "${from}" is not a layer (add it to MAY_IMPORT)`);
    for (const target of importsOf(file, await readFile(file, 'utf8'))) {
      const to = layerOf(target);
      if (to === from || MAY_IMPORT[from].includes(to)) continue;
      if (FEATURES.includes(from) && isInjected(target)) continue;
      if (from === 'domain' && target === 'src/data/files.ts') continue; // checked as types-only
      wrong.push(`${file} → ${target}`);
    }
  }
  assertEquals(wrong, [], 'these reach up a layer, or into another feature');
});

test('nothing the site ships imports the test kit', async () => {
  for (const file of await sources()) {
    const kit = importsOf(file, await readFile(file, 'utf8')).filter((t) =>
      t.startsWith('src/testing/')
    );
    assertEquals(kit, [], `${file} imports the test kit`);
  }
});
