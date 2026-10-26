# Test overhaul

> **Status:** planned 2026-10-26, nothing started. The tests were written bottom up, one file at a
> time, as each piece of code was; this plans them top down, from what the site promises to the
> smallest rule, and rebuilds the kit they share. One pull request per phase, 100% coverage
> throughout. Phases 1 to 3 come **before** the [site code](SRC-OVERHAUL.md) and
> [scripts](SCRIPTS-OVERHAUL.md) overhauls: journey tests are what make moving every file safe.
> Delete this page when phase 8 is done.

## What the tests are today

507 tests in 85 files, every line and branch covered, in four timezones. They are good tests of
pieces. What bottom up left behind:

| Pattern                                                                                                                                                                                                                             | Evidence                                                                                                                                                                           |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Tests follow files, not behaviour.** No test owns a whole visit: opening the site, searching and landing in the viewer, a deep link, the back button. Each is proved only in pieces, and by hand in the browser.                  | 49 unit, 20 dom, 5 prop and 11 contract files; none mounts `App.vue`                                                                                                               |
| **The shell, the search box and the viewer component have no tests of their own,** and a `.vue` file only counts toward coverage once a test imports it, so the 100% does not include them.                                         | No test beside `App`, `Chrome`, `TopBar`, `SideNav`, `GalleryContent`, `LightBox`, `GlobalSearch`, `SearchResultsList`, `SearchDropdownHeader`, `SearchKeyboardHints`, `LogoMark`  |
| **Two ways to get a browser.** A dom test either wraps each test in `withDom(…)` or sets the file's environment.                                                                                                                    | `withDom` in 11 files (83 calls); `@vitest-environment happy-dom` in 11 files                                                                                                      |
| **Three ways to mount.**                                                                                                                                                                                                            | `runInScope` (7 files), `mountComposable` (5), `mountComponent` (10)                                                                                                               |
| **The outside world is faked by hand, differently each time.**                                                                                                                                                                      | `fetch`: `stubFetch`, `answer`, `respond` and direct assignment, in 4 files. The console: swapped by hand in 7 files. Temporary folders: `mkdtemp` in 11 files, `withTempDir` in 2 |
| **Four ways to wait.**                                                                                                                                                                                                              | `settle()`, `tick()`, `setTimeout(r, 0)`, and `nextTick()` twice in a row (52 calls)                                                                                               |
| **Setup reinvented per file.** A local `setup()` or `mount()` with its own shape.                                                                                                                                                   | 18 files                                                                                                                                                                           |
| **Two title styles.**                                                                                                                                                                                                               | 116 titles start `functionName: …`; 367 are plain sentences                                                                                                                        |
| **Big files.** The viewer's composables are tested through the composer since the split.                                                                                                                                            | `useLightbox_dom_test.ts` 500 lines, 31 tests; `run_tests_test.ts` 428 lines, 34 tests                                                                                             |
| **Coverage leads.** A test is often added to reach a line or a branch, so the suite says _which code ran_, not _which promises hold_. Nothing maps the manifesto's principles or the README's features to the tests that keep them. | The 100% floors; no list of promises                                                                                                                                               |
| **No real browser.** Phone layout, touch gestures, visible focus and Thaana that is not clipped are checked by hand.                                                                                                                | TESTING.md, "Not covered yet"                                                                                                                                                      |

## Decisions to make first

| Question                                        | Recommendation                                                                            | Why                                                                                          |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| A **journey** tier: the whole app in happy-dom  | Yes, `*_journey_test.ts`                                                                  | Proves a visit end to end, fast and without a browser; the safety net for the site overhaul  |
| A **browser** tier: a real browser on the build | Yes, but last, with Playwright pinned, a handful of checks, not a required check at first | The only way to test layout, touch and clipping; costs a dependency and about a minute of CI |
| One way to get a DOM                            | The tier sets it: every `_dom_test` and `_journey_test` runs in happy-dom; `withDom` goes | One mechanism, and no test can forget to wrap                                                |
| Test titles                                     | Plain sentences, no `functionName:` prefix                                                | The file already says which function; a sentence says what must stay true                    |
| Order against the other overhauls               | Phases 1–3 here first, then the site and scripts overhauls, then the rest of this plan    | Moving every file is safe only with tests that do not care where files are                   |

## Top down

### 1. Promises

What the project says it does, in the manifesto's principles (P1–P5) and the README's features. Each
becomes a line in a promise list in TESTING.md, with the tests that keep it. A promise with no test
is a gap; a test that keeps no promise is a question.

| Promise                                                                        | From       | Kept by                               |
| ------------------------------------------------------------------------------ | ---------- | ------------------------------------- |
| Every item has its place from the start, drawn or not                          | README, P2 | journey J1; unit (lists to items)     |
| Every count says how many are drawn of how many, and is worded the same way    | P2, P4     | unit (`formatCount`); journey J1, J3  |
| You can always tell where you are: collection, view, section, page             | P3         | journeys J2, J3, J6                   |
| A link to a collection or a drawing opens it, and the back button undoes it    | README     | journey J6; prop (hash round trip)    |
| Search finds an item by any of its names, in any collection, from the keyboard | README, P5 | journey J4; unit (matching)           |
| The viewer works with the keyboard alone, and gives focus back when it closes  | P5         | journey J5; dom (dialog keys)         |
| Thaana is never clipped                                                        | P5, DESIGN | contract (line height); browser B3    |
| Nothing breaks at phone width                                                  | P5         | browser B1                            |
| A failure says what failed and offers to try again                             | DESIGN §11 | journey J9; dom (each loader)         |
| The numbers on the About page are the archive's, worked out by the build       | README     | contract (stats current); journey J7  |
| The build never ships a broken site                                            | WORKFLOW   | contracts (data, generated files); CI |

### 2. Journeys

A visit, start to finish, through the real `App.vue` with the stores, the router and every
component, in happy-dom, with `fetch` answered from a fixture archive. One test file per journey, in
the user's words.

| Journey                   | What happens                                                                                                                                               |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **J1 First visit**        | The first collection loads; tiles in sections; placeholders for the undrawn; honest counts; the footer                                                     |
| **J2 Another collection** | Tab or menu; the accent, the URL (`#sharks`), the sidebar and the scroll position follow                                                                   |
| **J3 Views**              | By group and by month; drawn only; the sidebar jumps to a section and marks the one in view                                                                |
| **J4 Search**             | Typing opens results grouped by collection; long groups fold; ↑ ↓ ↵; a drawn result opens the viewer in its collection, an undrawn one highlights its tile |
| **J5 The viewer**         | A tile opens it; ← → page in order; zoom; Escape closes and focus returns to the tile; "show the group"                                                    |
| **J6 Links and back**     | `#birds/029` opens the viewer on load; back closes it; `#about`; an unknown id does nothing harmful                                                        |
| **J7 About**              | The numbers and the newest drawings from `stats.json`; a drawing links into the viewer; a failure and Try again                                            |
| **J8 Theme**              | Dark and back; remembered; placeholders follow                                                                                                             |
| **J9 Failures**           | `collections.json` fails: the error screen and Try again; one list fails: the rest still works                                                             |

The scripts have journeys too, in a temporary copy of the data: **S1** a new drawing goes in
(ingest), **S2** `check` catches a missing image, an orphan and a stale `stats.json`, **S3** the
changelog takes new commits. `build_pipeline_test.ts` is most of S1 already.

### 3. Features

Each feature (the [site code plan](SRC-OVERHAUL.md)'s `viewer/`, `search/`, `gallery/`, `about/`,
`shell/`) has component tests for what a journey does not pin down: the edge cases, the
accessibility attributes, every state of a component. A component is mounted with fake stores; a
shared `ui/` component with props alone.

### 4. Units and properties

The pure rules (`domain/` in the site plan, the plan steps of the scripts): names, counts and their
wording, grouping, folding, matching, the hash, versions. This is where most tests stay, and where a
rule that must hold for any input gets a property test.

### 5. Contracts

The real files: the lists, `collections.json`, the CSS, the docs, the generated files, git history.
They fail when the _data_ is wrong. Unchanged in kind; named after what they guard.

### The tiers, top down

| Tier       | File                 | Proves                                                  | Runs in                     |
| ---------- | -------------------- | ------------------------------------------------------- | --------------------------- |
| `browser`  | `*_browser_test.ts`  | What only a real browser shows: layout, touch, clipping | Chromium, on the built site |
| `journey`  | `*_journey_test.ts`  | A whole visit through the real app                      | happy-dom, fake `fetch`     |
| `dom`      | `*_dom_test.ts`      | A component, or code that needs the browser's APIs      | happy-dom                   |
| `unit`     | `*_test.ts`          | A pure rule                                             | Node                        |
| `prop`     | `*_prop_test.ts`     | A pure rule, for any input                              | Node                        |
| `contract` | `*_contract_test.ts` | The repository's real files                             | Node                        |

Prove each thing at the lowest tier that can: a journey checks that the pieces are joined, not every
branch inside them.

## The rules it ends at

Phase 0 writes these into TESTING.md; the words (journey, promise, fake, scenario) go in
[GLOSSARY.md](../GLOSSARY.md).

1. **A test states a promise.** Its title is a sentence that must stay true ("an undrawn result
   highlights its tile instead of opening the viewer"), not the name of the function.
2. **Every promise has a test, and the list says which.** A contract test checks that each journey
   names the promises it keeps and each promise has at least one test.
3. **The lowest tier that can prove it.** One journey per path through the site, not per branch.
4. **One way to fake each outside thing,** from `testing/fakes/`: `fakeFetch` (routes to answers),
   `captureConsole`, `tempDir`, `fakeClock`, `fakeStorage`, and the scripts' `fakeIo`. A contract
   test fails on a global swapped by hand (`globalThis.fetch =`, `console.log =`) outside
   `testing/`.
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

## Conventions

The everyday rules for writing a test file and the tests in it. Phase 0 writes them into TESTING.md;
phase 8 adds a contract test for every one that can be checked mechanically (marked ✓).

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
| A split of a long file          | File name, then the behaviour in camelCase | `runTests_arguments_test.ts`, `useViewer_keys_dom_test.ts`        |
| A journey                       | The visit, in camelCase                    | `firstVisit_journey_test.ts`, `search_journey_test.ts`            |
| A contract not tied to one file | What it guards, in camelCase               | `thaanaLineHeight_contract_test.ts`, `iconSizes_contract_test.ts` |
| A browser check                 | What it checks                             | `phoneWidth_browser_test.ts`                                      |

Where it lives: beside its source file; journeys in the site's `app/journeys/` (the site code plan's
`app/`), the scripts' journeys beside the command they run; browser checks in `browser/`. Test files
only under `src/` and `script/` (and `browser/`), as today ✓.

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

## The kit, where it ends up

```
src/testing/
  fakes/       fakeFetch, captureConsole, tempDir, fakeClock, fakeStorage
  scenarios/   the fixture archive (collections, lists, stats) and the named scenarios
  fixtures.ts  makeItem, makeCollection, at
  mount.ts     mountComponent, mountComposable
  events.ts    press, type, click, swipe (today `key` and `pointer`, each local to one file)
  renderApp.ts the whole app for journeys, on a scenario
  settle.ts    settle
  propertyRuns.ts
browser/       the browser tier: Playwright config and its few checks (phase 7)
```

`withDom.ts`, `mountComposable.ts` and `mountComponent.ts` fold into the above. The scripts'
`fakeIo` comes with the [scripts overhaul](SCRIPTS-OVERHAUL.md), phase 1.

## Phases

Each phase is one pull request: 100% lines and branches, all checks green, the four timezones, and
TESTING.md, TEST-PROCEDURES.md and `script/test_runner/` (tiers, areas) updated in the same PR.
Production code changes only where a test cannot reach it otherwise, and says so.

- [ ] **0. Agree the rules.** Settle the decisions; the rules, the conventions and the promise list
      into TESTING.md; the words into GLOSSARY.md. _Done when_ merged.
- [ ] **1. The kit.** `testing/fakes/`, `settle`, one `mount.ts`; the four `fetch` fakes, seven
      console swaps and thirteen temporary folders moved onto it; the contract test against
      hand-swapped globals. _Done when_ no test fakes the outside world by itself.
- [ ] **2. One way to a browser.** The runner gives `_dom_test` files happy-dom; the 83 `withDom`
      calls go, and so does `withDom.ts`. _Done when_ no test sets its own environment.
- [ ] **3. Journeys.** The `journey` tier in `tiers.ts` and an area for it; `renderApp` on the
      fixture archive; J1–J9; the untested-files gate covers `.vue`. _Done when_ every component is
      exercised by a test and every journey passes. **The site and scripts overhauls start after
      this.**
- [ ] **4. Feature gaps.** Component tests for what the journeys leave open in the shell, the search
      box and the viewer (folding, key hints, every empty and error state, the ARIA attributes).
      _Done when_ every component has a test beside it or a journey that names it.
- [ ] **5. Split and rename.** `useLightbox_dom_test.ts` into one file per composable;
      `run_tests_test.ts` by concern; the 116 `functionName:` titles rewritten as sentences; the 18
      local `setup()`s onto scenarios and `mount…` helpers; `key` and `pointer` onto the kit's
      events; the arbitraries named `any…`; the contracts not tied to a file renamed for what they
      guard (`thaana_contract_test.ts` → `thaanaLineHeight_contract_test.ts`). _Done when_ no test
      file is over about 300 lines and every title and file name follows the conventions.
- [ ] **6. The promise map.** Each journey names its promises (`// Keeps: P2, P3`); a contract test
      checks the list in TESTING.md against them. _Done when_ every promise is kept by a test.
- [ ] **7. A real browser.** Playwright, pinned, on the built `dist/`, as a CI job that does not
      block merges at first: **B1** no sideways scroll at 375px on every page, **B2** a swipe pages
      the viewer on a touch screen, **B3** Thaana is not clipped in a tile, the viewer or search,
      **B4** the focus ring shows on every control by keyboard. _Done when_ it has passed for two
      weeks; then decide whether it becomes required.
- [ ] **8. Close.** TESTING.md rewritten top down (promises, journeys, features, units, contracts);
      a contract test for the conventions marked ✓ (file names, title rules, no `.only`/`.skip`, no
      duplicate titles); "Not covered yet" shrinks to what is left; this page deleted.

## Not in this plan

- Lowering the floors, or chasing a percentage above them.
- Visual snapshots of whole pages: they break on every design change and say little about why.
- Testing Vue, Vite or VitePress themselves.
