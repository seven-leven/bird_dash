# TODO

Open work first, most urgent at the top, grouped by what it touches; everything done is at the
bottom, newest first. When an item is done, tick it and move it to **Done** with its date, in one
line; the CHANGELOG keeps the detail. Work big enough to need phases gets a plan of its own in this
folder, and the item here points to it.

## 🧭 Next: the overhauls, in this order

- [ ] **1. The tests, top down** ([TEST-OVERHAUL.md](TEST-OVERHAUL.md)). From the site's promises to
      journeys through the whole app, then features, units and contracts, with one kit for fakes,
      mounting and waiting. Phases 1–3 (the kit, one way to a browser, the journeys) come first:
      they are the safety net for everything below; phase 4 (a test beside every component) is done
      too (2026-10-28). Next: phase 5, splitting the long test files and renaming to the
      conventions, with **one table of tiers**: the environments (`node`, `dom`, later `browser`) as
      the base, each tier one of them plus what is its own, and the runner, `tierOf` and Vite's
      projects worked out from it; the report gains an area × tier grid. Also moves the test runner
      onto `Io`, the scripts overhaul's one exception.
- [ ] **2. Use the platform** ([PLATFORM.md](PLATFORM.md)). Done but for what needs the test
      overhaul's real browser (popovers, axe) and offline (once images are versioned).

## ✨ Features

### Collections that are not species lists

The practice series in the art notes are coming: Butterflies (colour pencil), Dynamic Animals (pen),
Sweet Treats (fineliner), Landscapes (pencil), Digital Value Studies, Movie Character Portraits.
Each is a numbered list of about 30 prompts in one medium, grouped by difficulty or week, and most
are not wildlife. "Every piece has its place from the start, drawn or not" already fits them, and
`groupLabel` ("Difficulty", "Week") already works; nothing in the code stands in the way.

- [ ] **The first series**, when its drawings are ready: a list, a `medium`, an icon and the images,
      by DATA.md's "Add a collection" recipe. No code change.

## 🗂️ Data and tooling

- [ ] **VitePress 2.0** when it is released: the docs site runs the 2.0 alpha, the one that shares
      the site's Vite 8.

## ✅ Done

**2026-10-29**

- [x] A footer in two rows: the archive and how far it has come beside one list of links, then the
      build in small print.
- [x] Local Node upgraded to 24.22.1, matching `.nvmrc` and CI.

**2026-10-28**

- [x] One kind of collection: no `kind`; every collection takes the same fields, and the About page
      names them all in one sentence. Decided with it: the name "Wildlife Illustrated" stays, and an
      illustrator's note is written straight into its list.
- [x] Proper group names: bird families as eBird names them, sharks by order, shells by class
      (groups named "Class", which the sidebar calls "Classes").
- [x] Images grouped by collection: every image folder (`raw_png/`, `full/`, `thumb/`, `small/`)
      already holds one folder per collection, as DATA.md lays out.
- [x] The script duplicates: the report frame in `lib/report.ts`, the logo sheet on the design
      guide's colours and text, one `svgDocument` for the five generators, one `readJson` (on `Io`,
      which the design guide now reads through).
- [x] Using the platform: the viewer a native `<dialog>`, Vue's `useId`, `useTemplateRef` and
      `defineModel`, colour roles with `light-dark()`, the files checked at the door, an error state
      for the whole app, a crossfade between pages, balanced headings, stricter types.
- [x] Warm paper: the site's neutral is `stone`, matching the guide's paper. With it the site
      overhaul is done, and its plan is deleted (the CHANGELOG keeps what each phase did).
- [x] The site overhaul's phases 6 to 8: `app/` places each feature, the styles one kind of rule a
      file, the layers and the naming checked by contract tests, `types/` gone.
- [x] A test beside every component (the test overhaul's phase 4), kept so by a contract test.
- [x] A `kind` per collection, the About page counting species and series apart, and an icon per
      series (the `kind` undone the same day: one kind of collection, above).
- [x] Placeholders as icons; one set of text roles; five type sizes; fewer stores per component.
- [x] Responsive thumbnails (240px beside the 400px), and several images per item in the viewer.

**2026-10-27**

- [x] A search result or a link to an item not drawn yet shows its tile, from a collection with
      nothing drawn, the month view or "drawn only" (found by the search journey).
- [x] The focus ring and the current marker reach 3:1 on a light page: `accent-700` there,
      `accent-500` on dark.
- [x] Dark mode draws the browser's own controls dark (`color-scheme`), the month names are English
      in any browser language, the phone's browser bar takes the top bar's colour, and the dark
      variant has its current spelling ([PLATFORM.md](PLATFORM.md) phase 1).

**2026-10-26**

- [x] The scripts overhaul: `ingest`, `build`, `generate` and `check`, each one job, on one `Io`,
      named to [SCRIPTS.md](../SCRIPTS.md), with a contract test for the naming.
- [x] The docs as a site, in the site's own design: VitePress at `/bird_dash/docs/`, built and
      link-checked in CI, sharing the site's tokens, accents, logo and icons.
- [x] The design guide's final pass (V5–V7): legible at the size it is read, the principles and the
      icons on one grid each, the radii and speeds read from the CSS.
- [x] Names as data: `item.names` (title, also, common, Latin), rendered by the tile, the viewer and
      search.
- [x] A page registry, `src/pages.ts`, instead of `'gallery' | 'about'` in six places.
- [x] Pages do not fetch: `fetchJson`, `useStats` and the `stats` store.
- [x] One footer, `AppFooter`, for the gallery and every page.
- [x] The lightbox's logic split into `useZoomPan`, `useDialogKeys` and `useDrawingNav`.

**2026-10-23 – 2026-10-24**

- [x] The weekly deep run fixed: `testTimeout` scales with `FC_RUNS_MULTIPLIER`.
- [x] The flaky 100% branch floor fixed: the same-day sort tie-break has a deterministic test.
- [x] Stale paths in the docs (the CHANGELOG header, the ARCHITECTURE diagram).
- [x] The UI in line with DESIGN.md: captions under the drawings, grey placeholders, "Drawn only"
      and "Nothing drawn yet", one sticky heading per section, one set of empty and loading states,
      search counts and match reasons, the month view newest first, the collection named on phones,
      links between drawings, a light viewer.
- [x] The design guide polished (numbering, Thaana in Faruma, the title as the signature, the
      specimen, one shape for the lower sections, the ending), with its tables tested against the
      code; DESIGN.md says the guide's paper and serif are its own voice.

**Earlier**

- [x] Global search: id, common, scientific and Dhivehi names (Thaana too), across collections, with
      counts and keyboard navigation.
- [x] The version derived at build time (patch from commits, the drawing count), so it cannot drift.
- [x] Date sorting: the viewer pages drawn items by drawn date.
- [x] Consistent thumbnail sizes.
- [x] Hash routing: `#<collection>` and `#<collection>/<item>` deep links.
- [x] The scroll-spy on `IntersectionObserver`.
- [x] `npm run changelog`, and the CHANGELOG scheme documented.
- [x] CI: lint, format and build on every pull request.
- [x] Lighthouse accessibility and SEO at 100.
- [x] Types extracted and named consistently.
