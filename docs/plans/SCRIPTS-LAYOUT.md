# Reorganizing `script/`

A plan to give `script/` one consistent layout and file names that explain themselves.

Status: **proposed**. Nothing here has been done yet.

## Problems today

1. **Entry points are hard to spot.** The seven files that tasks run sit at different depths:
   `build.ts`, `changelog.ts` and `test.ts` at the root; `version/compute.ts`,
   `placeholders/generate.ts` and `docs/design_guide.ts` one level down.
2. **Folders mix three axes**: a build stage (`pipeline/`, `image/`), a data domain (`collection/`),
   and an output (`docs/`, `placeholders/`).
3. **`image/transcode.ts` is used only by the build pipeline** but has a folder of its own.
4. **`script/docs/` reads like `docs/`**, but it draws the design-system images.
5. **`script/test.ts` sits beside `script/test/`**, so the runner and its parts read as two
   different things.
6. **`script/test/helpers/` is mostly used by `src/` tests** (22 of 23 importers), not by scripts.
7. **`collection/registry.ts` holds `VERSION_FILE` and `CHANGELOG_FILE`**, which are unrelated to
   collections.
8. **Generic file names** (`plan.ts`, `execute.ts`, `report.ts`, `generate.ts`, `layout.ts`,
   `prop.ts`) say nothing when seen alone in an editor tab or a stack trace.

## Rules

- One folder per command; shared code with no entry point goes in `lib/`.
- A file's name says what it does without its folder. Entry points are named after their command. No
  `main.ts`, `index.ts` or one-word verbs.
- snake_case, matching `design_guide.ts` and `*_test.ts`.
- A test file is named after its module (`plan_changes.ts` → `plan_changes_test.ts`); tier suffixes
  (`_dom_test`, `_prop_test`, `_contract_test`) are unchanged.
- Script names do not change; only the paths behind them in `package.json` do.

## Target layout

```
script/
  lib/
    fs.ts  git.ts  error.ts
    collections.ts           the collection list and each one's file paths
    lists.ts                 read/write public/lists/<id>.json
  build/
    build.ts                 npm run build / build:assets / build:vite / check
    scan_sources.ts          what is in raw_png/ vs what is registered
    plan_changes.ts          decide what to add, transcode, skip
    apply_changes.ts         do it
    print_build_summary.ts   the table at the end of a build
    transcode_images.ts      PNG → full + thumb WebP
  version/
    version.ts               compute + `npm run version` (vite.config.ts imports it)
    base_version.json        major.minor only; the rest is derived
  changelog/
    changelog.ts             npm run changelog
  design/
    draw_design_guide.ts     npm run design
    draw_logo.ts
    icon_grid.ts             lays icons out in aligned columns
    palette.ts               colours + contrast maths
  placeholders/
    draw_placeholders.ts     npm run placeholders
  test_runner/
    run_tests.ts             npm test*
    tiers.ts  areas.ts
    junit.ts                 parse JUnit XML
    coverage.ts              parse LCOV, tables, HTML report
    test_summary.ts          the per-tier console + markdown summary
src/test_helpers/
  with_dom.ts                fake DOM around a test
  mount_composable.ts        run a composable inside a real component
  fixtures.ts                sample collections and items
  property_runs.ts           fast-check with the nightly run multiplier
```

## Old → new

| Now                                           | Proposed                                   |
| --------------------------------------------- | ------------------------------------------ |
| `script/build.ts`                             | `script/build/build.ts`                    |
| `script/pipeline/scan.ts`                     | `script/build/scan_sources.ts`             |
| `script/pipeline/plan.ts`                     | `script/build/plan_changes.ts`             |
| `script/pipeline/execute.ts`                  | `script/build/apply_changes.ts`            |
| `script/pipeline/report.ts`                   | `script/build/print_build_summary.ts`      |
| `script/image/transcode.ts`                   | `script/build/transcode_images.ts`         |
| `script/collection/registry.ts`               | `script/lib/collections.ts`                |
| `script/collection/record.ts`                 | `script/lib/lists.ts`                      |
| `script/version/compute.ts`                   | `script/version/version.ts`                |
| `script/version/version.json`                 | `script/version/base_version.json`         |
| `script/changelog.ts`                         | `script/changelog/changelog.ts`            |
| `script/docs/design_guide.ts`                 | `script/design/draw_design_guide.ts`       |
| `script/docs/logo.ts`                         | `script/design/draw_logo.ts`               |
| `script/docs/layout.ts`                       | `script/design/icon_grid.ts`               |
| `script/docs/palette.ts`                      | `script/design/palette.ts`                 |
| `script/placeholders/generate.ts`             | `script/placeholders/draw_placeholders.ts` |
| `script/test.ts`                              | `script/test_runner/run_tests.ts`          |
| `script/test/report.ts`                       | `script/test_runner/test_summary.ts`       |
| `script/test/{tiers,areas,junit,coverage}.ts` | `script/test_runner/` (same names)         |
| `script/test/helpers/dom.ts`                  | `src/test_helpers/with_dom.ts`             |
| `script/test/helpers/mount.ts`                | `src/test_helpers/mount_composable.ts`     |
| `script/test/helpers/fixtures.ts`             | `src/test_helpers/fixtures.ts`             |
| `script/test/helpers/prop.ts`                 | `src/test_helpers/property_runs.ts`        |

`VERSION_FILE` moves to `version/version.ts` and `CHANGELOG_FILE` to `changelog/changelog.ts`.

## Steps

1. **Moves only**, one commit, with `git mv` so history follows each file. Tests move with their
   modules.
2. **Fix paths**, a second commit:
   - relative imports (about 30) in the moved files and their tests;
   - script paths in `package.json`;
   - the import in `vite.config.ts`;
   - the area path rules in `script/test_runner/areas.ts`, and delete the `script/test.ts` special
     case (the runner is now measured);
   - the exclusion for test helpers in `script/test_runner/coverage.ts` (now `src/test_helpers/`);
   - path mentions in `README.md`, `docs/ARCHITECTURE.md`, `docs/TESTING.md`,
     `docs/TEST-PROCEDURES.md`, `docs/README.md` and comments that name old files.
3. **Verify**: `npm run lint`, `npm run format:check`, `npm run typecheck`, `npm run test:coverage`,
   `npm run check`, `npm run build`, `npm run design` (no image changes), and `npm run version`
   prints the same version as before.

Areas keep their names, so test reports stay comparable before and after.

## Relation to other plans

Do this **before** [MIGRATION.md](MIGRATION.md): porting to Node touches every one of these files,
and porting into the final layout means each file is moved once. The coverage roadmap's per-file
lists ([COVERAGE-ROADMAP.md](COVERAGE-ROADMAP.md)) will need their paths updated afterwards.

## Done when

- Every script in `package.json` runs a file named after it.
- No file in `script/` is named `main`, `index`, `plan`, `execute`, `report`, `generate` or
  `layout`.
- No special case for `script/test.ts` remains in `areas.ts`, and the runner shows up in coverage.
- All checks above pass and the build output is unchanged.
