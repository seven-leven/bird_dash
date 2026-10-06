# Changelog

How the version number is built is explained in the README ("Versioning"); `deno task version`
prints it. To log new work here, run `deno task changelog` — it inserts every commit made since this
file was last touched at the top of the newest section, ready to edit and commit.

The site deploys on every merge to `main`, so there is no "unreleased" work: anything listed here is
live.

Headings such as **v0.9.0** name a _line of work_ (the `major.minor` in
`script/version/version.json`), not a release: the patch number in the running site (e.g. `0.9.161`)
counts commits, so it is never `.0`. Entries up to v0.7 carry the old `x.y.z+w` labels, where `w`
was the drawing count.

---

## v0.9.0 (Stores, Tests, Accessibility & Design)

- 2026-10-06 | tests: 18 more (file helpers, git wrapper, version computation against the real repo,
  the asset scan, the store injection helper, selecting a search result); line coverage from 83.7%
  to 90.2%, and the floor that fails CI raised from 70% to 85%
- 2026-10-06 | repo housekeeping: `main` is protected (the CI checks must pass; no force-push or
  deletion), merged branches are deleted automatically, and 14 old branches were removed
- 2026-10-06 | search: a collection with 10 or more matches lists its first 7 and a "Show N more"
  row, so the next collection is not buried under dozens of results
- 2026-10-06 | one accent colour per collection, chosen with `accent` in `collections.json` (birds
  teal, sharks blue, shells rose) from a menu of six contrast-checked hues in `main.css`
- 2026-10-06 | footer: link to the GitHub repository
- 2026-10-05 | dark-theme placeholders: undrawn items show a slate-on-slate version of the
  collection icon in the dark theme instead of a bright white square
- 2026-10-05 | repo layout: `TODO.md` moved to `docs/`, `version.json` to `script/version/` (next to
  the script that reads it), and the shared test helpers from `test/` to `script/test/helpers/`; the
  project root now holds only the files tools require there
- 2026-10-05 | design guide: `docs/DESIGN.md` (colour roles with measured contrast, type scale,
  wording, spacing, states, motion, icon rules, a checklist for UI changes) and
  `docs/design-guide.png`, drawn from the real tokens and icons by `deno task design`; the site now
  honours the "reduce motion" system setting
- 2026-10-05 | icons: collections get line icons (bird, shark, shell) in place of emoji, named by an
  optional `icon` field in `collections.json`; the no-results icon no longer duplicates zoom-out and
  the group view uses a hierarchy icon; placeholders are redrawn from the collection icons by
  `deno task placeholders`
- 2026-10-05 | one visual system: design tokens in `main.css` (two corner radii, one small label
  size, two animation speeds, three text levels on dark surfaces); collection tabs, the view switch
  and sidebar sections share one "current" look driven by ARIA state; the view toggle shows both
  views; the lightbox uses the app's focus ring; tile and info panel agree on name order (Dhivehi,
  English, scientific); counts are worded in one place ("15 of 204 drawn")
- 2026-10-05 | phones: the header no longer pushes the view and theme buttons off-screen (search
  takes its own row below 768px); two-column grid; the English name is always visible on touch
  screens; the lightbox info panel scrolls and its arrows sit beside the image
- 2026-10-05 | fixes: clicking empty space in the lightbox now closes it (a drag or swipe does not);
  undrawn placeholders are no longer buttons that do nothing; switching to a collection that still
  has to load scrolls back to the top; the sidebar is out of the tab order while closed on small
  screens and Escape closes it
- 2026-10-05 | architecture: the shape of the `public/` files is typed once (`src/types/data.ts`)
  and shared by the build scripts, the loader and the contract test; raw-to-item normalisation and
  the cross-store actions are extracted and unit-tested; the ui store no longer exposes DOM refs;
  tests from 149 to 166
- 2026-09-30 | version footer simplified: one implementation (`script/version/compute.ts`) shared by
  `deno task version`, the build summaries and Vite; the footer now shows the version, the drawing
  count and the commit (`v0.8.157 · 18 drawings · 4f0f400`) instead of the zero-padded
  `0.8.157+018`; without git a local build warns and CI fails; the README's "Versioning" section is
  the single explanation
- 2026-09-30 | test harness: tests are tiered by file name (unit / dom / prop / contract) and
  `deno task test` prints one row per tier (about 9 lines instead of 151), lists failures first, and
  in CI writes a job summary, annotates failures and keeps the JUnit file; a weekly `nightly.yml`
  runs the property tests at 25× depth
- 2026-09-30 | tests grown from 44 to 147: fake-DOM tests for the URL router, lightbox and theme,
  property-based tests (fast-check) for hash round-trips, zoom/gesture maths, the asset planner and
  the data pipeline; line coverage from 47.8% to over 70% with a 70% floor; the tests also run in
  UTC, India and UTC+14
- 2026-09-30 | accessibility & UX: the lightbox is a real dialog (focus moves in, Tab wraps, focus
  returns to the tile) with touch pinch / pan / swipe; search is an ARIA combobox with a live result
  count; the theme choice is remembered and applied before first paint (no light flash); Open Graph
  and Twitter tags give shared links a preview
- 2026-09-30 | fixes: a slow collection load could show (and cache) another collection's items; a
  failed `collections.json` left the spinner forever (now an error screen with retry); a drawing
  dated the 1st of a month showed under the previous month for viewers west of UTC; search
  highlighting could split an HTML entity ("Tom & Jerry" searched for "amp")
- 2026-09-30 | CI: `deno task check` now fails on missing or orphaned images; data-contract test for
  `public/*.json`; pull requests and the Pages deploy share one `verify.yml` (the no-op asset job is
  gone), and a newer push cancels the superseded run
- 2026-07-13 | the Pages deploy now runs lint, format, type-check and tests first — nothing ships
  unless they pass
- 2026-07-10 | state moved from one injected app context into four domain stores (search, ui,
  collections, overlay) with read-only state and actions; URL sync consolidated in `useHashRoute`;
  `App.vue` from about 230 to 90 lines
- 2026-07-10 | type-check gate in CI (`deno check` over the `.ts` sources; `.vue` templates are not
  covered because vue-tsc doesn't engage under Deno); the 14 icon components collapsed into one
  `Icon.vue` with a registry; shared `git()` / `errorMessage()` script helpers; first unit tests
  (44)
- 2026-07-09 | refactor pass (net −198 lines): dead exports, types and fields removed, one search
  state instead of two synced ones, a prop-driven lightbox, scroll-spy refs owned by the app instead
  of a four-hop expose chain, and the full-size WebP written without a second encode during
  transcode
- 2026-07-06 | shareable URLs (`#collection` and `#collection/item` deep-link a collection or an
  image), the lightbox pages in drawn-date order, and an IntersectionObserver scroll-spy replacing
  the per-scroll layout reads

## v0.8.0 (Redesign, Performance & Tooling)

- 2026-07-05 | scroll-spy fix (content-visibility regression), Dhivehi name + Thaana script search,
  CSS de-duplication (`.text-muted`, `.tile-grid`, `.icon-btn-overlay`)
- 2026-07-05 | Lighthouse Accessibility + SEO to 100 — contrast pass, meta description, favicon path
  fix, eager above-the-fold images
- 2026-07-05 | performance: precomputed item fields (isDrawn / sortKey / searchText), native lazy
  images, debounced search, shallowReactive immutable data, code-split lightbox, Vue prod flags and
  a vendor chunk
- 2026-07-05 | derived versioning (patch = commit count, +count = illustrations) and
  `deno task changelog`; feature-based component structure with `useAppContext` provide/inject
- 2026-07-05 | docs: README rewritten for the new architecture
- 2026-07-05 | repo hygiene: PR CI (lint/format/build), LF line-ending policy, Pages moved to
  workflow builds, dead gh-pages branch removed
- 2026-07-05 | UI cohesion pass: accent design token, shared icon/UI components, matching skeletons,
  Ctrl/⌘K search, dismissible filter chip, unified component naming
- 2026-06-30 | global search: cross-collection results with counters and keyboard navigation
- 2026-05-15 | added new component; bumped deploy script
- 2026-05-12 | refactored search, segmented the build pipeline, overhauled the GitHub deploy
  workflow, re-transcoded all images

## v0.7.0 (Multi-collection Architecture)

- **0.7.072+018** | 2026-03-12 | barrel import types, updated modules |
- **0.7.071+018** | 2026-03-10 | renamed components v2, cleaned up theme usage in ui |
- **0.7.070+018** | 2026-03-10 | isolated and moved all types to its own folder |
- **0.7.069+018** | 2026-03-09 | debloated app.vue |
- **0.7.068+018** | 2026-03-09 | 🐚 Shell 029: Sand Dollar |
- **0.7.067+017** | 2026-03-09 | added shell collections |
- **0.7.066+017** | 2026-03-09 | added different thumb to different collections |
- **0.7.065+017** | 2026-03-09 | made provision to add new collections; 🦈 added shark collections |
- **0.7.064+017** | 2026-03-09 | restructured scripts folder
- **0.7.063+017** | 2026-03-06 | MVP for multi-collection architecture
- **0.7.062+017** | 2026-03-06 | created subfolders for bird pics and updated version manager
- **0.7.061+017** | 2026-03-06 | updated TODO with new multi-collection plans

## v0.6.0 (QoL, Search, and Data)

- **0.6.060+017** | 2026-02-15 | added Dhivehi names
- **0.6.059+017** | 2026-02-07 | added illustrator notes
- **0.6.058+017** | 2026-02-07 | added sort by date
- **0.6.057+017** | 2026-02-07 | added info panel to expanded image
- **0.6.056+017** | 2026-02-06 | adjusted search bar
- **0.6.055+017** | 2026-02-06 | added search bar
- **0.6.054+017** | 2026-02-06 | rewrote build process
- **0.6.053+017** | 2026-02-06 | 🐦 Bird 029: Eurasian Moorhen
- **0.6.052+016** | 2026-01-16 | added known issues documentation
- **0.6.051+016** | 2026-01-16 | ship script now skips existing images
- **0.6.050+016** | 2026-01-15 | fixed versioning system
- **0.6.049+016** | 2026-01-15 | added triple check for bird count validation
- **0.6.048+016** | 2026-01-15 | added expanded image view
- **0.6.047+016** | 2026-01-15 | 🐦 Bird 030: Eurasian Coot

## v0.5.0 (Tailwind & Dark Mode)

- **0.5.046+015** | 2026-01-15 | updated script permissions
- **0.5.045+015** | 2026-01-15 | footer implementation
- **0.5.044+015** | 2026-01-15 | updated Vite dependency
- **0.5.043+015** | 2026-01-15 | added git hooks
- **0.5.042+015** | 2026-01-12 | updated dependencies
- **0.5.041+015** | 2026-01-12 | updated README documentation
- **0.5.040+015** | 2026-01-12 | modified build.yml workflow
- **0.5.039+015** | 2026-01-12 | code cleanup
- **0.5.038+015** | 2026-01-12 | added theme toggle
- **0.5.037+015** | 2026-01-12 | migrated to Tailwind CSS and added dark mode
- **0.5.036+015** | 2025-12-19 | 🐦 Bird 004: Northern Shoveler

## v0.4.0 (Vue Rewrite)

- **0.4.035+014** | 2025-12-17 | added bird 031 to data
- **0.4.034+014** | 2025-12-05 | refactored main file
- **0.4.033+014** | 2025-12-05 | migrated from txt to json format
- **0.4.032+014** | 2025-11-21 | fixed mobile bottom scrolling
- **0.4.031+014** | 2025-11-21 | CSS cleanup + renamed variables + added progress tracker
- **0.4.030+014** | 2025-11-09 | 🐦 Bird 032: White-breasted Waterhen
- **0.4.029+013** | 2025-10-24 | code refactor
- **0.4.028+013** | 2025-10-24 | 🐦 Bird 177: House Crow
- **0.4.027+012** | 2025-10-15 | 🐦 Bird 031: Watercock
- **0.4.026+011** | 2025-11-10 | fixed scroll behavior
- **0.4.025+011** | 2025-10-11 | added thumbnail support
- **0.4.024+011** | 2025-10-07 | 🐦 Bird 011, 039, 099, 130, 133, 139 (6 birds)
- **0.4.023+005** | 2025-07-09 | 🐚 Shell 020: Clam Shell
- **0.4.022+004** | 2025-07-06 | 🐚 Shell 019: Scallop
- **0.4.021+003** | 2025-06-24 | UI revamp
- **0.4.020+003** | 2025-06-24 | converted PNG to WebP format
- **0.4.019+003** | 2025-05-30 | rewrote from scratch using Vue.js

## v0.3.0 (Deno & Build Tools)

- **0.3.018+003** | 2025-02-25 | project housekeeping
- **0.3.017+003** | 2025-02-24 | added bundler tests
- **0.3.016+003** | 2025-02-19 | added tests to handler
- **0.3.015+003** | 2025-02-15 | code formatting improvements
- **0.3.014+003** | 2025-02-14 | added license
- **0.2.013+003** | 2025-02-14 | fixed expanded images
- **0.2.012+003** | 2025-02-14 | migrated to Deno and esbuild

## v0.2.0 (Deployment Setup)

- **0.2.011+003** | 2025-02-07 | updated dependencies
- **0.2.010+003** | 2025-02-02 | major code refactor
- **0.2.009+003** | 2025-02-01 | added title card
- **0.2.008+003** | 2025-01-28 | fixed animation
- **0.2.007+003** | 2025-01-27 | added favicon
- **0.2.006+003** | 2025-01-27 | fixed local build process
- **0.2.005+003** | 2025-01-26 | configured GitHub Actions workflow for deployment
- **0.2.004+003** | 2025-01-26 | removed node_modules from tracking
- **0.2.003+003** | 2025-01-11 | 🐦 Bird 003: Garganey

## v0.1.0 (Initial Development)

- **0.1.002+002** | 2024-10-15 | 🐦 Bird 002: Cotton Pygmy-Goose
- **0.1.001+001** | 2024-10-10 | 🐦 Bird 001: Lesser Whistling-Duck
