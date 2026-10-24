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

- [ ] **Bring the UI in line with DESIGN.md** (the guide was revised on 2026-10-24 after a walk
      through the site; these are the places the code does not follow it yet). Three pull requests:
  - [ ] **Tiles and states** (DESIGN.md §9, "The one idea"):
    - [ ] Names move from the shaded overlay into a caption under the image; Dhivehi and English
          always shown (English is hover-only on desktop today). `ItemTile.vue`.
    - [ ] Undrawn tiles: grey surface, no shading or shadow, muted caption (`slate-600` in light).
    - [ ] Light placeholders drawn on `slate-100`, not white: change `THEMES` in
          `script/placeholders/draw_placeholders.ts`, run `npm run placeholders` and `npm run
          design`.
    - [ ] A collection that is mostly gaps: "15 of 204 drawn" above the grid and a "Drawn only"
          switch; one with none drawn shows "Nothing drawn yet" (Sharks is 42 identical icons).
  - [ ] **Headings, empty and loading states** (§10, §11, §6):
    - [ ] One heading per section: the sticky bar repeats the section heading below it.
    - [ ] Bug: in the date view the sticky bar keeps the family name from the other view.
    - [ ] Empty states: one wording per situation, sidebar and main area agreeing (today "No items
          found" beside "No drawings found"); `noResults` only for searches (it is used for errors
          and empty collections too); "Couldn't load data" names the collection and offers "Try
          again".
    - [ ] Loading: placeholder rows in the sidebar instead of "0 of 0 drawn".
    - [ ] The header's colour transition uses `duration-slow`; colour changes are `duration-fast`.
  - [ ] **Search, the date view, phones and the viewer** (§3, §10):
    - [ ] Search dropdown: thumbnails or a "not drawn yet" mark, the group named when that is what
          matched, and "10 matches, 1 drawn" in its header.
    - [ ] Date view newest first; runs of three or more empty months fold into one row.
    - [ ] Phone header: the logo mark and the current collection's name.
    - [ ] Viewer: "#11"-style references in notes link to the drawing; the counter says when a
          search narrows it ("1 of 1 · matching 'plover'").
  - Each is a good place for the first component tests (TODO below): `ItemTile` and `EmptyState` are
    rewritten anyway.

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
- [ ] **Component tests (`.vue`)**: the `.ts` code is at 100% of lines, branches and functions, but
      no test loads the 17 components yet, so they are outside the coverage numbers. About 50–70
      tests, roughly 2–5 per component:
  - [ ] `ui/` — `IdBadge`, `EmptyState` (start here: small, no state)
  - [ ] `icons/` — `Icon`, `CollectionIcon`, `LogoMark`
  - [ ] `search/` — `GlobalSearch`, `SearchResultsList`, `SearchDropdownHeader`,
        `SearchKeyboardHints`
  - [ ] `gallery/` — `ItemTile`, `ItemSheet`, `GalleryContent`, `LightBox`
  - [ ] `layout/` — `Chrome`, `TopBar`, `SideNav`
  - [ ] `App.vue` — the loading, error and loaded screens
  - How: mount with Vue's DOM renderer under `withDom` (Vitest already compiles `.vue` files as the
    build does), or add `@vue/test-utils`. Test what a visitor sees and does (text, ARIA state,
    clicks, emitted events), not the markup.
  - Keep the 100% floors: add `.vue` files to `discoverSources` (`script/test_runner/areas.ts`) one
    folder at a time, together with that folder's tests, so the untested-files gate and the floors
    cover each component the moment it has tests.
  - While in `GalleryContent.vue`: the tile `v-memo` sits inside the section loop, where Vue cannot
    use it (marked with an ESLint comment). Move it or remove it.
