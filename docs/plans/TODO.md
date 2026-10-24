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

- [ ] **Polish the design guide** (from a review of the manifesto, 2026-10-24). The direction is
      right, so refine rather than redesign. In order of impact:
  - [ ] **Numbering:** the image shows 01, 02, 04 · 06, 05, 08, 09. Number its sections 1 to n in
        order, or drop the numbers and keep the titles.
  - [ ] **Thaana in the image:** the Dhivehi type sample renders as broken glyphs, because the
        renderer has no Faruma. Load the font so the sample reads.
  - [ ] **Title:** make it the signature. A large serif "Wildlife Illustrated" under a small tracked
        "DESIGN MANIFESTO" label. Serif for statements, sans for everything functional.
  - [ ] **Principles:** a little more vertical room, so they read as the manifesto's main statements
        rather than an index.
  - [ ] **Colour weight:** keep the ramps and the two theme cards; make the accent menu a slim strip
        with smaller labels.
  - [ ] **Type section as a specimen:** "Lesser Whistling-Duck" as the hero, Dhivehi and English
        together, token names and sizes in a quiet side column.
  - [ ] **One shape for the lower sections** (Form and motion, States, Icons, Tiles): a short line,
        one demonstration, the essential specs. States all at the same scale.
  - [ ] **Ending:** more space above the closing line, set like the opening one.
  - [ ] **DESIGN.md:** keep every rule, but move pure reference (the ramp hex table, the placeholder
        files) into a short reference section at the end, so the manifesto reads first.
  - [ ] **Test the numbers:** check the ramp and contrast tables in DESIGN.md against `palette.ts`
        and `contrastReport()`, so they cannot drift.
  - Don't: add colours or illustrations, use serif everywhere, put every section in a card, or drop
    a rule only to shorten the page.

- [ ] **Simplify the design system** (proposed 2026-10-24, on hold while the manifesto settled).
      Each one removes a rule from DESIGN.md; update the guide and its image along with the code.
  - [ ] **One set of text roles:** `.text-strong`, `.text-body` and `.text-muted`, each with its
        light and dark value, replace `.viewer-title/-body/-label` (main.css, `LightBox`,
        `ItemSheet`), so the viewer and the page share one vocabulary.
  - [ ] **Placeholders as icons:** draw an undrawn tile (and a failed load, and a search row) as
        `CollectionIcon` in the muted colour on the tile grey, instead of a generated image. Then
        remove `public/placeholders/`, `script/placeholders/` and its tests, `npm run placeholders`,
        `tileImage`'s placeholder URLs, and the guide's overlays and their checks.
  - [ ] **Five type sizes:** drop `text-micro` (11px) and use `text-xs` for `.caps-label`,
        `.count-pill` and `.kbd-hint`. Check that they still fit at 375px.
  - [ ] **Warm paper on the site:** swap the neutral ramp from slate to stone, so the site matches
        the guide's paper. Stone keeps the contrast rules (`stone-500` on white is 4.8:1,
        `stone-400` on `stone-950` 7.8:1). Change main.css, `palette.ts`, the placeholder colours
        and DESIGN.md together; as its own commit, so it is easy to drop.
  - [ ] **Say what the guide's own look is:** the image uses warm paper and a serif, neither of
        which is a site token. Add one line to DESIGN.md saying the guide is printed in its own
        voice and the site's tokens are the swatches on it (or, with warm paper on the site, that
        the paper is the site's own).

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
