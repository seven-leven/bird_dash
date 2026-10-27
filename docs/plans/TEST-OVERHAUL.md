# Test overhaul

> **Status:** planned 2026-10-26; phase 0 (the rules) and 1a (the fakes) done 2026-10-27. The tests
> were written bottom up, one file at a time, as each piece of code was; this plans them top down,
> from what the site promises to the smallest rule, and rebuilds the kit they share. One pull
> request per phase, 100% coverage throughout. Phases 1 to 3 come **before** the
> [site code](SRC-OVERHAUL.md) overhaul: journey tests are what make moving every file safe. (The
> scripts overhaul went first, as the scripts already had direct tests; see
> [SCRIPTS.md](../SCRIPTS.md).) Delete this page when phase 8 is done.

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
| **Big files.** The viewer's composables are tested through the composer since the split.                                                                                                                                            | `useLightbox_dom_test.ts` 500 lines, 31 tests; `runTests_test.ts` 428 lines, 34 tests                                                                                              |
| **Coverage leads.** A test is often added to reach a line or a branch, so the suite says _which code ran_, not _which promises hold_. Nothing maps the manifesto's principles or the README's features to the tests that keep them. | The 100% floors; no list of promises                                                                                                                                               |
| **No real browser.** Phone layout, touch gestures, visible focus and Thaana that is not clipped are checked by hand.                                                                                                                | TESTING.md, "Not covered yet"                                                                                                                                                      |

## Decisions (settled 2026-10-27)

| Question                                        | Settled                                                                                          | Why                                                                                          |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| A **journey** tier: the whole app in happy-dom  | Yes, `*_journey_test.ts`                                                                         | Proves a visit end to end, fast and without a browser; the safety net for the site overhaul  |
| A **browser** tier: a real browser on the build | Yes, but last, with Playwright pinned, a handful of checks, not a required check at first        | The only way to test layout, touch and clipping; costs a dependency and about a minute of CI |
| One way to get a DOM                            | The tier sets it: every `_dom_test` and `_journey_test` runs in happy-dom; `withDom` goes        | One mechanism, and no test can forget to wrap                                                |
| Test titles                                     | Plain sentences, no `functionName:` prefix                                                       | The file already says which function; a sentence says what must stay true                    |
| Order against the other overhauls               | Phases 1–3 here first, then the site overhaul, then the rest of this plan (the scripts' is done) | Moving every file is safe only with tests that do not care where files are                   |
| Where journeys live                             | `src/journeys/`, moved into `app/journeys/` by the site overhaul's phase 6                       | `app/` does not exist until then, and journeys come first                                    |

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

In [TESTING.md](../TESTING.md) since phase 0: "The rules" (twelve), "Promises" (the list above, with
what keeps each) and "Conventions" (one file, many tests; file names; test titles; inside a test;
helpers and data). The words (journey, promise, fake, scenario) are in
[GLOSSARY.md](../GLOSSARY.md).

## Duplicates to fold

Found by the same sweep as the site's (SRC-OVERHAUL.md, "Duplicates to fold"), on 2026-10-27. On top
of the patterns above, the tests repeat their **data** more than their code: the same collections
and the same birds are written out file by file, in `script/` as much as in `src/`.

| Repeated                                                                                                                                                                                                                                      | Becomes                                                                                                         | Phase |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ----- |
| **A collection built by hand** (`const birds = { … } as Collection`) in 10 script test files, each with its own shape, while the site's tests have `makeCollection`; `birds` is defined in 13 test files in all, `shells` in 5, `sharks` in 2 | One `makeCollection`, shared by the script and site tests (script tests already import from `src/`)             | 1     |
| **The same birds by name** (Lesser Whistling-Duck, Cotton Pygmy-Goose, Grey Heron, _Spatula querquedula_, …), about 30 times in 12 files; a `STATS` object in `AboutPage_dom_test.ts` and `useStats_test.ts`                                  | The fixture archive in `testing/scenarios/`: one set of collections, lists and stats that every test draws from | 1     |
| **`makeRepository`** in 4 script tests (`changelog`, `check`, `applyChanges`, `ingest`); the last two identical                                                                                                                               | `fakeRepository({ files, failing, log })` beside `fakeIo` in `script/lib/`                                      | 1     |
| **git's answers** spelled out in 3 tests (`'rev-list --count HEAD': '310', 'rev-parse --short=7 HEAD': …`)                                                                                                                                    | `fakeIo({ commits, commit })`, which fills them in                                                              | 1     |
| **`sizeOf`** (an image's size by `sharp`) in `generatedFiles_contract_test.ts` and `transcodeImages_test.ts`; **`withCollection`** (a collection in a temporary folder) in `ingest_pipeline_test.ts` and `transcodeImages_test.ts`            | `imageSize` and `tempCollection` in the kit, beside `tempDir`                                                   | 1     |
| **The same `fetch` routes** (`collections.json` and two lists) written out 4 times in `useCollections_test.ts`                                                                                                                                | `fakeFetch` serves the fixture archive by default; a test names only the route it changes                       | 1     |
| **A Vue renderer**, 15 lines, copied from `mountComposable.ts` into `injection_test.ts`                                                                                                                                                       | `injection_test.ts` uses `mount.ts`                                                                             | 1     |
| **A local `mount`** in 5 component tests, each with its own shape                                                                                                                                                                             | `mount…` helpers by the conventions, on `mountComponent`                                                        | 5     |
| **Steps repeated inside a file**: the scroll container faked with `getBoundingClientRect` in `ui_dom_test.ts`; zooming in twice with `'+'` in `useLightbox_dom_test.ts`                                                                       | Named steps in the file (`zoomIn(times)`), or the scenario                                                      | 5     |

The runner's own copies go in phase 1 too, as it moves onto `Io`: `escapeData` and `escapeProp`
(GitHub's workflow-command escapes) are in both `coverage.ts` and `testSummary.ts`; a path's leading
`./` is stripped by hand in `areas.ts`, `junit.ts` and `runTests.ts`; and two different `pct`s show
an area with nothing to cover as `—` in one table and `100.0` in the other. One module each
(`githubCommands.ts`, `relativePath`), and one way to show a percentage.

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

Every fake is disposable (`using fetch = fakeFetch(…)`, `await using dir = await tempDir()`;
[PLATFORM.md](PLATFORM.md)), so no test restores anything in a `finally`. `withDom.ts`,
`mountComposable.ts` and `mountComponent.ts` fold into the above. The scripts' `fakeIo` is already
in `script/lib/`; the runner's own `RunnerDeps` moves onto `Io` in phase 1.

## Phases

Each phase is one pull request: 100% lines and branches, all checks green, the four timezones, and
TESTING.md, TEST-PROCEDURES.md and `script/testRunner/` (tiers, areas) updated in the same PR.
Production code changes only where a test cannot reach it otherwise, and says so.

- [x] **0. Agree the rules.** (2026-10-27) Settle the decisions; the rules, the conventions and the
      promise list into TESTING.md; the words into GLOSSARY.md. _Done when_ merged.
- [ ] **1. The kit.** `testing/fakes/`, `settle`, one `mount.ts`; the four `fetch` fakes, seven
      console swaps and thirteen temporary folders moved onto it; the contract test against
      hand-swapped globals; the fixture archive and the phase-1 duplicates above (the script tests
      on the same `makeCollection` and scenarios as the site's). _Done when_ no test fakes the
      outside world by itself and no collection or bird is written out twice. In four pull requests:
  - [x] **1a. The fakes** (2026-10-27): `fakeFetch`, `captureConsole`, `tempDir` (each undone by
        `using`) and `settle`; every hand-made fake moved onto them;
        `oneWayToFake_contract_test.ts`.
  - [ ] **1b. Shared data:** one `makeCollection` for script and site tests, the fixture archive and
        scenarios, `fakeRepository`, git's answers in `fakeIo`, `imageSize`, `tempCollection`.
  - [ ] **1c. One way to mount:** `mount.ts` (`mountComponent`, `mountComposable`, `runInScope`
        folded in); the copied renderer in `injection_test.ts` goes.
  - [ ] **1d. The runner on `Io`:** `RunnerDeps` goes; the runner's own copies (GitHub escapes, path
        trimming, two `pct`s) fold.
- [ ] **2. One way to a browser.** The runner gives `_dom_test` files happy-dom; the 83 `withDom`
      calls go, and so does `withDom.ts`. _Done when_ no test sets its own environment.
- [ ] **3. Journeys.** The `journey` tier in `tiers.ts` and an area for it; `renderApp` on the
      fixture archive; J1–J9; the untested-files gate covers `.vue`. _Done when_ every component is
      exercised by a test and every journey passes. **The site overhaul starts after this** (the
      scripts overhaul is done).
- [ ] **4. Vue component tests.** Every `.vue` file gets its own `_dom_test.ts` beside it, for what
      a journey leaves open: every empty, loading and error state, the ARIA attributes, the keys,
      the emitted events. Mounted with `mountComponent` and fake stores; tests check what a visitor
      sees and does (text, ARIA state, clicks, events), not the markup. The 11 with no test today
      (the component-test list in TODO.md, moved here): - **shell:** `App.vue` (the loading, error
      and loaded screens), `Chrome`, `TopBar`, `SideNav` - **gallery:** `GalleryContent`,
      `LightBox` - **search:** `GlobalSearch`, `SearchResultsList`, `SearchDropdownHeader`,
      `SearchKeyboardHints` - **icons:** `LogoMark`

      Written against today's names; the site overhaul moves each test with its component. _Done
      when_ every `.vue` file has a test beside it and the untested-files gate counts `.vue` files
      as it counts `.ts`.

- [ ] **5. Split and rename.** `useLightbox_dom_test.ts` into one file per composable;
      `runTests_test.ts` by concern; the 116 `functionName:` titles rewritten as sentences; the 18
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
