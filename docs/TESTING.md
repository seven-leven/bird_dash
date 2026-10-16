# Testing

How the tests are organised, how to run them, and how to write a new one. For step-by-step
instructions (setting up a machine, what to do when a test or CI fails, maintenance, the runner's
flags), see [TEST-PROCEDURES.md](TEST-PROCEDURES.md). The `.ts` code is at 100% coverage; tests for
the `.vue` components are next, in [TODO.md](plans/TODO.md).

## Running them

| Command                                         | What it does                                                      |
| ----------------------------------------------- | ----------------------------------------------------------------- |
| `npm test`                                      | Every tier, one summary row per tier                              |
| `npm test -- unit dom`                          | Just the tiers you name                                           |
| `npm run test:unit` (`dom`, `prop`, `contract`) | One tier                                                          |
| `npm test -- --verbose`                         | Also list every file                                              |
| `npm run test:watch`                            | Re-run on every save                                              |
| `npm run test:coverage`                         | Every tier, a coverage table, and fail below a coverage floor     |
| `npm run test:report`                           | The same, and save the full report to `test-results/report.md`    |
| `npm run test:html`                             | The same, and an HTML coverage report in `test-results/coverage/` |
| `npm run typecheck`                             | Type-check every `.ts` file and `.vue` component (vue-tsc)        |
| `npm run check`                                 | Asset integrity: missing or orphaned images                       |

A passing run prints about ten lines. A failing run lists the failed tests first (file and message)
and then Vitest's full output, with the diff and the failing line. The tests run on
[Vitest](https://vitest.dev/), with the assertions from `@std/assert`.

## Tiers

Tests sit next to the code they cover, and **the file name decides the tier**.
[`script/test_runner/tiers.ts`](../script/test_runner/tiers.ts) is the one place that maps names to
tiers.

| Tier       | File name            | Use it for                                               | Helper                                             |
| ---------- | -------------------- | -------------------------------------------------------- | -------------------------------------------------- |
| `unit`     | `x_test.ts`          | Pure logic. Start here                                   | `test_helpers/fixtures.ts`                         |
| `dom`      | `x_dom_test.ts`      | Code that needs `document`, `location`, focus or storage | `test_helpers/with_dom.ts` (`withDom`)             |
| `prop`     | `x_prop_test.ts`     | A rule that must hold for _any_ input                    | `test_helpers/property_runs.ts` (`assertProperty`) |
| `contract` | `x_contract_test.ts` | The real files and history of this repo                  | none                                               |

The helpers are in [`src/test_helpers/`](../src/test_helpers/).

### Which tier?

- Can it be a plain function with inputs and outputs? **Unit.** If the code is tangled with the
  browser, first move the logic into `src/lib/` and test that.
- Does it touch the DOM, the address bar, focus or `localStorage`? **Dom.** Wrap each test in
  `withDom(...)`, which sets up a fake browser and tears it down.
- Is it a rule like "nothing is lost", "the order never goes backwards" or "encode then decode gives
  back the input"? **Prop.** Describe the inputs and let fast-check generate hundreds.
- Does it check `public/*.json`, the folder layout or git history? **Contract.** These fail when the
  _data_ is wrong, not the code.

## Areas

Tiers say _how_ a test runs. **Areas say what it protects.** Every source file and every test file
belongs to one area, by its folder
([`script/test_runner/areas.ts`](../script/test_runner/areas.ts)):

| Area                          | Folders                                                           | Protects                                                  |
| ----------------------------- | ----------------------------------------------------------------- | --------------------------------------------------------- |
| Site: data and search         | `src/lib`, `src/composables/collection`, `src/composables/search` | Loading collections, filtering, grouping, search          |
| Site: state and routing       | `src/stores`, `src/composables/core`                              | The stores, shareable links, theme, accent                |
| Site: viewer and interface    | `src/composables/ui`, `src/components`                            | The lightbox, scroll-spy, icons and logo                  |
| Asset pipeline and data files | `script/pipeline`, `image`, `collection`, `placeholders`, `lib`   | Image builds, the integrity check, the files in `public/` |
| Version and changelog         | `script/version`, `script/changelog/changelog.ts`                 | The version in the footer, the changelog task             |
| Test harness and docs tooling | `script/test`, `script/docs`                                      | The runner and its reports, generated guide images        |

A new folder must be added to an area, or a contract test fails.

## Reading the report

Every run prints two tables: by tier, then by area.

```
area                           tests  lines   untested files  result
Site: data and search             64   99.0%               1  ✓
Site: state and routing           40   99.5%               3  ✓
Asset pipeline and data files     41   91.6%               1  ✓
```

- **tests:** how many tests live in the area.
- **lines:** line coverage of the area's files that a test loaded (shown with `test:coverage`).
- **untested files:** source files in the area that no test imports at all. Coverage cannot see
  these, so a high percentage beside a non-zero count here means "well tested, where tested".
- **result:** a tick, the number of failures, or "no tests".

`npm run test:report` also writes `test-results/report.md`: both tables, any failures, the list of
untested files by name, and coverage for every file. CI writes the same report to the job summary
page on every run and keeps it, with the JUnit file, as the `test-results` artifact for 14 days.

Use it to decide what to test next: start with the area whose **untested files** or low **lines**
would hurt most if it broke, not with the file that is easiest to cover.

## Writing a test

A unit test:

```ts
import { test } from 'vitest';
import { assertEquals } from '@std/assert';
import { drawnOf } from './formatCount.ts';

test('drawnOf words a share the same way everywhere', () => {
  assertEquals(drawnOf(15, 204), '15 of 204 drawn');
});
```

Conventions:

- **Name the behaviour, not the function:** "a drag does not close the viewer", not
  "handleBackdropClick works".
- **Build data with the fixtures** (`makeItem`, `makeCollection`, `at(year, month, day)`) so a test
  states only what matters to it.
- **Composables that only need a reactive scope** run inside `runInScope(...)`, which also gives you
  a `stop()` to clean up.
- **Composables whose `onMounted` / `onUnmounted` must really fire** (a window listener, say) run
  inside `mountComposable(...)`, which mounts a real component that draws nothing and gives you
  `unmount()`.
- **Code that reads the layout** (the scroll-spy) is tested by giving each fake element the position
  the test wants it to report. That checks the decision, not the browser's measuring.
- **Use real files when the code is about files.** The asset pipeline tests
  ([`script/build/build_pipeline_test.ts`](../script/build/build_pipeline_test.ts)) build a
  throwaway collection in a temporary folder with tiny real images, run the real transcoder, and
  delete it.
- **Fake the edges, not the logic.** Stub `fetch`, pass in a fake `git`, use a temporary directory;
  run the real code in between.
- **Time and timezones:** build dates with `at(...)` (UTC). Never rely on the machine's zone; CI
  runs the suite in four.
- **A test must be able to fail.** After writing one, break the code it covers on purpose and
  confirm the test goes red.

### Property tests

```ts
assertProperty(
  fc.property(fc.string(), fc.string(), (text, query) => {
    const shown = stripMarks(highlightText(text, query));
    assertEquals(shown, text); // highlighting never changes the text
  }),
  { numRuns: 500 },
);
```

- `FC_RUNS_MULTIPLIER=10 npm run test:prop` runs ten times as many inputs.
- When a property fails, fast-check prints a **seed** and a **path**. Add `{ seed, path }` to the
  parameters to replay exactly that case, fix it, then remove them.
- Random strings rarely hit special cases. Mix in the tokens that matter (see the highlight test,
  which feeds it `&`, `<` and entity names).

## Coverage

`npm run test:coverage` prints the least-covered files and fails if total line or branch coverage is
below its floor in `package.json` (`--min-lines`, `--min-branches`). Both floors are **100%**: every
line, branch and function of the `.ts` code is tested, so new code needs a test (or a `c8 ignore`
with its reason, below) before CI passes.

Code that cannot run in a test is marked `/* c8 ignore next */` with a comment saying why: the `if
(import.meta.main)` line of each command, `spawnVite` (the real build), and guards for things that
cannot happen (a key handler that only exists while the viewer is open). Grep for `c8 ignore` to see
them all. Anything a test could reach is tested instead.

Two things the number does not tell you:

- **Only files a test imports are counted,** so the percentage alone could hide a file with no tests
  at all. To close that gap, `npm run test:coverage` also fails if any source file is not imported
  by at least one test, and names it.
- **`.vue` files count only once a test imports one.** No test does yet, so components are checked
  by hand in the browser, and the untested-files gate covers `.ts` files only. Vitest compiles
  `.vue` files exactly as the build does, so a component test is now possible; until there are some,
  logic that matters should live in `.ts` files.

## In CI

Every pull request and every push to `main` runs the same workflow,
[`verify.yml`](../.github/workflows/verify.yml):

1. Lint, format check, type check.
2. All tiers with coverage, in a timezone **west of UTC** (`America/Los_Angeles`), so date code that
   wrongly uses local time fails here.
3. Asset integrity, then the production build.
4. In parallel, all tiers again in `UTC`, `Asia/Kolkata` and `Pacific/Kiritimati` (UTC+14).

The run writes a summary table to the job page, annotates failures on the changed lines, and keeps
the JUnit file as an artifact. `main` is protected: a pull request cannot be merged until these
checks pass, and the site deploys only after they pass again on `main`.

A weekly job ([`nightly.yml`](../.github/workflows/nightly.yml)) runs the property tests at 25 times
their normal depth in three timezones. If it fails, the seed is in the log.

## Guard rails

- **Every source file must be imported by a test.** A new file with no test fails the coverage run.
- **Every source and test file must belong to an area,** so nothing is missing from the report.
- **A test in the wrong place fails the suite.** The runner looks in `src/` and `script/` only, and
  a contract test checks that no `*_test.ts` file lives anywhere else.
- **Every tier must have at least one test.**

## Not covered yet

- **Components.** There is no real-browser tier. Things verified by hand today: layout at phone
  width, hover and focus styles, transitions, the lightbox gestures on a real touch screen.
- **The last line of each command.** Every script's work is a tested function; what is left untested
  is the one line that starts it (`if (import.meta.main) …`) and the function that launches the real
  `vite build`.
- **Real layout.** The scroll-spy and the breakpoint are tested with positions and widths the test
  supplies. Whether the browser reports the right ones is still checked by hand.
