# TODO

## 🧩 Top Priority: Modular and Decoupled (planned 2026-10-26)

In this order: the first unblocks the non-species collections below, the next two make every new
page cheap.

- [x] **1. Names as data, not fields the components know.** `dhiv`, `dhiv_script` and `sci` are read
      by name in `ItemTile.vue`, `ItemSheet.vue`, `SearchResultsList.vue`, `useGlobalSearch.ts` and
      `collectionItems.ts`. Build each item's names once in `collectionItems.ts`, as a list of `{
      text, lang: 'dv' | 'en' | 'la', role: 'title' | 'also' | 'latin' }`, and have the tile, the
      viewer and search render whatever names an item has. A `series` piece then gives a title and
      its medium with no scientific name, and no component changes. The groundwork for `kind`.
      _Done:_ `src/lib/itemNames.ts` builds `item.names` (roles `title`, `also`, `common`, `latin`);
      the tile, the viewer and search render them. `useGlobalSearch` still matches on
      `commonName`/`scientificName`, which the link templates need anyway.
- [x] **2. A page registry instead of `'gallery' | 'about'` everywhere.** The About page is written
      into the `Page` type, the ui store, `useHashRoute`, `Chrome.vue`, `TopBar.vue` and
      `CollectionMenu.vue`. One list, `pages = [{ id: 'about', component, label }]`, drives the
      route, the nav item and the menu entry; Chrome renders `<component :is>`. A design page or a
      link to the docs site is then one entry, not six edits. _Done:_ `src/pages.ts`; the gallery
      stays the default page.
- [x] **3. Pages do not fetch.** `AboutPage.vue` fetches `stats.json` itself and borrows `getBase`
      from the collections composable. A `useStats` loader beside the collections loader, sharing
      one fetch-JSON helper, makes each page a plain view of a store; tests fake one thing instead
      of `fetch`. _Done:_ `lib/fetchJson.ts`, `useStats` and the `stats` store; the numbers now load
      once, not on every visit to About.
- [x] **4. One footer.** The gallery and the About page each have their own, already drifting (one
      has the version and commit). An `AppFooter` for both; it also shrinks `GalleryContent.vue`
      (223 lines, four stores) to the sections and the grid. _Done:_ `layout/AppFooter.vue`, with
      the pages from `src/pages.ts`; `GalleryContent` is 176 lines.
- [x] **5. Split the lightbox's logic.** `useLightbox.ts` (365 lines) holds three state machines:
      zoom and pan, the keyboard, moving between drawings. As three composables each is tested
      without a DOM, and the viewer can reuse them for a series' multiple images. _Done:_
      `useZoomPan`, `useDialogKeys` and `useDrawingNav`; `useLightbox` (136 lines) wires them and
      keeps the image's load state, under the same API, so `LightBox.vue` did not change.
- [ ] Afterwards: `Chrome`, `TopBar` and `GalleryContent` inject four stores each. Most of that goes
      with 2 and 4; look again then.

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

- [x] **Polish the design guide** (from a review of the manifesto, 2026-10-24). The direction is
      right, so refine rather than redesign. Done 2026-10-24. In order of impact:
  - [x] **Numbering:** the image shows 01, 02, 04 · 06, 05, 08, 09. Number its sections 1 to n in
        order, or drop the numbers and keep the titles.
  - [x] **Thaana in the image:** the Dhivehi type sample renders as broken glyphs, because the
        renderer has no Faruma. Load the font so the sample reads.
  - [x] **Title:** make it the signature. A large serif "Wildlife Illustrated" under a small tracked
        "DESIGN MANIFESTO" label. Serif for statements, sans for everything functional.
  - [x] **Principles:** a little more vertical room, so they read as the manifesto's main statements
        rather than an index.
  - [x] **Colour weight:** keep the ramps and the two theme cards; make the accent menu a slim strip
        with smaller labels.
  - [x] **Type section as a specimen:** "Lesser Whistling-Duck" as the hero, Dhivehi and English
        together, token names and sizes in a quiet side column.
  - [x] **One shape for the lower sections** (Form and motion, States, Icons, Tiles): a short line,
        one demonstration, the essential specs. States all at the same scale.
  - [x] **Ending:** more space above the closing line, set like the opening one.
  - [x] **DESIGN.md:** keep every rule, but move pure reference (the ramp hex table, the placeholder
        files) into a short reference section at the end, so the manifesto reads first.
  - [x] **Test the numbers:** check the ramp and contrast tables in DESIGN.md against `palette.ts`
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
  - [x] **Say what the guide's own look is:** the image uses warm paper and a serif, neither of
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
- [ ] **The docs as a site, in the site's own design** (decided 2026-10-26). Build `docs/` into
      static pages with Vite (VitePress, which is Vue and Vite like the site), themed by the design
      manifesto instead of the default theme, so the docs look like Wildlife Illustrated. The
      markdown stays the source, and GitHub keeps rendering it as now.
  - [ ] **The theme from the manifesto:** the same tokens as `src/styles/main.css` (slate ground,
        one accent, the six type sizes, 4px spacing, 6 and 12px corners), Faruma for Thaana, the
        logo mark, light and dark. Share the tokens rather than copy them, so the two cannot drift.
  - [ ] **DESIGN.md first:** it is the doc with a public audience. Its tables of colours, type and
        icons can render live from the real tokens and icon set instead of as text.
  - [ ] **Hosting:** Pages serves one site per repository, so build the docs into the same artifact
        under a subpath (`/bird_dash/docs/`) in `deploy.yml`, and add the docs build to `verify.yml`
        so a broken page fails CI like a broken site.
  - [ ] **Links to source files** (`../src/…`, `../script/…`) work on GitHub but not on a built
        site: rewrite them to GitHub URLs at build time, and fail the build on a dead link.
  - [ ] **Link it** from the site's footer and the About page, and from the README.
  - [ ] Pin VitePress exactly, like every other dependency (DECISIONS.md), and keep the 100%
        coverage floor meaningful: theme code is tested or excluded on purpose.
- [ ] **Collections that are not species lists** (planned 2026-10-26). The practice series in the
      art notes are coming: Butterflies (colour pencil), Dynamic Animals (pen), Sweet Treats
      (fineliner), Landscapes (pencil), Digital Value Studies, Movie Character Portraits. Each is a
      numbered list of about 30 prompts in one medium, grouped by difficulty or week, and most are
      not wildlife. "Every piece has its place from the start, drawn or not" already fits them, and
      `groupLabel` ("Difficulty", "Week") already works. Before the first one goes in:
  - [ ] **A `kind` per collection** in `collections.json`: `species` (today's: scientific and
        Dhivehi names, reference links) or `series` (the medium, the prompt, the challenge it
        belongs to). The viewer, search and the data contract test show and check the fields of each
        kind; `src/types/data.ts` holds both shapes.
  - [ ] **The name.** "Wildlife Illustrated" over a sweet-treats collection: keep it as the umbrella
        (wildlife is the core, the series are its studies), or keep the mark and the look and change
        the word. Decide before the first non-wildlife series ships; the logo, README, `index.html`
        and the About page all carry it.
  - [ ] **The About page's wording** for a series: "species", "Named in Dhivehi" and "Checked
        against references" describe `species` collections only. Count and name each kind on its
        own, as the page already counts collections past three.
  - [ ] **An icon per series** (a butterfly, a cake, a mountain, a sphere, a face, a running animal)
        for its emblem and placeholder silhouette, drawn to the icon rules (DESIGN.md §08), then
        `npm run placeholders`.
  - [ ] **The illustrator's note** can come from each piece's `## Result / reflection` in the art
        notes.

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
