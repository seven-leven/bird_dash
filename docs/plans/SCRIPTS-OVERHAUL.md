# Scripts overhaul

> **Status:** planned 2026-10-26; phases 0–2 done (the rules; the foundation, with `version` on it;
> `ingest`). Moves `script/` onto the rules in [SCRIPTS.md](../SCRIPTS.md), one pull request per
> phase. Delete this page when phase 7 is done; the CHANGELOG keeps what happened, and SCRIPTS.md
> stays as the rules.

## Why

The scripts work and are fully tested, but they grew one command at a time:

- **"Build" means three things.** `npm run build` takes in new drawings _and_ bundles the site;
  `build:assets` rewrites files git tracks (dates in the lists, `stats.json`); the docs site is a
  separate `docs:build` that only CI runs, so a local build has no docs.
- **One entry file, four jobs.** `script/build/build.ts` picks its work by flag (`--assets-only`,
  `--vite-only`, `--check`).
- **Generated files are scattered.** Placeholders, the design guide, the icon sheet, the logo files,
  the README's drawings row and `stats.json` each have their own command, their own place and their
  own check, or none. `draw_design_guide.ts` is 569 lines.
- **Shared things are repeated.** `'./public/collections.json'` is written out in 7 scripts; tests
  replace the outside world three different ways (`Steps`, `ChangelogIo`, `RunnerDeps`).
- **Names drift.** `get…`, `load…` and `read…` for the same act; `executeWork`, `WorkPlan`,
  `VersionData`; `col`, `res`, `f`; snake_case files in `script/`, camelCase in `src/`.

## Decisions

Settled 2026-10-26, each as recommended; DECISIONS.md has the entries.

| Question                                    | Decided                                              | Why                                                      |
| ------------------------------------------- | ---------------------------------------------------- | -------------------------------------------------------- |
| File names in `script/`                     | camelCase, named after the main export, as in `src/` | One rule for the whole repository (DECISIONS.md)         |
| The command that takes in new drawings      | `ingest`                                             | Says it takes things in and changes the repository       |
| Does a local `npm run build` build the docs | Yes                                                  | Local matches CI; it costs about 3 seconds               |
| Keep the old npm script names as aliases    | No                                                   | One person runs them; WORKFLOW.md changes in the same PR |

## Where it ends up

```
script/
  lib/         paths, project, io, cli (runner and reporter), collections, lists, git, fs
  ingest/      new drawings in: scanSources → planChanges → applyChanges, transcodeImages
  build/       the stages (site, docs) → dist/
  generate/    stats, placeholders, designGuide, iconSheet, logo, drawingsStrip, one file each
  check/       assets, generated files current
  docs/        the docs site's helpers (links, liveBlocks, accents)
  version/     version, lineNames
  changelog/   changelog
  testRunner/  runTests, tiers, areas, coverage, junit, testSummary
```

### npm scripts, before and after

| Before                                                                                      | After                                                                      |
| ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `build`                                                                                     | `build`: the site, then the docs, into `dist/`; never writes tracked files |
| `build:assets`                                                                              | `ingest`                                                                   |
| `build:vite`                                                                                | `build:site`                                                               |
| `docs:build`                                                                                | `build:docs`                                                               |
| `check`                                                                                     | `check`: assets, plus every generated file current                         |
| `placeholders`, `design`                                                                    | `generate`, `generate:<name>`                                              |
| `serve`                                                                                     | removed (the same as `preview`)                                            |
| `docs:dev`, `docs:preview`, `test*`, `version`, `changelog`, `lint`, `format*`, `typecheck` | unchanged                                                                  |

### Renames, file by file

| Now                                                                                        | After                                                                                                 |
| ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| `build/build.ts` `buildAssets`                                                             | `ingest/ingest.ts` `main`, `ingestDrawings`                                                           |
| `build/build.ts` `buildVite`, `cli`, `Steps`                                               | `build/build.ts` `main`, the stage list                                                               |
| `build/build.ts` `checkIntegrity`                                                          | `check/checkAssets.ts` `checkAssets`                                                                  |
| `build/scan_sources.ts` `scanCollection`, `CollectionState`, `toIds`                       | `ingest/scanSources.ts` `scanSources`, `SourceScan`, `toIds`                                          |
| `build/plan_changes.ts` `planWork`, `WorkPlan`, `blockingIssues`                           | `ingest/planChanges.ts` `planChanges`, `ChangePlan`, `countBlockingIssues`                            |
| `build/apply_changes.ts` `executeWork`, `ExecutionResult`, `FailedItem`                    | `ingest/applyChanges.ts` `applyChanges`, `AppliedChanges`, `Failure`                                  |
| `build/transcode_images.ts` `transcode`, `transcodeThumb`, `TranscodeResult`               | `ingest/transcodeImages.ts` `transcodeFull`, `transcodeThumb`, `Transcoded`                           |
| `build/print_build_summary.ts` `log`, `printSummary`, `printCheckReport`, `reportWarnings` | `lib/cli.ts` reporter; `ingest/formatIngestReport.ts`, `check/formatCheckReport.ts`                   |
| `build/collection_stats.ts` `computeStats`, `writeStats`, `statsAreCurrent`                | `generate/stats.ts` `computeStats`, `writeStats`; checked as a generated file                         |
| `design/draw_design_guide.ts` (guide, icon sheet, `wrap`, `contrastReport`)                | `generate/designGuide.ts`, `generate/iconSheet.ts`, `lib/svgText.ts` `wrapText`, `design/contrast.ts` |
| `design/draw_logo.ts`, `draw_drawings.ts`                                                  | `generate/logo.ts`, `generate/drawingsStrip.ts`                                                       |
| `placeholders/draw_placeholders.ts` `placeholderSvg`                                       | `generate/placeholders.ts` `drawPlaceholder`                                                          |
| `lib/lists.ts` `loadCollectionData`, `forEachDrawn`, `loadDrawnIds`                        | `readList`, `eachDrawnItem`, `readDrawnIds`                                                           |
| `version/version.ts` `getCommitCount`, `getDrawnIds`, `VersionData`, `VERSION_FILE`        | `countCommits`, `readDrawnIds` (from `lib/lists`), `Version`, `paths.baseVersion`                     |
| `version/line_names.ts` `loadLineNames`                                                    | `version/lineNames.ts` `readLineNames`                                                                |
| `changelog/changelog.ts` `run`, `cli`, `fileIo`, `ChangelogIo`                             | `main(args, io)` with the shared `Io`                                                                 |
| `test_runner/run_tests.ts` `main`, `RunnerDeps`, `withoutDots`                             | `testRunner/runTests.ts` `main(args, io)`, `toAreaPath`                                               |
| `test_runner/*` `formatConsole`, `formatMarkdown` (in three files)                         | `formatTiersText`, `formatCoverageText`, `formatAreasText`, and `…Markdown`                           |

Variables follow SCRIPTS.md as each file is touched: `col` → `collection`, `res` → `response`, `f` →
`file`, `s` → `summary`, `n` → `count`.

## Phases

Each phase is one pull request. In every one: behaviour unchanged unless the phase says otherwise,
100% lines and branches, all four checks green, files moved with `git mv` so history follows, and
the docs, WORKFLOW.md's command table and `areas.ts` updated in the same PR.

- [x] **0. Agree the rules.** Settle the decisions above; adjust SCRIPTS.md to match; add a
      DECISIONS.md entry ("ingest changes the repository, build does not"). Link SCRIPTS.md from
      ARCHITECTURE.md and the docs site's sidebar. _Done when_ the rules are merged.
- [x] **1. Foundation.** `lib/paths.ts`, `lib/project.ts`, `lib/io.ts` (one `Io`: files, git,
      processes, clock, console; `realIo` and a `fakeIo` in `src/testing/` or `script/lib/`) and
      `lib/cli.ts` (`main` runner, reporter, exit codes, `--dry-run`/`--verbose`/`--help`). Move
      `version` onto them as the pilot. _Done when_ `npm run version` runs through `lib/cli.ts` and
      no path in `version/` is written out. _Done:_ `fakeIo` is in `script/lib/`; `cli.ts` has the
      arguments, the exit codes and `--help`, and the reporter and `--dry-run` come with phase 2,
      where `ingest` first needs them; starting a process (Vite) comes with phase 3. The list
      helpers were renamed on the way (`readList`, `eachDrawnItem`, `readDrawnIds`), as were
      `lineNames.ts` and the version's functions (`countCommits`, `formatVersionLine`, `Version`).
- [x] **2. Ingest.** Out of `build.ts` into `ingest/`, with the renames above; `npm run ingest`
      replaces `build:assets` and gains `--dry-run`. WORKFLOW.md and DATA.md's recipes change to
      `ingest`. _Done when_ nothing under `build/` writes a tracked file. _Done:_ `script/ingest/`
      (`scanSources`, `planChanges`, `applyChanges`, `transcodeImages`, `formatIngestReport`,
      `ingest`); `build` is the site alone until phase 3 adds the docs, and `build:vite` went with
      `build:assets`. `collection_stats.ts` moved onto `Io` but stays in `build/` until phase 4, and
      the check's report (`printCheckReport.ts`) until phase 5. `paths.raw` is `paths.sourceArt`.
- [ ] **3. Build stages.** `build/build.ts` runs a list of stages (`site`, `docs`), all by default
      or the ones named (`npm run build -- docs`); one helper starts Vite and VitePress with this
      Node. `build` now includes the docs; `verify.yml` calls `npm run build`. _Done when_ a local
      `npm run build` gives the same `dist/` as CI.
- [ ] **4. Generate.** Every generator under `generate/`, one file per output, the design guide
      split up; `npm run generate` runs them all, `generate:<name>` one. `stats.json` is generated
      here (and `ingest` calls it). One contract test: every generated file is current. _Done when_
      `placeholders` and `design` are gone and the old per-file "is current" tests are folded in.
- [ ] **5. Check.** `npm run check` runs every read-only check (assets, generated files) and reports
      in one voice; one CI step. _Done when_ `check` is the only integrity command.
- [ ] **6. The rest.** `testRunner/`, `changelog/` and `version/` renamed to the rules and moved
      onto the shared `Io`; the three `format*` pairs in the runner named apart. Mostly renames; the
      runner's output is unchanged. _Done when_ no `get…`, `load…`, `run`, `cli` or snake_case file
      is left in `script/`.
- [ ] **7. Close.** A contract test for the naming rules that can be checked mechanically (file name
      matches its main export; no banned verb at the start of an exported function); the command
      table in WORKFLOW.md grouped by job; this page deleted. _Done when_ SCRIPTS.md's status note
      can go.

## What keeps it safe

- **The tests check behaviour, not names.** A rename that changes what a command does fails a test.
- **The docs build fails on a dead link**, so a moved file that a page links to is caught in CI.
- **The area test fails on a file left out of an area** (`script/test_runner/areas.ts`).
- **One phase at a time.** Each PR is small enough to review, and the site deploys after each one.

## Not in this plan

- The site's code (`src/`): it already follows ARCHITECTURE.md.
- Splitting CI into parallel jobs: the whole run takes under a minute. When it is needed, keep the
  four required check names, or change branch protection in the same PR.
- New features in the commands. A phase that finds one worth adding notes it in TODO.md.
