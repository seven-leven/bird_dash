# Test procedures

Step-by-step instructions for setting up, running and maintaining the tests. For the ideas behind
them (tiers, areas, how to write a good test), read [TESTING.md](TESTING.md); this page is the "do
this, then this" companion.

Contents:

1. [Set up a machine](#1-set-up-a-machine)
2. [Everyday running](#2-everyday-running)
3. [Before you open a pull request](#3-before-you-open-a-pull-request)
4. [Run one file or one test](#4-run-one-file-or-one-test)
5. [When a test fails](#5-when-a-test-fails)
6. [When CI fails but your machine passes](#6-when-ci-fails-but-your-machine-passes)
7. [When a property test fails](#7-when-a-property-test-fails)
8. [When coverage is below the floor](#8-when-coverage-is-below-the-floor)
9. [Add a test](#9-add-a-test)
10. [Add a new folder of code](#10-add-a-new-folder-of-code)
11. [Read the reports on GitHub](#11-read-the-reports-on-github)
12. [Maintenance](#12-maintenance)
13. [Runner reference](#13-runner-reference)
14. [How the runner works](#14-how-the-runner-works)

## 1. Set up a machine

You need two things installed: **Node.js 24** (it comes with npm) and **git**.

1. Install Node 24 (the long-term-support line): <https://nodejs.org/>. The exact version is pinned
   in `.nvmrc` (CI uses the same file), so `nvm use` (or `fnm use`) picks it. Check it with `node
   --version`.
2. Clone the repository and enter it.
3. Install the dependencies:

   ```bash
   npm install
   ```

   The image library (sharp) runs an install script to fetch its native binary; `package.json`
   allows it (`allowScripts`). If the pipeline tests fail because sharp cannot load, run `npm
   rebuild sharp`.
4. Run everything once to confirm the setup:

   ```bash
   npm test
   ```

   Expected: two small tables ending in `✓ all passing`, in under ten seconds.

There is nothing else to configure. The tests need no network, no browser and no `raw_png/` folder;
the contract tests do need the repository to be a git checkout (not a zip download).

## 2. Everyday running

| Situation                        | Command                 |
| -------------------------------- | ----------------------- |
| Writing code, want fast feedback | `npm run test:watch`    |
| Finished a change                | `npm test`              |
| Only the quick logic tests       | `npm run test:unit`     |
| Only the fake-browser tests      | `npm run test:dom`      |
| Only the generated-input tests   | `npm run test:prop`     |
| Only the checks on your data     | `npm run test:contract` |
| Two tiers at once                | `npm test -- unit dom`  |

`test:watch` uses Vitest's own output and re-runs the tests a change affects. Stop it with `Ctrl+C`.

If you only edited files in `public/` (added a drawing, fixed a name), `npm run test:contract`
followed by `npm run check` is the relevant pair.

## 3. Before you open a pull request

Run these four, in this order. They are the same checks CI runs.

```bash
npm run format
```

```bash
npm run lint
```

```bash
npm run typecheck
```

```bash
npm run test:coverage
```

Then, if you touched images, data files or anything in `script/pipeline`:

```bash
npm run check
```

And if you touched the site itself:

```bash
npm run build:vite
```

All green means CI should be green too. If you changed a design token, an icon or the logo, also run
`npm run design` and commit the regenerated images.

## 4. Run one file or one test

The task runner works on tiers. For anything finer, call Vitest directly.

One file:

```bash
npx vitest run src/lib/formatCount_test.ts
```

One test by name (any part of the name matches):

```bash
npx vitest run src/ -t "drawnOf"
```

Stop at the first failure, and list every file:

```bash
npm test -- --fail-fast --verbose
```

## 5. When a test fails

1. **Read the top of the output.** Failures are listed first:

   ```
   ✗ 1 failing

     src/lib/formatCount_test.ts
       drawnOf words a share the same way everywhere
       Values are not equal.
   ```

2. **Scroll down for the detail.** Below the tables is Vitest's full output with the diff (lines
   starting `-` are what the code produced, `+` what the test expected) and the line of the test.
3. **Run just that file** (section 4) so the loop is fast.
4. **Decide which is wrong: the code or the test.** If you changed behaviour on purpose, update the
   test and say so in the commit. If you did not, the code has a bug.
5. **Run the whole suite** once the file passes.

Vitest does not type-check: it strips the types and runs the code. A type error shows up in `npm run
typecheck` (and fails CI), not here. If a file fails to load (a syntax error, a bad import), its
tests are missing from the tables and the error is in the output below them.

## 6. When CI fails but your machine passes

Work down this list.

1. **Timezone.** CI runs the tests in Los Angeles, UTC, India and Kiribati time. A date bug often
   passes in your own zone. Look at which job failed (its name includes the zone), then run locally
   in that zone. On macOS or Linux:

   ```bash
   TZ=America/Los_Angeles npm test
   ```

   On Windows the `TZ` variable is ignored, so you cannot reproduce it this way; read the failing
   assertion on GitHub instead, and look for code using local-time date methods (`getMonth`,
   `getDate`) where the UTC ones are needed.
2. **Formatting.** CI runs `npm run format:check`. Run `npm run format` and commit the result.
3. **A file you did not commit.** Run `git status`. A new test helper or data file left untracked
   passes locally and fails in CI.
4. **Generated images out of date.** If you changed an icon or a token, run `npm run design` and
   `npm run placeholders`, then commit.
5. **Coverage.** CI fails below the floor even when every test passes (section 8).
6. **Still stuck:** download the `test-results` artifact from the run (section 11) and read
   `report.md`.

## 7. When a property test fails

Property tests generate inputs, so a failure prints the exact case and how to replay it:

```
Property failed after 37 tests
{ seed: 1234567890, path: "36:2:1", endOnFailure: true }
Counterexample: ["a&b", "amp"]
```

1. Copy the `seed` and `path` into that test's parameters:

   ```ts
   assertProperty(fc.property(...), { numRuns: 500, seed: 1234567890, path: '36:2:1' });
   ```

2. Run the file. It now fails on that one case every time.
3. Fix the code (or, rarely, the property).
4. Remove `seed` and `path` again, and run `npm run test:prop`.
5. Consider adding the counterexample as a plain unit test, so the case is pinned for good.

To search harder before a release, run more inputs:

```bash
FC_RUNS_MULTIPLIER=10 npm run test:prop
```

(On Windows PowerShell: `$env:FC_RUNS_MULTIPLIER = '10'; npm run test:prop`.)

## 8. When coverage is below the floor

```
✗ line coverage 99.8% is below the 100% floor
✗ branch coverage 99.6% is below the 100% floor
```

There are two floors, one for lines and one for branches (both sides of every `if`, `??` and `?.`),
and both are 100%: every line and branch of the `.ts` code is tested, so any new code without a test
fails the run.

1. Run `npm run test:report` and open `test-results/report.md`.
2. Look at **least covered files** and at the **By area** table. New code you added without tests is
   the usual cause.
3. Add tests for it (section 9). Prefer testing what would hurt most if it broke over what is
   easiest to cover.
4. Do **not** lower the floor to get a pull request through. If code truly cannot run in a test (a
   command-line entry point, a subprocess, a guard for something that cannot happen), keep it to one
   line and mark it with `/* c8 ignore next */` and a comment saying why. Never mark logic that a
   test could reach.

The coverage run can also fail with every test passing and the percentage fine:

```
✗ 1 source file(s) are not imported by any test:
    src/lib/newThing.ts
```

You added a file and no test loads it. Add a test file next to it (section 9); even one test that
imports it and checks its main behaviour clears the error.

## 9. Add a test

1. Create the file next to the code, named for its tier:

   | The code…                                    | File name                |
   | -------------------------------------------- | ------------------------ |
   | is a plain function                          | `thing_test.ts`          |
   | needs `document`, the address bar or storage | `thing_dom_test.ts`      |
   | should hold for any input                    | `thing_prop_test.ts`     |
   | is about the real files in this repo         | `thing_contract_test.ts` |

2. Start from this:

   ```ts
   import { test } from 'vitest';
   import { assertEquals } from '@std/assert';
   import { thing } from './thing.ts';

   test('says what the behaviour is, in plain words', () => {
     assertEquals(thing(1), 2);
   });
   ```

3. Run it while you work: `npx vitest path/to/thing_test.ts` (re-runs on every save).
4. **Prove it can fail:** break the code on purpose, see the test go red, undo the break.
5. Run `npm run test:coverage` before committing.

Helpers are in `src/test_helpers/`: `fixtures.ts` (`makeItem`, `makeCollection`, `at`,
`runInScope`), `with_dom.ts` (`withDom`), `mount_composable.ts` (`mountComposable`) and
`property_runs.ts` (`assertProperty`). [TESTING.md](TESTING.md) shows how each is used.

## 10. Add a new folder of code

Every source file must belong to an **area**, or the suite fails with:

```
add these to an area in script/test_runner/areas.ts so they show up in the report
```

1. Open [`script/test_runner/areas.ts`](../script/test_runner/areas.ts).
2. Add the folder's path to the `paths` of the area it belongs to, or add a new area (`id`, `label`,
   `protects`, `paths`) if it is a new part of the project.
3. If you added an area, add its row to the table in [TESTING.md](TESTING.md).
4. Run `npm run test:contract`.

The runner only looks for tests under `src/` and `script/`. A test file anywhere else also fails the
suite, on purpose.

## 11. Read the reports on GitHub

For any pull request or push:

1. Open the **Checks** tab of the pull request (or **Actions** for `main`).
2. Click the **verify / Lint, types, tests, and build** job, then **Summary** at the top left. You
   get the tier table, the area table, any failures, and coverage.
3. Failed tests are also marked on the changed lines under **Files changed**.
4. At the bottom of the Summary page, **Artifacts → test-results** downloads `report.md` and
   `junit.xml`. They are kept for 14 days.

The weekly deep run is under **Actions → Nightly**. To start it by hand: **Run workflow**. To re-run
a failed job: **Re-run failed jobs** on the run's page.

## 12. Maintenance

| Task                           | How                                                                                                                                                                                                                                           |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Coverage floors                | `--min-lines` and `--min-branches` in `package.json` (three scripts), both 100. Never lower them; test the new code or mark it `c8 ignore` with the reason                                                                                    |
| Update dependencies            | Every version is exact (no `^`; `.npmrc` sets `save-exact`). `npm outdated`, then `npm install <name>@<version>`, then the full check list in section 3. Run `npm dedupe` after, so only one copy of each `@vue/*` package ships              |
| Update Node                    | Change `.nvmrc` (and `engines` in `package.json`), run the check list on that version                                                                                                                                                         |
| Update a GitHub Action         | Actions are pinned to a commit, with the version in a comment. Take the commit of the new release tag (`git ls-remote https://github.com/<owner>/<action> refs/tags/<tag>^{}`), replace both, and read the release notes for breaking changes |
| Add a timezone to CI           | Add it to the `tz` list in `.github/workflows/verify.yml`                                                                                                                                                                                     |
| Change the weekly deep run     | `.github/workflows/nightly.yml` (schedule, zones, `FC_RUNS_MULTIPLIER`)                                                                                                                                                                       |
| Change what must pass to merge | Repository Settings → Branches → the rule for `main`. If a job is renamed in `verify.yml`, update the required check names there too, or merges will wait forever                                                                             |
| Slow suite                     | The `slowest:` list under the tables names the three slowest tests                                                                                                                                                                            |

## 13. Runner reference

`npm test` runs [`script/test_runner/run_tests.ts`](../script/test_runner/run_tests.ts). Tier names
and flags go after a `--`: `npm test -- unit --verbose`.

| Argument or flag   | Effect                                                            |
| ------------------ | ----------------------------------------------------------------- |
| `unit dom …`       | Run only these tiers (any of `unit`, `dom`, `prop`, `contract`)   |
| `--verbose`, `-v`  | Also list every test file with its count and time                 |
| `--fail-fast`      | Stop at the first failure                                         |
| `--coverage`       | Measure coverage and print the least-covered files                |
| `--min-lines=N`    | With `--coverage`: fail if total line coverage is below N percent |
| `--min-branches=N` | With `--coverage`: the same for branch coverage                   |
| `--report`         | Save the full report to `test-results/report.md`                  |
| `--html`           | With `--coverage`: also write `test-results/coverage/index.html`  |

| Environment variable  | Effect                                                      |
| --------------------- | ----------------------------------------------------------- |
| `FC_RUNS_MULTIPLIER`  | Multiply the number of inputs each property test generates  |
| `TZ`                  | Timezone the tests run in (not honoured on Windows)         |
| `GITHUB_ACTIONS`      | Set by CI: turns on annotations and always saves the report |
| `GITHUB_STEP_SUMMARY` | Set by CI: the file the summary tables are appended to      |

| Exit code | Meaning                                                  |
| --------- | -------------------------------------------------------- |
| `0`       | Every test passed (and coverage met the floor, if asked) |
| `1`       | A test failed, or coverage was below the floor           |
| `2`       | Bad arguments: an unknown tier or flag                   |

Output files, all in `test-results/` (ignored by git): `report.md` and, in CI, `junit.xml`.

## 14. How the runner works

Useful when you need to change it. Each step is one module in `script/test_runner/`, with its own
tests.

1. **Find the tests** (`tiers.ts`): walk `src/` and `script/` for `*_test.ts`.
2. **Sort them into tiers** (`tiers.ts`) by file name, and keep the tiers you asked for.
3. **Run them once** with `vitest run`, each file in its own process, asking for a JUnit file (and
   an LCOV coverage file with `--coverage`). Vitest's own output is captured, not shown.
4. **Read the results** (`junit.ts`) into a list of tests with file, time and failure message.
5. **Summarise by tier** (`test_summary.ts`) and **by area** (`areas.ts`), and print both tables. On
   a failure, print the failures first and then Vitest's captured output.
6. **Coverage** (`coverage.ts`): read the LCOV file into per-file numbers, compare the total with
   floors, and work out which source files no test loaded.
7. **Write the report**: to the GitHub job summary in CI, and to `test-results/report.md` in CI or
   with `--report`.
8. **Exit** with the code from section 13.

To add a tier, extend `TIERS` and `tierOf` in `tiers.ts` and add a `test:<tier>` task. To add an
area, see section 10. To change a table's layout, edit the `format…` function for it and its test.
