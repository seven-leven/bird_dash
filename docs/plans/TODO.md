# TODO

## 🚀 High Priority (Fixes & Cleanup)

- [ ] **Fixes**:
  - [x] Version numbering logic — version is now derived at build time (patch = commit count,
        count = drawn illustrations), so it can no longer drift.
  - [x] Date sorting — the lightbox now pages drawn items chronologically (by drawn date), not by
        id.
  - [x] Thumbnail sizing inconsistencies.
- [ ] **Found 2026-10-23** (reading `main` after the Node migration):
  - [x] **Weekly deep run fails.** `nightly.yml` has failed since 2026-10-19 in all three timezones:
        three property tests in `src/composables/collection/useCollectionData_prop_test.ts` take
        6–11s at `FC_RUNS_MULTIPLIER=25` and hit Vitest's default 5s timeout (Deno had none). Scale
        the timeout with the multiplier, e.g. `testTimeout` in `vite.config.ts` or a timeout
        argument from `src/testing/propertyRuns.ts`. Normal CI is unaffected. _Fixed:_ `testTimeout`
        is 5s × `FC_RUNS_MULTIPLIER`.
  - [x] **The 100% branch floor is flaky.** One of four local `npm run test:coverage` runs reported
        99.9% of branches and failed; the other three were 100%. Find the branch that is only
        sometimes taken (likely reached by some generated inputs only, or timing-dependent) and give
        it a deterministic test, so CI cannot fail at random. _Fixed:_ it was the sort's tie-break
        for two drawings on the same day (`useCollectionData.ts`), reached only when a property test
        happened to generate equal dates; a unit test now covers it.
  - [ ] **Local Node is behind.** This machine runs Node 24.18.0; `.nvmrc` and `engines` require
        24.22.1 (raised from 24.22.0 on 2026-10-23). Everything passes, but upgrade to match CI.
  - [x] **Stale paths in the docs.** The `CHANGELOG.md` header points to
        `script/version/version.json` (now `base_version.json`); the diagram in
        `docs/ARCHITECTURE.md` lists `docs/` among the scripts (now `script/design/`).
- [ ] **Technical Debt**:
  - [x] URL/routing — hash routing (`#<collection>` / `#<collection>/<item>`) deep-links a
        collection or an item; deep-linking an item scrolls/opens it, and tiles/images are
        shareable.
  - [x] Scroll-spy via `IntersectionObserver` (with a throttled scroll fallback) — no per-event
        layout reads, and `content-visibility` virtualization can now be re-introduced safely.

- [x] **Bring the UI in line with DESIGN.md** (revised 2026-10-24): captions under the drawings,
      grey placeholders, "Drawn only" and "Nothing drawn yet", one sticky heading per section, one
      set of empty and loading states, search counts and match reasons, the date view newest first
      with empty runs folded, the collection named on phones, links between drawings, and a light
      viewer. Done 2026-10-24.

## 🏗️ Architecture & Features

- [x] **Search**: Global search (ID, common/scientific name, Dhivehi name + Thaana script) with
      cross-collection results, counters, and keyboard navigation.
- [ ] **Data**:
  - [ ] Add Conservation status (IUCN / Maldives Red List).
  - [ ] Add Seasonality data (Iruvai / Hulhangu).
- [ ] **Media**:
  - [ ] Add support for multiple images per item.

## 🛠️ Workflow & Tooling

- [x] **Ship Script**: `npm run changelog` inserts unlogged commits at the top of the newest
      changelog section.
- [x] **Docs**: `CHANGELOG.md` scheme documented; entries curated via the changelog task.
- [x] **CI**: lint / format / build run on every pull request.
- [x] **Accessibility & SEO**: Lighthouse to 100 (contrast, meta description, favicon).
- [ ] Proper group names throughout each collection. _(data task — needs correct taxonomy per item
      in `public/lists/*.json`)_
- [ ] Group images by collection, matching the storage layout. _(data/tooling task — needs a spec)_
- [x] Extract types.
- [x] Standardize names for all types (PascalCase interfaces per domain in `src/types/`; removed the
      stray `loadingState`).
- [ ] Responsive / higher-compression thumbnails (Lighthouse image-delivery, currently unscored).
- [ ] **Component tests (`.vue`)**: the `.ts` code is at 100% of lines, branches and functions. A
      component counts toward coverage once a test loads it; four do so far (at 100%). About 40–60
      tests to go, roughly 2–5 per component:
  - [x] `ui/` — `IdBadge`, `EmptyState`
  - [ ] `icons/` — `Icon` (done), `CollectionIcon`, `LogoMark`
  - [ ] `search/` — `GlobalSearch`, `SearchResultsList`, `SearchDropdownHeader`,
        `SearchKeyboardHints`
  - [ ] `gallery/` — `ItemTile` (done), `ItemSheet`, `GalleryContent`, `LightBox`
  - [ ] `layout/` — `Chrome`, `TopBar`, `SideNav`
  - [ ] `App.vue` — the loading, error and loaded screens
  - How: see `ItemTile_dom_test.ts` — a `// @vitest-environment happy-dom` line, then mount with
    Vue's `createApp` (Vitest compiles `.vue` files as the build does). Test what a visitor sees and
    does (text, ARIA state, clicks, emitted events), not the markup.
  - Keep the 100% floors: add `.vue` files to `discoverSources` (`script/test_runner/areas.ts`) one
    folder at a time, together with that folder's tests, so the untested-files gate and the floors
    cover each component the moment it has tests.
