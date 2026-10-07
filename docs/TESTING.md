# Testing

How the tests are organised, how to run them, and how to write a new one.

## Running them

| Command                                           | What it does                                                         |
| ------------------------------------------------- | -------------------------------------------------------------------- |
| `deno task test`                                  | Every tier, one summary row per tier                                 |
| `deno task test unit dom`                         | Just the tiers you name                                              |
| `deno task test:unit` (`dom`, `prop`, `contract`) | One tier                                                             |
| `deno task test -- --verbose`                     | Also list every file                                                 |
| `deno task test:watch`                            | Re-run on every save                                                 |
| `deno task test:coverage`                         | Every tier, a coverage table, and fail below the line-coverage floor |
| `deno task test:report`                           | The same, and save the full report to `test-results/report.md`       |
| `deno task typecheck`                             | Type-check every `.ts` file                                          |
| `deno task check`                                 | Asset integrity: missing or orphaned images                          |

A passing run prints about ten lines. A failing run lists the failed tests first (file, line,
message) and then Deno's full output, with the diff or the type error that stopped it.

## Tiers

Tests sit next to the code they cover, and **the file name decides the tier**.
[`script/test/tiers.ts`](../script/test/tiers.ts) is the one place that maps names to tiers.

| Tier       | File name            | Use it for                                               | Helper                               |
| ---------- | -------------------- | -------------------------------------------------------- | ------------------------------------ |
| `unit`     | `x_test.ts`          | Pure logic. Start here                                   | `helpers/fixtures.ts`                |
| `dom`      | `x_dom_test.ts`      | Code that needs `document`, `location`, focus or storage | `helpers/dom.ts` (`withDom`)         |
| `prop`     | `x_prop_test.ts`     | A rule that must hold for _any_ input                    | `helpers/prop.ts` (`assertProperty`) |
| `contract` | `x_contract_test.ts` | The real files and history of this repo                  | none                                 |

The helpers are in [`script/test/helpers/`](../script/test/helpers/).

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
belongs to one area, by its folder ([`script/test/areas.ts`](../script/test/areas.ts)):

| Area                          | Folders                                                           | Protects                                                  |
| ----------------------------- | ----------------------------------------------------------------- | --------------------------------------------------------- |
| Site: data and search         | `src/lib`, `src/composables/collection`, `src/composables/search` | Loading collections, filtering, grouping, search          |
| Site: state and routing       | `src/stores`, `src/composables/core`                              | The stores, shareable links, theme, accent                |
| Site: viewer and interface    | `src/composables/ui`, `src/components`                            | The lightbox, scroll-spy, icons and logo                  |
| Asset pipeline and data files | `script/pipeline`, `image`, `collection`, `placeholders`, `lib`   | Image builds, the integrity check, the files in `public/` |
| Version and changelog         | `script/version`, `script/changelog.ts`                           | The version in the footer, the changelog task             |
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

`deno task test:report` also writes `test-results/report.md`: both tables, any failures, the list of
untested files by name, and coverage for every file. CI writes the same report to the job summary
page on every run and keeps it, with the JUnit file, as the `test-results` artifact for 14 days.

Use it to decide what to test next: start with the area whose **untested files** or low **lines**
would hurt most if it broke, not with the file that is easiest to cover.

## Writing a test

A unit test:

```ts
/// <reference lib="deno.ns" />
import { assertEquals } from '@std/assert';
import { drawnOf } from './formatCount.ts';

Deno.test('drawnOf words a share the same way everywhere', () => {
  assertEquals(drawnOf(15, 204), '15 of 204 drawn');
});
```

Conventions:

- **Name the behaviour, not the function:** "a drag does not close the viewer", not
  "handleBackdropClick works".
- **Build data with the fixtures** (`makeItem`, `makeCollection`, `at(year, month, day)`) so a test
  states only what matters to it.
- **Composables that register lifecycle hooks** run inside `runInScope(...)`, which also gives you a
  `stop()` to clean up.
- **Use real files when the code is about files.** The asset pipeline tests
  ([`script/pipeline/pipeline_test.ts`](../script/pipeline/pipeline_test.ts)) build a throwaway
  collection in a temporary folder with tiny real images, run the real transcoder, and delete it.
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

- `FC_RUNS_MULTIPLIER=10 deno task test:prop` runs ten times as many inputs.
- When a property fails, fast-check prints a **seed** and a **path**. Add `{ seed, path }` to the
  parameters to replay exactly that case, fix it, then remove them.
- Random strings rarely hit special cases. Mix in the tokens that matter (see the highlight test,
  which feeds it `&`, `<` and entity names).

## Coverage

`deno task test:coverage` prints the least-covered files and fails if total line coverage is below
the floor set in `deno.jsonc` (`--min-lines`). The floor only moves up: raise it when coverage has
clearly grown, leaving a few points of headroom.

Two things the number does not tell you:

- **Only files a test imports are counted.** A script nothing imports does not lower the figure. The
  report lists those files by name under "untested files", so they are not invisible.
- **`.vue` files are not counted at all.** Deno cannot import them, so component templates are
  checked by hand in the browser. Logic that matters should live in `.ts` files for this reason.

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

- **Every source and test file must belong to an area,** so nothing is missing from the report.
- **A test in the wrong place fails the suite.** The runner looks in `src/` and `script/` only, and
  a contract test checks that no `*_test.ts` file lives anywhere else.
- **Every tier must have at least one test.**

## Not covered yet

- **Components.** There is no real-browser tier. Things verified by hand today: layout at phone
  width, hover and focus styles, transitions, the lightbox gestures on a real touch screen.
- **The command-line wrappers** around the scripts (`build.ts`, the `main` blocks of the changelog
  and generator scripts). The functions they call are tested; the argument handling is not.
- `useScrollLogic` and `useBreakpoints`, which need real layout to mean anything.
