# Roadmap to 100% coverage

Where the tests stand, exactly what is left, and the order to close it in. Measured on 14 October
2026, with every open test pull request (#43, #44, #45) included.

## Where we are

| Measure        | Now   | Covered / total | Left             |
| -------------- | ----- | --------------- | ---------------- |
| Lines          | 97.5% | 1,342 / 1,376   | 34               |
| Branches       | 89.3% | 654 / 732       | 78 untaken sides |
| Functions      | 96.8% | 391 / 404       | 13               |
| Untested files | 0     |                 | 0                |
| Tests          | 327   |                 |                  |

Measured on 16 October 2026 with Vitest (V8 coverage), after the move to Node. The floor that fails
CI is **96% of lines**; there is no floor yet for branches. Earlier numbers were measured under
Deno, which counted lines differently and never measured the test runner (it took any file named
`test.ts` for a test). The test runner's `main` and the placeholder command are now tested (they
were the two least covered files, at 22% and 36%), so phase 3's table below is partly done; its line
numbers predate the move.

Reproduce these numbers with `npm run test:report` and open `test-results/report.md`.

## What "100%" means here

There are three numbers, and they are not the same goal:

1. **100% of lines** (every line runs in some test). Reachable for the `.ts` code; phases 1 to 3.
2. **100% of branches** (every `if`, `??` and `?.` taken both ways). Harder: some branches are
   defensive guards that cannot happen in practice. Phase 4.
3. **The components** (`.vue` files) are measured only when a test imports one, and none does yet.
   The numbers above say nothing about them. Phase 5 covers them, and is a different kind of work.

"100%" also does not mean "no bugs". Coverage proves a line ran, not that a test checked its result.
Every phase below keeps the existing rule: break the code on purpose once and see the new test fail.

## Phase 1: the small gaps (about 20 lines, a day)

Each of these is one or two tests with no refactoring.

| File                                              | Uncovered    | What it is                                                                                                   | Test to add                                                                                         |
| ------------------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| `script/lib/fs.ts`                                | 16–17, 26–28 | The re-throw when a folder cannot be read or created for a reason other than "missing" / "exists"            | Point `listFiles` at a file instead of a folder; point `ensureDir` at a path under an existing file |
| `script/build/apply_changes.ts`                   | 59–62        | A thumbnail repair that fails                                                                                | Plan a thumb repair for an id whose full image is missing                                           |
| `script/design/draw_design_guide.ts`              | 172–174      | An accent on the menu with no hex values                                                                     | Call the guide with a menu containing an unknown hue (make the menu an argument)                    |
| `src/composables/collection/useCollections.ts`    | 34, 63, 96   | No active collection before init; the cache hit inside the loader; switching to the collection already shown | Read `activeCollection` before `init`; switch to the current collection; load a cached one twice    |
| `src/composables/core/useHashRoute.ts`            | 46           | Clearing the hash with `history.replaceState`                                                                | Close the viewer on a page whose hash is only an item                                               |
| `src/composables/ui/useScrollLogic.ts`            | 17, 24       | Measuring with no container, and a header slot that is `null`                                                | Call the observer callback before a container is bound; register a `null` header                    |
| `src/composables/collection/useCollectionData.ts` | 103          | A drawn item with no usable date in the date view                                                            | Date view with an item whose `drawn` is not a real date                                             |

Expected after phase 1: about **97%** of lines. Raise the floor to 96%.

## Phase 2: the viewer's gestures (24 lines, a day or two)

All in `src/composables/ui/useLightBox.ts`. The fake DOM has no `requestAnimationFrame` timing and
no real pointer capture, which is why these were skipped.

| Lines            | What it is                                                                                              | How to test it                                                                                                                                 |
| ---------------- | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| 156–159, 328–332 | Cancelling a pending pan frame; cleanup when the viewer unmounts                                        | Stub `requestAnimationFrame` / `cancelAnimationFrame` with a queue the test flushes by hand; mount with `mountComposable` and unmount mid-drag |
| 191, 199, 202    | A move from a pointer that was never pressed; moves while not dragging; a second move in the same frame | Send `pointermove` without `pointerdown`; drag twice before flushing the frame queue and check only one update lands                           |
| 211, 218         | Lifting a pointer that was never pressed; a swipe that is too short                                     | `pointerup` without `pointerdown`; a 20px swipe                                                                                                |
| 237–241, 246–249 | Tab with nothing focusable in the dialog; Tab when focus is outside the dialog                          | A dialog with no buttons; focus an element outside, then press Tab                                                                             |
| 260              | A key press while the viewer is closed, after it was opened once                                        | Open, close, press `+`                                                                                                                         |

Expected after phase 2: about **98%**. Raise the floor to 97%.

## Phase 3: the command entry points (about 60 lines, a day)

What is left after phases 1 and 2 is almost entirely code that starts other programs or runs only
from the command line.

| File                                                             | Uncovered | What it is                                                | Plan                                                                                                                                   |
| ---------------------------------------------------------------- | --------- | --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `script/build/build.ts`                                          | 59–76     | `spawnVite`, which runs the real `vite build`             | Either a contract test that runs the real build into a temporary `outDir` (adds about a second), or mark it as an accepted gap (below) |
| `build.ts`, `changelog.ts`, `version.ts`, `draw_design_guide.ts` | 1–5 each  | The `if (import.meta.main)` line that starts each command | Cannot run inside a test process. Mark as an accepted gap                                                                              |

**Accepted gaps.** Vitest's V8 coverage honours two comments: `/* v8 ignore next */` skips the next
line, and `/* v8 ignore start */` … `/* v8 ignore stop */` skips a block. Use them only for code
that starts a program or a subprocess, never for logic, and say why:

```ts
// The command's entry point; cli() itself is tested.
/* v8 ignore next */
if (import.meta.main) process.exit(await cli(process.argv.slice(2)));
```

They remove lines from the line count only; a branch on an ignored line still counts as untaken.
Keep the list of ignored lines in this file, so "100%" never quietly means "100% of what we chose to
count".

Expected after phase 3: **100% of lines.** Set the floor to 100%.

## Phase 4: every branch (about 65 lines, two or three days)

Branch coverage counts both sides of every `if`, `??`, `?.` and `&&`. The uncovered ones fall into
three kinds:

| Kind                              | Examples                                                                                                                                                    | What to do                                                                                   |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| **Real behaviour not yet tested** | the viewer's key and gesture guards; `useCollections` choosing the first collection when the id is unknown; `test_summary.ts` formatting with no slow tests | Write the test                                                                               |
| **Defaults for missing data**     | `r.sci ?? ''`, `item.meta?.dhiv`, `illustratorNote ?? ''` in `collectionItems.ts`; `attrs.line ?? 0` in `junit.ts`                                          | One test with the field missing                                                              |
| **Guards that cannot happen**     | `errorMessage` given something that is not an `Error` (`error.ts`, 50%); `globalThis.matchMedia?.` in `useTheme.ts`                                         | Remove the guard if the type system already rules it out; otherwise test it once and keep it |

Work file by file, starting with the lowest: `script/lib/error.ts` (50%),
`script/test_runner/junit.ts` (67%), `useCollections.ts` (84%), `script/test_runner/test_summary.ts`
(88%), `collectionItems.ts` (88%), `script/test_runner/areas.ts` (88%), `useLightBox.ts` (88%).

The runner checks lines only. Add a branch floor with it: a `--min-branches=N` flag beside
`--min-lines` in `script/test_runner/run_tests.ts`, starting at today's 89% and raised as each file
is finished.

Expected after phase 4: **100% of branches**, with any remaining guard listed here with a reason.

## Phase 5: the components (a week, a new kind of test)

The 2,702 lines above are the `.ts` code. The `.vue` components (header, sidebar, grid, tiles,
viewer, search dropdown) are about 1,400 more lines that no number measures. Their logic is mostly
in the tested composables and stores; what is not covered is how they are put together on screen.

The plan is a fifth tier, **browser**, with files named `x_browser_test.ts`:

1. **Run the real site** with `npm run preview` and drive it with a headless Chrome (Astral,
   `jsr:@astral/astral`, which was tried early on and works with an installed Chrome).
2. **Start with the journeys a visitor takes:** open the site, switch collection, search and pick a
   result, open a drawing and page through it, follow a shared link, switch theme, use it at phone
   width.
3. **Check what only a browser can:** the header fits at 375px, nothing scrolls sideways, focus is
   visible, the scroll-spy follows real scrolling.
4. **Add it to CI** as its own job after the build, so a slow browser does not hold up the fast
   tiers.

A browser tier does not add to the coverage number either. The measure for this phase is a checklist
of journeys, each with a test, kept in `docs/TESTING.md`.

## Order and floors

| After   | Lines floor | Branches floor | Tests (estimate)       |
| ------- | ----------- | -------------- | ---------------------- |
| Today   | 96%         | none           | 327                    |
| Phase 1 | 96%         | none           | ~325                   |
| Phase 2 | 97%         | none           | ~340                   |
| Phase 3 | 100%        | none           | ~350                   |
| Phase 4 | 100%        | 100%           | ~390                   |
| Phase 5 | 100%        | 100%           | + ~10 browser journeys |

Phases 1 to 3 are worth doing: each closes a real gap for little effort. Phase 4 has diminishing
returns past about 97%; finish it if a branch has caused a bug, or when the files are being changed
anyway. Phase 5 is where the remaining real risk is, because that is the code nobody measures today.

## Keeping it there

- **The floors only go up.** Raise them at the end of each phase; never lower one to get a pull
  request through.
- **No new untested file.** Already enforced: the coverage run fails and names it.
- **New code comes with its tests.** Once at 100%, any untested line fails the floor, so this is
  enforced automatically too.
- **Update this file** when a phase is done, with the date and the numbers.
