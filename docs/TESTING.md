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

- **Only files a test imports are counted.** A script nothing imports does not lower the figure.
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

- **A test in the wrong place fails the suite.** The runner looks in `src/` and `script/` only, and
  a contract test checks that no `*_test.ts` file lives anywhere else.
- **Every tier must have at least one test.**

## Not covered yet

- **Components.** There is no real-browser tier. Things verified by hand today: layout at phone
  width, hover and focus styles, transitions, the lightbox gestures on a real touch screen.
- **The image transcoder and the report printers** in `script/pipeline/` and `script/image/`.
- `useScrollLogic` and `useBreakpoints`, which need real layout to mean anything.
