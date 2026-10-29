# Testing

How the tests are organised, how to run them, and how to write a new one. For step-by-step
instructions (setting up a machine, what to do when a test or CI fails, maintenance, the runner's
flags), see [TEST-PROCEDURES.md](TEST-PROCEDURES.md). The `.ts` code is at 100% coverage; tests for
the `.vue` components are next, in the [test overhaul](plans/TEST-OVERHAUL.md) (phase 4).

## The rules

Where the suite is going: the [test overhaul](plans/TEST-OVERHAUL.md) moves the tests to these,
phase by phase. The kit and the tiers that rules 4 to 8 name (`testing/fakes/`, `settle`, scenarios,
the journey tier) are in place since its phases 1 to 3; the rest of the suite moves onto them in
phases 4 and 5.

1. **A test states a promise.** Its title is a sentence that must stay true ("an undrawn result
   highlights its tile instead of opening the viewer"), not the name of the function.
2. **Every promise has a test, and the list says which.** A contract test checks that each journey
   names the promises it keeps and each promise has at least one test.
3. **The lowest tier that can prove it.** One journey per path through the site, not per branch.
4. **One way to fake each outside thing,** from `testing/fakes/`: `fakeFetch` (routes to answers),
   `captureConsole`, `tempDir`, `fakeClock`, `fakeStorage`, the scripts' `fakeIo`, and `fakeVitest`
   for the test runner's own tests. A contract test fails on a global swapped by hand
   (`globalThis.fetch =`, `console.log =`) outside `testing/`.
5. **One way to get a browser:** the tier. No wrapper to forget.
6. **One way to mount:** `mountComponent(component, { props, stores })` and `mountComposable(fn)`;
   `runInScope` is folded in.
7. **One way to wait:** `settle()`: every pending promise, then Vue's next render.
8. **Fixtures speak the domain.** `makeItem`, `makeCollection` and `at` stay; named **scenarios**
   are shared instead of rebuilt per file: an archive with gaps, a bird with two Dhivehi names, a
   collection with nothing drawn, a list that fails to load.
9. **A test sits beside its file and is named after it.** A test of something that spans files (a
   journey, a contract, a browser check) is named after what it proves.
10. **Coverage is a floor, not the goal.** 100% of lines and branches stays, and the untested-files
    gate covers `.vue` files too. Every `c8 ignore` says why.
11. **Deterministic.** No real network, timers, clock or randomness without a seed; the four
    timezones stay; the weekly deep run stays.
12. **Small files.** A test file past about 300 lines splits by behaviour.

## Promises

What the project says it does, in the manifesto's principles (P1–P5) and the README's features, and
the tests that keep each. A promise with no test is a gap; a test that keeps no promise is a
question. The journeys are listed under "Journey tests" below; "browser" names checks the overhaul
adds in phase 7.

A test that keeps a promise says so on a line of its own, after its opening comment: `// Keeps:
place, counts`. A journey names itself first, `// J1 First visit: …`.
[`promises_contract_test.ts`](../script/testRunner/promises_contract_test.ts) holds the two
together: every promise is kept by a test, every id a test names is on the list, and a journey keeps
exactly the promises whose "Kept by" names it.

| Id             | Promise                                                                          | From       | Kept by                                                          |
| -------------- | -------------------------------------------------------------------------------- | ---------- | ---------------------------------------------------------------- |
| `place`        | Every item has its place from the start, drawn or not                            | README, P2 | journey J1; unit (lists to items)                                |
| `counts`       | Every count says how many are drawn of how many, and is worded the same way      | P2, P4     | unit (`formatCount`); journey J1, J3                             |
| `whereYouAre`  | You can always tell where you are: collection, view, section, page               | P3         | journeys J2, J3, J6                                              |
| `links`        | A link to a collection or a drawing opens it, and the back button undoes it      | README     | journey J6; prop (hash round trip)                               |
| `search`       | Search finds an item by any of its names, in any collection, from the keyboard   | README, P5 | journey J4; unit (matching)                                      |
| `viewerKeys`   | The viewer works with the keyboard alone, and gives focus back when it closes    | P5         | journey J5; dom (dialog keys)                                    |
| `thaana`       | Thaana is never clipped                                                          | P5, DESIGN | contract (line height); browser B3                               |
| `phoneWidth`   | Nothing breaks at phone width                                                    | P5         | journey J10; browser B1                                          |
| `failures`     | A failure says what failed and offers to try again                               | DESIGN §11 | journey J9; unit (each loader)                                   |
| `aboutNumbers` | The numbers on the About page are the archive's, worked out by the build         | README     | contract (stats current); journey J7                             |
| `build`        | The build never ships a broken site                                              | WORKFLOW   | contracts (data, generated files); CI                            |
| `sharedLink`   | A shared link to a drawing shows that drawing                                    | PLATFORM   | unit (preview pages); dom (Share); contract (a page per drawing) |
| `theme`        | Dark or light as you choose, remembered on the next visit, with no flash on load | README     | journey J8; contract (the theme script)                          |
| `keyboard`     | Every control can be reached by keyboard, and shows where focus is               | P5         | browser B4                                                       |

## Running them

| Command                                   | What it does                                                            |
| ----------------------------------------- | ----------------------------------------------------------------------- |
| `npm test`                                | Every tier, one summary row per tier                                    |
| `npm test -- unit dom`                    | Just the tiers you name                                                 |
| `npm test -- interface`                   | Just one area (`data`, `state`, `interface`, `journeys`, `pipeline`, …) |
| `npm test -- src/components`              | Just the tests under a folder (or one file); combines with tiers        |
| `npm run test:unit` (`dom`, `journey`, …) | One tier                                                                |
| `npm test -- --verbose`                   | Also list every file                                                    |
| `npm run test:watch`                      | Re-run on every save                                                    |
| `npm run test:coverage`                   | Every tier, a coverage table, and fail below a coverage floor           |
| `npm run test:report`                     | The same, and save the full report to `test-results/report.md`          |
| `npm run test:html`                       | The same, and an HTML coverage report in `test-results/coverage/`       |
| `npm run typecheck`                       | Type-check every `.ts` file and `.vue` component (vue-tsc)              |
| `npm run check`                           | Missing or orphaned images, and stale generated files                   |

A passing run prints about ten lines. A failing run lists the failed tests first (file and message)
and then Vitest's full output, with the diff and the failing line. The tests run on
[Vitest](https://vitest.dev/), with the assertions from `@std/assert`.

## Tiers

Tests sit next to the code they cover, and **the file name decides the tier**. A tier is defined
once, in the table in [`script/testRunner/tiers.ts`](../script/testRunner/tiers.ts): where it runs
(its _environment_: plain Node, or happy-dom with `domSetup.ts` before each test), its suffix, what
it is for and its helper. The runner, `tierOf`, the `test:<tier>` scripts and Vitest's projects in
`vite.config.ts` all read it, and a contract test checks this table against it.

| Tier       | File name            | Use it for                                                                        | Helper                                       |
| ---------- | -------------------- | --------------------------------------------------------------------------------- | -------------------------------------------- |
| `unit`     | `x_test.ts`          | Pure logic. Start here                                                            | `testing/fixtures.ts`                        |
| `dom`      | `x_dom_test.ts`      | Code that needs `document`, `location`, focus or storage                          | `testing/domSetup.ts`, before every test     |
| `journey`  | `x_journey_test.ts`  | A whole visit, through the real app                                               | `testing/renderApp.ts` (`renderApp`)         |
| `prop`     | `x_prop_test.ts`     | A rule that must hold for _any_ input                                             | `testing/propertyRuns.ts` (`assertProperty`) |
| `contract` | `x_contract_test.ts` | The real files and history of this repo                                           | none                                         |
| `browser`  | `x_browser_test.ts`  | What only a real browser shows: layout, touch, clipping, focus. On the built site | `testing/realBrowser.ts` (`openSite`)        |

The helpers are in [`src/testing/`](../src/testing/).

### Which tier?

- Can it be a plain function with inputs and outputs? **Unit.** If the code is tangled with the
  browser, first move the logic into `src/domain/` and test that.
- Does it touch the DOM, the address bar, focus or `localStorage`? **Dom.** The name is enough: a
  `_dom_test` file runs in happy-dom, and `testing/domSetup.ts` puts the address, storage and page
  back as they started before each of its tests.
- Is it something a visitor does across the site: load it, search, open a drawing, go back?
  **Journey.** The whole app in happy-dom on the fixture archive; see "Journey tests" below. A
  journey checks that the pieces are joined, not every branch inside them.
- Is it a rule like "nothing is lost", "the order never goes backwards" or "encode then decode gives
  back the input"? **Prop.** Describe the inputs and let fast-check generate hundreds.
- Does it check `public/*.json`, the folder layout or git history? **Contract.** These fail when the
  _data_ is wrong, not the code.

## Areas

Tiers say _how_ a test runs. **Areas say what it protects.** Every source file and every test file
belongs to one area, by its folder ([`script/testRunner/areas.ts`](../script/testRunner/areas.ts)):

| Area                          | Folders                                                          | Protects                                                |
| ----------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------- |
| Site: data and search         | `src/domain`, `src/data`, `src/search`                           | The archive's rules, loading collections, search        |
| Site: state and routing       | `src/browser`, `src/app`, `src/shell`                            | The shell and its stores, links, the pages, theme       |
| Site: viewer and interface    | `src/viewer`, `src/gallery`, `src/about`, `src/ui`, `src/styles` | The viewer, the gallery, About, icons and logo          |
| Site: journeys                | `src/journeys`, `src/app/App.vue`                                | A whole visit, from first load to the back button       |
| Asset pipeline and data files | `script/ingest`, `script/build`, `script/lib`, stats             | Ingest, the integrity check, the files in `public/`     |
| Version and changelog         | `script/version`, `script/changelog`                             | The version in the footer, the changelog task           |
| Test harness and docs tooling | `script/testRunner`, `script/generate`, `script/docs`            | The runner and its reports, guide images, the docs site |

When two areas' folders overlap, the longer path wins: the generated data file in `script/generate`
(stats) is pipeline, the rest of the folder tooling.

A new folder must be added to an area, or a contract test fails.

## Reading the report

Every run prints two tables, by tier and then by area; a run of the whole suite adds a third, the
grid, with areas down and tiers across and how many tests each holds (`·` for none), so a gap shows:
an area with no property tests, or one tested only by journeys.

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
- **Mount with `src/testing/mount.ts`**, by what you mount; everything is unmounted after the test:
  a component with `mountComponent` (below); a composable whose `onMounted` / `onUnmounted` must
  really fire (a window listener, say) with `mountComposable(...)`, which mounts a real component
  that draws nothing; a composable or store that only needs a reactive scope with `runInScope(...)`
  (its hooks never fire; `stop()` tears it down); components with no document at all (provide /
  inject) with `mountWithoutDom(component)`.
- **Code that reads the layout** (the scroll-spy) is tested by giving each fake element the position
  the test wants it to report. That checks the decision, not the browser's measuring.
- **Use real files when the code is about files.** The asset pipeline tests
  ([`script/ingest/ingest_pipeline_test.ts`](../script/ingest/ingest_pipeline_test.ts)) build a
  throwaway collection in a temporary folder with tiny real images, run the real transcoder, and
  delete it.
- **Fake the edges, not the logic,** with the kit in [`src/testing/fakes/`](../src/testing/fakes/),
  and run the real code in between. Each fake undoes itself when its `using` block ends, so a test
  never restores anything in a `finally`; a contract test fails on a global swapped by hand:

  ```ts
  using fetch = fakeFetch({ '/stats.json': inTurn(status(500), json(stats)) }); // fetch.calls
  using warnings = captureConsole((line) => line.includes('readonly')); // warnings.lines
  await using dir = await tempDir('ingest'); // dir.path, dir.join('a.png')
  await settle(); // every settled promise has run, and Vue has drawn it
  ```

  A fake kept only for its cleanup is named with a leading `_` (`using _fetch = …`). The scripts'
  outside world is `fakeIo` instead (below).
- **Shared data before your own.** `src/testing/scenarios/archive.ts` is a small whole archive
  (Birds and Sharks, with `archiveRoutes()` for `fakeFetch` and `archiveStats()`, worked out as the
  build does); `scriptFixtures.ts` has the scripts' `makeScriptCollection`, `twoDucks` and
  `fakeTranscoder`; `fakes/tempCollection.ts` puts a collection with real images in a temporary
  folder. Write data of your own only for the edge case the test is about.
- **Time and timezones:** build dates with `at(...)` (UTC). Never rely on the machine's zone; CI
  runs the suite in four.
- **A test must be able to fail.** After writing one, break the code it covers on purpose and
  confirm the test goes red.

### Journey tests

A journey is a visit, start to finish, through the real `App.vue` with its stores, router and every
component, in happy-dom, with `fetch` answered from the fixture archive. It goes the way a visitor
goes: by clicking what they would click and pressing the keys they would press, and it checks what
they would see.

```ts
using app = await renderApp({ at: 'birds/003' }); // or { routes: { … } }, { width: 375 }
app.control('Next').click(); // a button, link, tile or option, by its label or text
press('Escape'); // testing/events.ts: press, type, pointer
await app.until(() => !dialog(), 'the viewer to close'); // settle until it holds, or fail by name
```

- `renderApp` (in [`src/testing/renderApp.ts`](../src/testing/renderApp.ts)) waits for the app to
  load; leaving the `using` block unmounts it and puts `fetch` back. Pass only the routes the test
  changes, and `width` for a phone (`domSetup.ts` restores the window after the test).
- **Wait with `app.until(check, what)`**, never a fixed delay: it settles until the check holds, and
  a failure names what it was waiting for. The search filters the grid 120ms after typing, so wait
  for the grid, not for the box.
- One file per journey in `src/journeys/`, its first comment saying which promise it keeps:

| Journey                   | File                                | What happens                                            |
| ------------------------- | ----------------------------------- | ------------------------------------------------------- |
| **J1 First visit**        | `firstVisit_journey_test.ts`        | Tiles in sections, placeholders, honest counts, footer  |
| **J2 Another collection** | `anotherCollection_journey_test.ts` | Tab or menu; the address, accent and sidebar follow     |
| **J3 Views**              | `views_journey_test.ts`             | By group, by month, drawn only; the sidebar jumps       |
| **J4 Search**             | `search_journey_test.ts`            | Results by collection, folding, ↑ ↓ ↵, Ctrl+K, no match |
| **J5 The viewer**         | `viewer_journey_test.ts`            | Opens from a tile; arrows, zoom, drag; focus comes back |
| **J6 Links and back**     | `linksAndBack_journey_test.ts`      | Deep links, pages, the back button, links to nothing    |
| **J7 About**              | `about_journey_test.ts`             | The archive's numbers; drawings link into the viewer    |
| **J8 Theme**              | `theme_journey_test.ts`             | Dark and back, remembered; placeholders follow          |
| **J9 Failures**           | `failures_journey_test.ts`          | The gallery, one collection or the numbers fail         |
| **J10 On a phone**        | `phone_journey_test.ts`             | The sections drawer; the search behind a button         |

A journey proves the pieces are joined. What only a component can show (a state the app never
reaches, such as the header before any collection is known) is a component test, below.

### Component tests

A `.vue` component is tested by mounting it into a fake DOM and checking what a visitor would get:
its text, roles and labels, what a click or a key does, what it emits. See
[`ItemTile_dom_test.ts`](../src/gallery/ItemTile_dom_test.ts):

- Name the file `_dom_test.ts`. That gives it a document from the start, which Vue's DOM renderer
  looks up when it is first imported.
- Mount with `mountComponent(() => h(Component, props))` from
  [`src/testing/mount.ts`](../src/testing/mount.ts). It returns the host element, and everything it
  mounts is unmounted after each test. A component that injects stores gets typed stand-ins:
  `mountComponent(() => h(CollectionMenu), { stores: { collections, actions } })`, with only the
  members it reads; or the app's real stores, with nothing loaded, from `appStores()`
  ([`src/testing/appStores.ts`](../src/testing/appStores.ts)).
- One test file per component, beside it and named after it (`DrawnFilter.vue` →
  `DrawnFilter_dom_test.ts`), so a failure says which component broke. Every component has one, even
  one a journey covers: a contract test checks. A part split out of a bigger component (an About
  section, `ViewerShare`) is tested on its own props; its parent's test keeps only what the parent
  does (the About page: loading, failing, the order of its sections).
- What a component places but does not own comes in by a slot (the footer after a page, the search
  box in the top bar); its test passes a stand-in and checks where it lands.
- happy-dom is not a full browser: it does not support the `~` sibling selector, so walk
  `parentElement.children` instead.
- A component a test loads counts toward coverage at once, so cover every branch of its template
  (both sides of each `v-if` and `:class` choice).

### Script tests

A command's `main(args, io)` takes an `Io` ([`script/lib/io.ts`](../script/lib/io.ts)); a test
passes `fakeIo({ files, git, env, now })` ([`script/lib/fakeIo.ts`](../script/lib/fakeIo.ts)) and
reads what the command wrote (`io.files`) and printed (`io.outLines`, `io.errLines`). Nothing
touches the disk, git or the console. A contract test runs against the real repository instead
(`realIo`). Every command is on `Io`, the test runner included: its tests hand `main` a fake Vitest
and fake file discovery as options, as `ingest`'s hand it a fake transcoder.

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

## Conventions

The everyday rules for a test file and the tests in it. Those marked ✓ get a contract test in the
overhaul's last phase.

### One file, many tests

A test file answers "what are the tests for X?". Each test in it states one thing that must stay
true about X. Never one file per test: each file costs a worker's start-up (about 0.6 s today),
shared setup would be copied, and the report would list hundreds of entries.

| What is tested                                     | File                                                                 |
| -------------------------------------------------- | -------------------------------------------------------------------- |
| One source file                                    | One test file beside it, holding every test of that file in its tier |
| The same file, in another tier                     | One more file, with that tier's suffix                               |
| Something that spans files (a journey, a contract) | One file per journey or contract, named after what it proves         |
| A file past about 300 lines                        | Split by behaviour, each part named for its behaviour (below)        |

### File names

`<subject>_<tier suffix>`, where the tier suffix is `test.ts`, `dom_test.ts`, `prop_test.ts`,
`contract_test.ts`, `journey_test.ts` or `browser_test.ts`, and the subject is:

| Kind                            | Subject                                    | Example                                                           |
| ------------------------------- | ------------------------------------------ | ----------------------------------------------------------------- |
| A source file                   | Its file name, case kept ✓                 | `planChanges_test.ts`, `ItemTile_dom_test.ts`                     |
| A split of a long file          | File name, then the behaviour in camelCase | `testRunner_arguments_test.ts`, `useViewer_keys_dom_test.ts`      |
| A journey                       | The visit, in camelCase                    | `firstVisit_journey_test.ts`, `search_journey_test.ts`            |
| A contract not tied to one file | What it guards, in camelCase               | `thaanaLineHeight_contract_test.ts`, `iconSizes_contract_test.ts` |
| A browser check                 | What it checks                             | `phoneWidth_browser_test.ts`                                      |

Where it lives: beside its source file; journeys in `src/journeys/` (into `app/journeys/` when the
site overhaul makes `app/`), the scripts' journeys beside the command they run; browser checks in
`browser/`. Test files only under `src/` and `script/` (and `browser/`), as today ✓.

### Test titles

`test('…', …)` takes a sentence that must stay true:

- **Says the behaviour, not the function.** The file names the subject: `"an undrawn result
  highlights its tile instead of opening the viewer"`, not `"select: undrawn"`. No `name:` prefix ✓,
  except a contract test, whose subject is a file: `"collections.json: every accent is on the
  menu"`.
- **The situation, then the outcome:** `"with nothing drawn, the count reads Nothing drawn yet"`.
- **Present tense, lower case, no full stop, no "should"** ✓: `"returns …"`, not `"should return
  …"`.
- **Unique in its file** ✓, and under about 100 characters.
- **A property test says what holds for any input:** `"for any query, every result contains it"`.
- **A journey reads as the visitor's steps:** `"typing a Dhivehi name finds the bird and opens it in
  the viewer"`.

### Inside a test

- **Flat files: no `describe`.** The file is the group; a group big enough to need a heading is a
  file of its own.
- **Arrange, act, assert,** separated by a blank line when the test has all three.
- **One behaviour per test.** Several assertions are fine when they check the same behaviour; prefer
  one `assertEquals` on a whole value to many on its parts.
- **Assertions from `@std/assert`:** `assertEquals` for values, `assertStringIncludes` for text,
  `assertThrows` / `assertRejects` for failures, and `assert(condition, message)` only with a
  message saying what was expected. Inside a loop, every assertion has a message naming the case.
- **No `.only`, `.skip` or `.todo` committed** ✓. A test that cannot pass yet is an issue in
  TODO.md, not a skipped test.
- **No timeouts in a test**, except the property tests' scaled one.
- **No real clock, network, timers or randomness** (rule 11): a fake from the kit instead.

### Helpers and data

| Thing                     | Name                                                               | Example                                       |
| ------------------------- | ------------------------------------------------------------------ | --------------------------------------------- |
| A file's own mount helper | `mount` + what it mounts, returning a named object                 | `mountTile(item) → { tile, image, clicked }`  |
| A file's own data helper  | `make` + what it makes                                             | `makeNote(paragraphs)`                        |
| Shared data               | A scenario from `testing/scenarios/`, by what it is                | `archiveWithGaps`, `birdWithTwoNames`         |
| A value in a test         | Its role in the story, never a number                              | `drawn`, `undrawn`, `goose`; not `item1`      |
| A user action             | The kit's event helpers: `press`, `type`, `click`, `swipe`         | `press('ArrowRight')`                         |
| Waiting                   | `await settle()` only                                              |                                               |
| A fast-check arbitrary    | `any` + what it generates                                          | `anyQuery`, `anyItem`, `anyHash`              |
| A fake                    | `fake` + what it replaces; the console capture is `captureConsole` | `fakeFetch(routes)`, `fakeClock(at(2025, 3))` |

No `setup()`: say what it sets up. Variables follow the code's rules: whole words
([SCRIPTS.md](../SCRIPTS.md), [GLOSSARY.md](../GLOSSARY.md)).

## Coverage

`npm run test:coverage` fails if total line or branch coverage is below its floor in `package.json`
(`--min-lines`, `--min-branches`). Any file that misses a single line or branch is named, `.vue`
files included, with the lines to look at:

```
not fully covered (1):
  src/viewer/ViewerDetails.vue
    branches 21/23, missed on: 141, 152
```

Measured exactly: a file at 99.95% is a miss, though it would print as 100.0%. When nothing is
missed it prints the least-covered files instead. A floor applies to the whole suite, so asking for
one on an area or a path is an error. Both floors are **100%**: every line, branch and function of
the `.ts` code is tested, so new code needs a test (or a `c8 ignore` with its reason, below) before
CI passes.

Code that cannot run in a test is marked `/* c8 ignore next */` with a comment saying why: the `if
(import.meta.main)` line of each command, the runner's `vitest` (the real Vitest), and guards for
things that cannot happen (a key handler that only exists while the viewer is open). Grep for `c8
ignore` to see them all. Anything a test could reach is tested instead.

Two things the number does not tell you:

- **Only files a test imports are counted,** so the percentage alone could hide a file with no tests
  at all. To close that gap, `npm run test:coverage` also fails if any source file is not imported
  by at least one test, and names it.
- **`.vue` files are source files like `.ts` ones:** a component no test loads is named by the same
  gate, and once loaded it must be at 100% like any other file. The journeys load every component
  the app shows.

## In CI

Every pull request and every push to `main` runs the same workflow,
[`verify.yml`](../.github/workflows/verify.yml):

1. Lint, format check, type check.
2. All tiers with coverage, in a timezone **west of UTC** (`America/Los_Angeles`), so date code that
   wrongly uses local time fails here.
3. Asset integrity, then the production build.
4. In parallel, all tiers again in `UTC`, `Asia/Kolkata` and `Pacific/Kiritimati` (UTC+14).

### What the runner reports

The same rules as the site's own design (DESIGN.md), applied to its test output:

1. **Lead with the verdict.** The job summary opens, and the terminal ends, with one line that says
   whether the run passed and every reason it did not: `❌ 431 tests passed · line coverage 100.0% ·
   branch coverage 99.8% (floor 100%)`.
2. **Name the cause where it lives.** A failing test is marked on its file in the pull request; so
   is every coverage gap, on its first missed line (an error when it fails the run, a warning when
   it is only a report).
3. **Show only what needs attention.** Files short of 100% come first with their line numbers; the
   table of every file is folded away. A run narrowed to an area lists only the areas it ran.
4. **The same words everywhere.** The terminal, the job summary and the annotations say "not fully
   covered", "missed", "below the floor" alike.
5. **Never round a miss into a pass.** Coverage gaps are counted, not rounded.

The run also keeps the JUnit file as an artifact. `main` is protected: a pull request cannot be
merged until these checks pass, and the site deploys only after they pass again on `main`.

A weekly job ([`nightly.yml`](../.github/workflows/nightly.yml)) runs the property tests at 25 times
their normal depth in three timezones. If it fails, the seed is in the log.

## Guard rails

- **Every source file must be imported by a test.** A new file with no test fails the coverage run.
- **Every source and test file must belong to an area,** so nothing is missing from the report.
- **A test in the wrong place fails the suite.** The runner looks in `src/` and `script/` only, and
  a contract test checks that no `*_test.ts` file lives anywhere else.
- **Every tier must have at least one test.**

## Not covered yet

- **A real browser.** The journeys run the whole app in happy-dom, which has no layout. Things
  verified by hand today: layout at phone width, hover and focus styles, transitions, the lightbox
  gestures on a real touch screen (the overhaul's phase 7).
- **The last line of each command.** Every script's work is a tested function; what is left untested
  is the one line that starts it (`if (import.meta.main) …`) and the runner's function that starts
  the real Vitest.
- **Real layout.** The scroll-spy and the breakpoint are tested with positions and widths the test
  supplies. Whether the browser reports the right ones is still checked by hand.
