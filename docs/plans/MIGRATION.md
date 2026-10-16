# Migrating from Deno to Node

A plan for moving the toolchain from Deno 2 to Node.js 24 + npm. The site itself (Vue 3 + Vite +
Tailwind) does not change; only how we install, run scripts, test, lint and type-check does.

Status: **proposed**. Nothing here has been done yet.

## Why

- **`.vue` files get type-checked and covered.** `deno check` cannot run Volar/vue-tsc, and
  `deno test` cannot load SFCs, so today component code is outside both the type check and the
  coverage number (see [TESTING.md](../TESTING.md)). Under Node, `vue-tsc` and Vitest handle both.
- **One config for build and tests.** Vitest reads `vite.config.ts`, so tests resolve imports and
  compile Vue exactly as the build does. `@deno/vite-plugin` goes away.
- **Mainstream tooling.** Editor support, Dependabot, and contributors all expect `package.json`.

What we give up: Deno's built-in `lint`/`fmt`/`test`/`coverage` in one binary, and the permission
flags (we run everything with `-A` anyway, so the latter costs nothing in practice).

## Where Deno is used today

| What                              | Count / place                                                                                                           |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `Deno.test` calls                 | 310, in 56 `*_test.ts` files under `src/` and `script/`                                                                 |
| Other `Deno.*` APIs               | ~50 calls in 13 non-test files under `script/` plus `test/helpers/prop.ts`, and ~50 more in tests (temp dirs, fixtures) |
| `@std/assert`                     | 56 test files (`assert`, `assertEquals`, `assertThrows`, `assertRejects`, …)                                            |
| `@std/testing/time` (`FakeTime`)  | 2 test files                                                                                                            |
| `/// <reference lib="deno.ns" />` | 74 files                                                                                                                |
| `import.meta.main`                | 6 script entry points                                                                                                   |
| `deno.jsonc`                      | tasks, import map (`npm:`/`jsr:` specifiers), compiler options, lint/fmt settings                                       |
| `vite.config.ts`                  | `@deno/vite-plugin`; imports `script/version/compute.ts`, which uses `Deno.Command`                                     |
| CI (`verify.yml`, `nightly.yml`)  | `denoland/setup-deno`, `deno install --allow-scripts`, `deno lint/fmt/task`                                             |

No `src/` runtime code uses Deno APIs, and no file uses non-erasable TypeScript (enums, namespaces,
parameter properties). That matters: Node 24 runs `.ts` files directly by stripping types, so the
scripts need no build step and the `.ts` extensions in imports keep working.

## API mapping

| Deno                                          | Node                                                                 |
| --------------------------------------------- | -------------------------------------------------------------------- |
| `Deno.readTextFile(p)` / `writeTextFile`      | `readFile(p, 'utf8')` / `writeFile` from `node:fs/promises`          |
| `writeTextFile(p, s, { append: true })`       | `appendFile(p, s)`                                                   |
| `Deno.readFile` / `writeFile`                 | `readFile` / `writeFile` (returns `Buffer`, a `Uint8Array`)          |
| `Deno.readDir(d)`                             | `readdir(d, { withFileTypes: true })`                                |
| `Deno.mkdir(p, { recursive })`, `Deno.remove` | `mkdir(p, { recursive })`, `rm(p, { recursive, force })`             |
| `Deno.stat`, `Deno.makeTempDir`               | `stat`, `mkdtemp(join(tmpdir(), 'test-'))`                           |
| `Deno.errors.NotFound` / `AlreadyExists`      | `err.code === 'ENOENT'` / `'EEXIST'`                                 |
| `new Deno.Command(cmd, { args }).output()`    | `promisify(execFile)(cmd, args)` from `node:child_process`           |
| `Deno.execPath()`                             | `process.execPath`                                                   |
| `Deno.env.get(k)`, `Deno.args`, `Deno.cwd()`  | `process.env[k]`, `process.argv.slice(2)`, `process.cwd()`           |
| `Deno.exit(n)`                                | `process.exit(n)` (or set `process.exitCode`)                        |
| `import.meta.main`                            | `import.meta.main` (Node ≥ 24.2)                                     |
| `Deno.test(name, fn)`                         | `test(name, fn)` from `vitest`                                       |
| `FakeTime` (`@std/testing/time`)              | `vi.useFakeTimers()` / `vi.advanceTimersByTime()`                    |
| `@std/assert`                                 | keep it: published on npm via JSR (`npx jsr add @std/assert`)        |
| `@std/path`                                   | drop it: in the import map, but nothing imports it                   |
| `deno lint` / `deno fmt`                      | ESLint (`eslint-plugin-vue`) + Prettier, or Biome for both           |
| `deno check`                                  | `vue-tsc --noEmit` (also checks `.vue` files)                        |
| `deno test --coverage` + `deno coverage`      | Vitest with `@vitest/coverage-v8` (`text`, `lcov`, `html` reporters) |

Keeping `@std/assert` means the 310 tests change only their first lines (the import of `test`), not
their bodies. Replacing it with `expect` can come later, or never.

## Plan

Do this before [SCRIPTS-LAYOUT.md](SCRIPTS-LAYOUT.md) or after it, not interleaved: both touch every
file under `script/`, and the paths in phase 3 are today's.

Each phase leaves `main` green and deployable. Phases 2–4 can run side by side with Deno: Deno
understands `node:` imports, so ported scripts still pass `deno task test` until the switch in
phase 5.

### 1. Add `package.json` (no behaviour change)

- Move the `imports` map from `deno.jsonc` into `dependencies` / `devDependencies` with the same
  versions. Drop `@deno/vite-plugin`. Add `vitest`, `@vitest/coverage-v8`, `happy-dom`, `vue-tsc`,
  `typescript`, `@types/node`, and the lint/format tools.
- `"type": "module"`, `"engines": { "node": ">=24.2" }`, and an `.nvmrc` with `24`.
- `sharp` needs its install script: npm runs it by default (the equivalent of `allowScripts`).
- Add `tsconfig.json` with the compiler options from `deno.jsonc`, plus `"module": "nodenext"`,
  `"allowImportingTsExtensions": true`, `"noEmit": true` and `"erasableSyntaxOnly": true` (so nobody
  adds an `enum` that Node cannot strip).

### 2. Port `script/lib` first

`script/lib/fs.ts` and `script/lib/git.ts` are the shared helpers; port them to `node:fs/promises`
and `node:child_process` and make the rest of `script/` go through them where it can. Their tests
(`fs_test.ts`) prove the port.

### 3. Port the scripts

In this order, because later ones depend on earlier ones: `version/compute.ts` (needed by
`vite.config.ts`), `collection/`, `pipeline/`, `image/transcode.ts`, `build.ts`, `changelog.ts`,
`placeholders/`, `docs/`, then `test/` and `test.ts` last. Remove `/// <reference lib="deno.ns" />`
from each file as it is ported; when none are left, nothing depends on Deno's globals.

### 4. Port the tests

- Replace `Deno.test(` with `test(` and import it from `vitest`. Mechanical: a codemod or a `sed`
  over the 56 files.
- `FakeTime` → `vi.useFakeTimers()` in `useDebounce_test.ts` and `flashItem_test.ts`.
- `withDom` (`script/test/helpers/dom.ts`) keeps working with `@happy-dom/global-registrator`.
  Alternatively set `environment: 'happy-dom'` for the `dom` tier and delete the helper. Note: Deno
  gave every test file its own isolate; Vitest does the same by default (`pool: 'forks'`,
  `isolate: true`), so leaked globals stay contained.
- Keep the tier naming (`_dom_test.ts`, `_prop_test.ts`, `_contract_test.ts`). Configure one Vitest
  project per tier with `include` globs so `vitest --project dom` replaces `deno task test:dom`.

### 5. Switch the test runner and coverage

`script/test.ts` stays as the front end (tier rows, areas, untested-files gate, job summary), but it
spawns Vitest instead of `deno test`:

```
vitest run --reporter=dot --reporter=junit --outputFile.junit=<path>
           --coverage --coverage.reporter=lcov --coverage.reporter=html
           --coverage.reportsDirectory=test-results/coverage
```

- `parseJunit` and `parseLcov` already read the standard formats, so the summaries keep working.
- Coverage `include`: `src/**/*.{ts,vue}`, `script/**/*.ts`; `exclude`: `**/*_test.ts`,
  `script/test/helpers/**`, `**/*.d.ts`. This is the same filter as today **plus `.vue` files**, so
  expect the line percentage to drop at first. Re-measure, then set `--min-lines` from the new
  number; do not lower the bar on `.ts` files to make room.
- `test:html` (added already, under Deno) keeps its meaning: the HTML report lands in
  `test-results/coverage/index.html`.

### 6. Vite, type check, lint, format

- `vite.config.ts`: remove the `deno()` plugin. `computeVersion` is already ported (phase 3).
- `typecheck` → `vue-tsc --noEmit -p tsconfig.json`. Fix what it finds in `.vue` files; this is new
  checking, not a regression. Drop the `.vue` shim comment in `src/vite-env.d.ts` if it is no longer
  needed.
- Lint/format: match `deno fmt` settings (single quotes, width 100, 2 spaces, semicolons, prose wrap
  always for Markdown) so the switch produces no formatting churn. Run the formatter once in its own
  commit.

### 7. Tasks and CI

Move every task from `deno.jsonc` to `package.json` `scripts` with the same names (`dev`, `build`,
`test`, `test:coverage`, `test:report`, `test:html`, `typecheck`, `check`, `version`, `changelog`,
…) so the docs only change `deno task` → `npm run`.

CI (`verify.yml`, `nightly.yml`): `actions/setup-node@v4` with `node-version-file: .nvmrc` and
`cache: npm`, then `npm ci`, `npm run lint`, `npm run format:check`, `npm run typecheck`,
`npm run test:coverage` (keep `TZ: America/Los_Angeles` and the timezone matrix), `npm run check`,
`npm run build`. Keep the `test-results/` upload; it now also holds the HTML coverage report.

### 8. Remove Deno

Delete `deno.jsonc` and `deno.lock`, and update `README.md`, `docs/TESTING.md`,
`docs/TEST-PROCEDURES.md`, `docs/ARCHITECTURE.md` and the comments that say "Deno cannot load `.vue`
files". Add an entry to `CHANGELOG.md`.

## Risks

| Risk                                                          | Mitigation                                                                             |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Coverage number changes meaning (V8 via Vitest, `.vue` added) | Record both numbers on the switch PR; re-baseline the floor from the `.ts`-only figure |
| Timezone-sensitive tests behave differently                   | CI keeps running the same `TZ` matrix; run it on the switch PR                         |
| `sharp` native binary on Windows/CI                           | `npm ci` installs the prebuilt binary; verify `npm run build` on Windows and Ubuntu    |
| Tests relied on Deno's sanitizers (leaked timers/handles)     | Vitest does not fail on leaks; keep `withDom`'s teardown and fake timers' `restore`    |
| Mixed state halfway through                                   | Phases 2–4 stay Deno-compatible; the switch (5–7) is one PR                            |

## Done when

- `npm ci && npm test && npm run test:coverage && npm run typecheck && npm run build` pass on a
  clean checkout, locally on Windows and in CI.
- No file contains `Deno.` or `deno.ns`; `deno.jsonc` and `deno.lock` are gone.
- `.vue` files appear in the coverage report and in the type check.
- The deployed site is byte-for-byte the same build (modulo the version string) as the last Deno
  build.
