# TODO

Open work first, most urgent at the top, grouped by what it touches; everything done is at the
bottom, newest first. When an item is done, tick it and move it to **Done** with its date, in one
line; the CHANGELOG keeps the detail. Work big enough to need phases gets a plan of its own in this
folder, and the item here points to it.

## 🔧 Fix now

- [ ] **The focus ring on a light page** (found 2026-10-26, in the design guide's final review).
      `.focus-ring` draws `accent-500`, which is below WCAG's 3:1 for a focus indicator on white for
      teal (2.42:1, the Birds' accent), emerald (2.47), sky (2.71) and orange (2.89); every hue
      passes on dark. Draw the ring (and the current-item marker) in `accent-700` on light surfaces
      (5.2:1 or more for every hue), keep `500` on dark; update DESIGN.md's colour rule, the palette
      contract test and the guide.
- [ ] **Local Node is behind.** This machine runs Node 24.18.0; `.nvmrc` and `engines` require
      24.22.1. Everything passes, but upgrade to match CI.

## 🧭 Next: the overhauls, in this order

- [ ] **1. The tests, top down** ([TEST-OVERHAUL.md](TEST-OVERHAUL.md)). From the site's promises to
      journeys through the whole app, then features, units and contracts, with one kit for fakes,
      mounting and waiting. Phases 1–3 (the kit, one way to a browser, the journeys) come first:
      they are the safety net for everything below. Phase 4 is the **Vue component tests**: the 11
      components that have no test of their own yet. Also moves the test runner onto `Io`, the
      scripts overhaul's one exception.
- [ ] **2. The site's code, the same way** ([SRC-OVERHAUL.md](SRC-OVERHAUL.md)). `src/` by feature
      (`viewer/`, `search/`, `gallery/`, …) over pure `domain/`, `data/`, `browser/` and `ui/`
      layers, one word per idea, in nine phases. Most features below ride along with it, each as its
      own pull request straight after the phase that prepares it ("Features that ride along").
      Includes fewer stores per component (`Chrome`, `TopBar` and `GalleryContent` inject four each
      today), after phase 3.
- [ ] **3. Use the platform** ([PLATFORM.md](PLATFORM.md)). What Node 24, TS 6, Vite 8, Vue 3.5,
      Tailwind 4 and the browser give that the code does not use yet (`<dialog>` for the viewer,
      popovers, `defineModel`, `useId`, `using` in the test kit, `util.parseArgs`, `light-dark()`
      colour tokens), and the general improvements found with them: the data checked at the door, an
      error state for the whole app, axe in the browser tier, a size budget, a link preview per
      drawing, a Content-Security-Policy. Most rows ride along with the two overhauls; its own
      phases are the fixes above, Node in the scripts, the checks, and stricter types last.

## ✨ Features

### Collections that are not species lists

The practice series in the art notes are coming: Butterflies (colour pencil), Dynamic Animals (pen),
Sweet Treats (fineliner), Landscapes (pencil), Digital Value Studies, Movie Character Portraits.
Each is a numbered list of about 30 prompts in one medium, grouped by difficulty or week, and most
are not wildlife. "Every piece has its place from the start, drawn or not" already fits them, and
`groupLabel` ("Difficulty", "Week") already works. Before the first one goes in:

- [ ] **The name** (a decision, not code; first). "Wildlife Illustrated" over a sweet-treats
      collection: keep it as the umbrella (wildlife is the core, the series are its studies), or
      keep the mark and the look and change the word. The logo, README, `index.html` and the About
      page all carry it.
- [ ] **A `kind` per collection** in `collections.json` (after the site overhaul's phase 1):
      `species` (today's: scientific and Dhivehi names, reference links) or `series` (the medium,
      the prompt, the challenge it belongs to). The viewer, search and the data contract test show
      and check each kind's fields; the file shapes hold both.
- [ ] **An icon per series** (after phase 4): a butterfly, a cake, a mountain, a sphere, a face, a
      running animal, drawn to the icon rules (DESIGN.md §08), for the emblem and the placeholder.
- [ ] **The About page by kind** (after phase 5): "species", "Named in Dhivehi" and "Checked against
      references" describe `species` collections only; count and name each kind on its own.
- [ ] **The illustrator's note** can come from each piece's `## Result / reflection` in the art
      notes.

### The viewer

- [ ] **Several images per item** (after phase 5): a series piece, or a drawing with its sketches;
      the viewer pages through an item's images with the same zoom and keys.

### Images

- [ ] **Responsive, smaller thumbnails** (Lighthouse image delivery, unscored today): `npm run
      ingest` makes a second, smaller size and higher compression; the tiles take it through
      `srcset` (after phase 5).

## 🎨 Simplify the design system

Proposed 2026-10-24, held while the manifesto settled. Each one removes a rule from DESIGN.md;
update the guide and its image with the code. All ride along with the site overhaul.

- [ ] **Placeholders as icons** (after phase 4): an undrawn tile, a failed load and a search row
      draw `CollectionIcon` in the muted colour on the tile grey, instead of a generated image; then
      `public/placeholders/`, its generator and tests, `tileImage`'s URLs and the guide's overlays
      go.
- [ ] **One set of text roles** (after phase 7): `.text-strong`, `.text-body` and `.text-muted`,
      each with its light and dark value, replace `.viewer-title/-body/-label`, so the viewer and
      the page share one vocabulary.
- [ ] **Five type sizes** (after phase 7): drop `text-micro` (11px) and use `text-xs` for
      `.caps-label`, `.count-pill` and `.kbd-hint`; check that they still fit at 375px.
- [ ] **Warm paper on the site** (after phase 7, its own commit so it is easy to drop): swap the
      neutral ramp from slate to stone, so the site matches the guide's paper. Stone keeps the
      contrast rules (`stone-500` on white 4.8:1, `stone-400` on `stone-950` 7.8:1); change
      `main.css`, `palette.ts`, the placeholder colours and DESIGN.md together.

## 🗂️ Data and tooling

- [ ] **Proper group names** throughout each collection: the right taxonomy per item in
      `public/lists/*.json` (a data task).
- [ ] **Group images by collection**, matching the storage layout (needs a spec first).
- [ ] **Script duplicates** the overhauls do not reach (one small PR, any time): the report frame
      (`ID_WIDTH`, `DIVIDER`) in both `formatCheckReport.ts` and `formatIngestReport.ts`, into
      `script/lib/report.ts`; `script/generate/logo.ts` redefines `INK`, `MUTED`, `FONT` and
      `text()` that `guideDrawing.ts` exports; the `<svg xmlns=…>` opening written in five
      generators, into one `svgDocument(width, height, body)`; `readJson` and `writeJson` in both
      `lib/fs.ts` and `lib/io.ts`, with `designGuide.ts` reading around `Io`. The rest of the sweep
      is in SRC-OVERHAUL.md and TEST-OVERHAUL.md ("Duplicates to fold").
- [ ] **VitePress 2.0** when it is released: the docs site runs the 2.0 alpha, the one that shares
      the site's Vite 8.

## ✅ Done

**2026-10-27**

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
