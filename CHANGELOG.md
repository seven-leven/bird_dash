# Changelog

How the version number is built is explained in docs/WORKFLOW.md ("Versioning"); `npm run version`
prints it. To log new work here, run `npm run changelog` — it inserts every commit made since this
file was last touched at the top of the newest section, ready to edit and commit.

The site deploys on every merge to `main`, so there is no "unreleased" work: anything listed here is
live.

Headings such as **v0.9.0** name a _line of work_ (the `major.minor` in
`script/version/base_version.json`), not a release: the patch number in the running site (e.g.
`0.9.161`) counts commits, so it is never `.0`. Each line is named after a drawing, the Dhivehi
names in the order they were drawn (`script/version/line_names.ts`); a test keeps the headings
right. Entries up to v0.7 carry the old `x.y.z+w` labels, where `w` was the drawing count.

---

## v0.9.0 Valu Kukulhu (Stores, Tests, Accessibility & Design)

- 2026-10-27 | fix: a search result or a link to an item not drawn yet shows its tile. Its tile is
  hidden in a collection with nothing drawn ("Nothing drawn yet"), in the month view and under
  "drawn only", so choosing the Whale Shark found nothing to ring. A new action, `ringTile`, first
  shows what is not drawn (the family view, every item, the planned list: the ui store's
  `showUndrawn`), then rings the tile; the search and the router both use it. The planned list is
  the ui store's now, folded away again when another collection is chosen
- 2026-10-27 | test: journeys (test overhaul, phase 3). A new tier, `_journey_test.ts`, runs the
  whole app in happy-dom on the fixture archive: `renderApp` mounts `App.vue` with its stores,
  router and every component, and the visitor clicks and presses keys (`events.ts`). Ten journeys in
  `src/journeys/`: a first visit, another collection, the views, search, the viewer, links and the
  back button, About, the theme, failures, and a phone. The untested-files gate now counts `.vue`
  files, and every component is at 100%; the states no visit reaches have component tests on the
  real stores (`appStores()`). Three bugs the journeys found are fixed: a viewer opened by a link
  took neither focus nor the arrow keys and let the page scroll behind it (`useDialogKeys` now acts
  on a dialog that mounts open); the back button left the viewer open (`useHashRoute` closes it when
  the address loses its item); and a drawing dated after the current month was counted as "0
  drawings" in the month view
- 2026-10-27 | test: one way to a browser (test overhaul, phase 2). The tier sets the environment:
  Vitest's `node` and `dom` projects give every `_dom_test` file happy-dom and the rest Node, and
  `src/testing/domSetup.ts` resets the address, storage, `<html>` and page before each dom test. The
  83 `withDom(…)` wrappers, the `@vitest-environment` comments, `withDom.ts` and
  `@happy-dom/global-registrator` go. Sharing one browser per file surfaced listeners left behind:
  `useDialogKeys` and `useZoomPan` now clean up in `onScopeDispose`, so a scope stopped without a
  component unmount releases them too, and `runInScope` stops its scope after each test
- 2026-10-27 | fix: the focus ring on a light page. `.focus-ring` drew `accent-500`, under WCAG's
  3:1 for a focus indicator on white for teal (2.4:1, the Birds' accent), emerald, sky and orange.
  On a light page the ring, the current marker under a tab, the search box's focus, the viewer's
  buttons and the ring that flashes a found tile now draw `accent-700` (5.2:1 or more for every
  hue); on dark they keep `accent-500` (`400` in the viewer). The palette test checks the dark ring,
  `500` on `slate-950`, for every hue on the menu; DESIGN.md, the design guide and its contrast
  figures say so
- 2026-10-27 | test: the test runner on `Io` (test overhaul, phase 1d; phase 1 is done). `npm
  test`'s `main` is made with `command` like every other command and reaches the outside world
  through `Io`; its tests run it on `fakeIo` with a fake Vitest, in memory. Vitest writes its JUnit
  and coverage into `test-results/` itself, so the runner's temporary folder and its copy of the
  HTML report go. It is `script/testRunner/testRunner.ts` now, named after its folder, and the
  naming test has no exception left. One `annotation()` for GitHub's workflow commands, one
  `repoPath`, and one way to show a percentage (`—` when there is nothing to cover, in every table)
- 2026-10-27 | test: one way to mount (test overhaul, phase 1c). `src/testing/mount.ts` holds
  `mountComponent`, `mountComposable`, `runInScope` and `mountWithoutDom`, and unmounts whatever a
  test mounted after it; `mountComponent.ts`, `mountComposable.ts` and the Vue renderer that
  `injection_test.ts` had copied go. The injection test now checks the warning it used to silence
- 2026-10-27 | test: shared test data (test overhaul, phase 1b). A fixture archive
  (`src/testing/scenarios/archive.ts`, Birds and Sharks, served to `fakeFetch` by `archiveRoutes()`)
  that the collections store's test now runs on; `makeScriptCollection` in place of ten collections
  built by hand in the scripts' tests; `fakeTranscoder` and the archive's two ducks for both ingest
  tests; git's answers as `fakeIo({ commits, commit })`; `tempCollection` and `imageSize` in place
  of two copies each of `withCollection` and `sizeOf`
- 2026-10-27 | test: one kit of fakes (test overhaul, phase 1a). `src/testing/fakes/` has
  `fakeFetch` (answers by URL path, records the calls), `captureConsole` (keeps the lines a test
  expects, passes the rest through) and `tempDir`, each undone when its `using` block ends, and
  `src/testing/settle.ts` is the one way to wait. Every test that swapped `fetch` or the console by
  hand, or made its own temporary folder, uses them now: no `finally` restores anything, and
  `useCollections_test.ts` alone is about a hundred lines shorter. A contract test fails on a global
  swapped by hand outside the kit. ESLint lets a fake held only for its cleanup be named `_…`
- 2026-10-27 | ui: Share has an icon of its own (`share`, in the viewer's group) and sits at the end
  of the details' Learn more row, opposite the links that leave the site, instead of on a line of
  its own under the drawing's id. It reads "Share" everywhere and "Copied" once the link is copied,
  short enough to stay on the links' line; a screen reader hears "Link copied". The icon sheet and
  the design guide are redrawn with it
- 2026-10-27 | docs: the test overhaul's phase 0, the rules agreed. TESTING.md gains "The rules"
  (twelve: a test states a promise, the lowest tier that can prove it, one way to fake, to mount and
  to wait, determinism, small files), "Promises" (what the site says it does and the tests that keep
  each) and "Conventions" (file names, test titles, inside a test, helpers and data), moved from the
  plan. The decisions are settled, with one more: journeys live in `src/journeys/` until the site
  overhaul makes `app/`. TESTING.md's stale paths are fixed
- 2026-10-27 | docs: the site overhaul's phase 0, the rules agreed. ARCHITECTURE.md gains "Rules for
  the site's code" (organise by feature, layers that point one way, a pure `domain/`, one door to
  the outside, types with their owner, one word per idea, small files) and the naming table, moved
  from the plan; DECISIONS.md records "Folders by feature" and "One word per idea" (the viewer,
  `'month'`, the ui store in three). ARCHITECTURE.md's list of script folders and its known gaps
  match the code again
- 2026-10-27 | feat: a link preview per drawing, and a Share button in the viewer (phase 3c of
  PLATFORM.md). A shared link always showed the same duck, because the drawing is named after `#`,
  which a link preview never reads. The build now writes a small page for every drawing,
  `<collection>/<id>/`, with its own title, description and image, which sends a visitor straight on
  to the drawing; the viewer's Share button opens a phone's share sheet with that address, or copies
  it ("Link copied")
- 2026-10-27 | build: a Content-Security-Policy (phase 3b of PLATFORM.md). The build writes it into
  the page as a `<meta>` tag, as GitHub Pages sends no headers: scripts, styles, images, fonts and
  data from the site only, and the inline theme script allowed by its hash, worked out at build time
  from the page itself. Checked in a browser on the built site: nothing the site loads is blocked,
  and a script injected into the page is
- 2026-10-27 | build: a size budget (phase 3a of PLATFORM.md). The site's build ends by printing
  what a visitor downloads against the limits in `script/build/sizeBudget.ts` (a Vite plugin) and
  fails when one is over: the JavaScript (57 of 70 kB gzipped), the CSS (11 of 15 kB gzipped), the
  largest full drawing (313 of 400 kB) and the largest thumbnail (43 of 60 kB)
- 2026-10-27 | scripts: Node 24's own tools in place of hand-written ones (phase 2 of PLATFORM.md).
  Every command and the test runner read their arguments with `util.parseArgs` under `cli.ts`'s
  `parseArgs`, so the runner's own flag scan goes and `--into=<dir>` works as well as
  `--into <dir>`; the real `Io` colours `✓` and `✗` on a terminal with `styleText` (plain when piped
  or under `NO_COLOR`); the runner finds its files with `fs.glob` instead of a recursive `readdir`;
  CI runs its steps with `node --run`. Vite 8 builds the `vue` chunk with no warning, so
  `manualChunks` stays
- 2026-10-27 | fix: dark mode draws the browser's own parts dark too (`color-scheme`: scrollbars,
  the search box), the month view's names are English whatever the browser's language (they followed
  it), a phone's browser bar takes the top bar's colour in each theme (`theme-color`, kept in step
  by `useTheme` and the theme script in `index.html`, with a contract test), and the dark variant
  has Tailwind 4's current spelling (`@custom-variant`). Phase 1 of PLATFORM.md; "Prefer the
  platform" is in DECISIONS.md
- 2026-10-27 | docs(plans): a new plan, PLATFORM.md ("Use the platform"): what Node 24, TS 6, Vite
  8, Vue 3.5, Tailwind 4 and the browser give that the code does not use yet, each row with what it
  replaces and the overhaul phase it rides with, and the general improvements found with them (the
  data checked at the door, an app-wide error state, axe, a size budget, link previews per drawing,
  a Content-Security-Policy). Two bugs it found are in TODO.md's fixes: no `color-scheme` in dark
  mode, and month names in the visitor's language
- 2026-10-27 | docs(plans): a sweep for duplicates, folded into the overhauls. Each plan has a
  "Duplicates to fold" table, every row assigned to the phase that already moves that code: in the
  site, `plural` written four times, the project's links, the breakpoint and search delay, the drawn
  filter's wiring, external links, "Try again", the loading grid and the viewer's props; in the
  tests, collections and birds written out file by file in `script/` and `src/`, `makeRepository`,
  git's answers and the runner's own copies. What neither overhaul reaches is one item in TODO.md
- 2026-10-26 | docs(todo): the TODO reorganised. Open work comes first, by priority and theme: fixes
  now, the two overhauls in order, features (non-species collections, the viewer and its facts,
  images), the design system's simplifications, data and tooling. Everything done is at the bottom,
  newest first, one line each, as the CHANGELOG keeps the detail
- 2026-10-26 | docs(plans): the TODO folded into the overhauls. The test overhaul's phase 4 is the
  Vue component tests, with the up-to-date list (the 11 components that have no test of their own
  yet). The site overhaul gains "Features that ride along": each TODO feature that needs code a
  phase moves (a `kind` per collection, placeholders as icons, icons per series, several images per
  item, the About page by kind, responsive thumbnails, one set of text roles, five type sizes, warm
  paper) comes as its own pull request straight after that phase. The focus ring's contrast on light
  pages is logged as a fix of its own
- 2026-10-26 | docs: the design guide's final pass (V7). Nothing in it is smaller than 15px except
  the type scale's own 11 and 12px samples, as it is read at about half size; the five principles
  share one shape (each heading in two even lines, its description close beneath); the icon groups
  sit on two equal tracks, so every group starts on a shared column; and the accent menu is
  readable. The corner radii and the speeds it quotes are read from `tokens.css` and `main.css`, and
  a test fails if the guide and the CSS disagree
- 2026-10-26 | scripts: the scripts overhaul is done (phase 7). A contract test checks the rules a
  machine can: every file in `script/` is named in camelCase, no exported name starts with `get`,
  `load`, `run` and the like, and every command is made with `command` in a file named after its
  folder. WORKFLOW.md's commands are grouped by job (look, change the repository, build, check,
  test), and the plan is deleted; SCRIPTS.md holds the rules, with one exception written down: the
  test runner keeps its own `RunnerDeps` until the test overhaul
- 2026-10-26 | scripts: the rest of `script/` follows the naming rules (phase 6 of the scripts
  overhaul). Every command's `main` is made one way, `command(usage, work)`, so `--help`, the exit
  codes and how a problem is reported are the same for all of them, including `npm run changelog`,
  now on `Io` too. `test_runner/` is `testRunner/`, its three pairs of `formatConsole` and
  `formatMarkdown` are named for what they format, and no snake_case file is left
- 2026-10-26 | scripts: `npm run check` is its own command, in `script/check/` (phase 5 of the
  scripts overhaul). It reads and never writes: every drawing has its images, nothing waits to be
  ingested, and the generated text files (stats, the favicon, the logo files) are what their
  generators would write now. Each problem goes to stderr with the command that fixes it, and the
  check exits 1. `build` no longer takes `--check`
- 2026-10-26 | scripts: every generated file has one generator, run by `npm run generate` (phase 4
  of the scripts overhaul): the stats, the placeholders, the design guide, the icon sheet, the logo
  files, the favicons and the README's row of drawings, all under `script/generate/`. Name some to
  run only those (`npm run generate -- placeholders`), or write them elsewhere to look first (`--
  --into <dir>`). `npm run placeholders` and `npm run design` are gone. The 569-line guide script is
  three files, and one contract test runs every generator and fails on any stale file. A real run
  reproduces the committed files byte for byte
- 2026-10-26 | scripts: `npm run build` builds in stages, the site and then the docs site, as CI
  does (phase 3 of the scripts overhaul). Name a stage to build only it (`npm run build -- docs`, or
  `build:site`, `build:docs`); each stage reports its time, the first that fails stops the build,
  and an unknown stage exits 2 with the list. Vite and VitePress are started the same way, through
  the new `Io.runNode`, so the build's tests run no tool at all. `docs:build` is gone, and CI's two
  build steps are one
- 2026-10-26 | scripts: taking in new drawings is its own command, `npm run ingest` (phase 2 of the
  scripts overhaul), in `script/ingest/`. Its first line says it changes files git tracks, and `--
  --dry-run` says what it would do and changes nothing. `npm run build` now only builds the site
  from what is committed and never writes a tracked file; `build:assets` and `build:vite` are gone.
  Ingest runs on `Io`, so its tests use a fake repository and a stand-in for sharp, with one real
  end-to-end test on tiny images. The words follow the glossary: source art, register, make, repair
- 2026-10-26 | scripts: the foundation every command will share (phase 1 of the scripts overhaul).
  `script/lib/paths.ts` is the one place a path is written out, `project.ts` the repository and site
  URLs, `io.ts` the one way to files, git, the environment, the clock and the console (with
  `fakeIo.ts` for tests), and `cli.ts` the arguments, the exit codes (0 done, 1 a problem, 2 wrong
  usage) and `--help`. `npm run version` is the first command on it: an option it does not take now
  exits 2 with its usage instead of being ignored, and a missing git is one `✗` line instead of a
  stack trace. Its tests no longer touch the repository, except the contract test that should
- 2026-10-26 | docs: a plan for the tests, top down (`docs/plans/TEST-OVERHAUL.md`). The tests were
  written bottom up, a file at a time; the plan starts from the site's promises, proves each visit
  through the whole app in new journey tests, then features, units and contracts, and gives them one
  kit for fakes, mounting and waiting (today `fetch` is faked four ways and a browser is set up two
  ways). Its first three phases come before the site and scripts overhauls, as their safety net. The
  glossary gains promise, journey, fake and scenario. It sets the conventions too: one test file per
  source file with many tests in it, split by behaviour past about 300 lines; file names
  (`planChanges_test.ts`, `search_journey_test.ts`); titles as sentences that must stay true; flat
  files; and names for helpers, fakes and arbitraries
- 2026-10-26 | docs: a glossary (`docs/GLOSSARY.md`): every word the project uses, for the archive,
  the site, the code, building and testing, each with one meaning, where the code says it, and the
  words to avoid (the viewer is never a lightbox or an overlay; the numbers on screen are counts,
  not stats). Words the code still says differently are marked "to be …", and the site-code plan
  renames them. The plans and the script rules point to it
- 2026-10-26 | docs: a plan to rebuild the layout and naming of `src/` from the ground up
  (`docs/plans/SRC-OVERHAUL.md`): folders by feature over pure `domain/`, `data/`, `browser/` and
  `ui/` layers that import one way, one word per idea (the viewer is never also a lightbox or an
  overlay), types beside their owners, a store per job, and nine phases with every rename listed
- 2026-10-26 | docs: rules for the scripts and a plan to move them onto the rules. `docs/SCRIPTS.md`
  sets out eight principles (a command is a verb with one job; changing the repository is never a
  side effect; decide, then do, then say; one generator and one check per generated file; one home
  for paths and I/O; one command shape; one voice) and the naming, from folders to variables, with a
  fixed list of verbs. `docs/plans/SCRIPTS-OVERHAUL.md` is the roadmap: the target layout, every
  rename, the npm scripts before and after, and eight phases, one pull request each. Phase 0 is
  done: camelCase file names in `script/` too (DECISIONS.md's naming entry is rewritten), `ingest`
  for taking in drawings, a local build that includes the docs, and no aliases for old command names
- 2026-10-26 | docs: the docs site names no colour of its own. Its theme takes Tailwind's colour
  variables (the theme file alone; a contract test keeps Tailwind's preflight out, which would reset
  VitePress's headings, lists and tables) and the accent palettes, which move from `main.css` into
  `src/styles/accents.css` for the site and the docs to share. The manifesto's ramps are drawn with
  the very variables the site uses, so the build-time loader that copied their values goes
- 2026-10-26 | docs: the docs are a site, at
  [/bird_dash/docs/](https://seven-leven.github.io/bird_dash/docs/), in the gallery's own design:
  VitePress over `docs/*.md`, built into the same Pages deploy and checked by CI, where a dead link
  fails the build. Faruma, the type, the corners and the shadows come from a new
  `src/styles/tokens.css` that the site imports too, so the two cannot drift; the logo and the icons
  are the site's own components. In the design manifesto the accent ramps and the icon set are drawn
  live from `main.css` and the icon registry; links to source files open on GitHub, and headings
  keep GitHub's anchors. The footer links "Docs", the About page's manifesto link opens the docs
  page, and the README points to it
- 2026-10-26 | site: the viewer's logic is three composables instead of one of 365 lines:
  `useZoomPan` (scale, offset, drag, pinch, swipe), `useDialogKeys` (focus in, Tab kept inside,
  shortcut keys, focus back on close) and `useDrawingNav` (where the open drawing sits, the moves
  beside it). `useLightbox` wires them under the same API; moving between drawings is tested without
  a DOM, and up and down, which page like left and right, have a test of their own
- 2026-10-26 | site: one footer, `AppFooter`, under the gallery and the About page alike. The About
  page gains the version, the drawings and the commit; the gallery gains the colophon (Vue, Vite,
  Tailwind, Faruma). Its page links come from `src/pages.ts` and mark the page you are on, and the
  GitHub link says it opens a new tab
- 2026-10-26 | site: pages do not fetch. The About page's numbers come from a `stats` store
  (`useStats`, beside the collections loader), loaded the first time the page opens and kept, so
  going back to About no longer fetches `stats.json` again. Both loaders share one helper,
  `lib/fetchJson.ts`, which words every failure the same way (`HTTP 404 loading stats.json`,
  `collections.json is not valid JSON`), and the About page's tests fake the store, not `fetch`
- 2026-10-26 | site: the pages that are not a collection are one list, `src/pages.ts` (an id, a
  label and a code-split component). The route, the top bar, the collection menu and the main area
  read it instead of naming the About page in six places, so a new page is one entry. A contract
  test keeps a collection from taking a page's id
- 2026-10-26 | site: an item's names are data. The loader builds each item's `names` once
  (`src/lib/itemNames.ts`: the text, its language and its role: title, also, common or Latin), and
  the tile, the viewer and search render whatever names an item has instead of reading `dhiv`,
  `dhiv_script` and `sci` by name; the names leave `meta`. Nothing looks different; a collection
  whose pieces have other names now needs no component change
- 2026-10-26 | docs(todo): plan collections that are not species lists, the docs as a site in the
  site's own design, and, first, making the site modular and decoupled
- 2026-10-26 | site: the About page, the README and the link previews no longer call every
  collection Maldivian (the shells are thirty kinds from anywhere), nor say every species has a
  Dhivehi name: each has its English and scientific names, and its Dhivehi name where it has one
- 2026-10-26 | site: the sidebar's counts say where the drawings are. A family with drawings shows
  its count (`4 of 8`) in `slate-700`, medium; an empty one (`0 of 7`) stays the muted `slate-500`.
  The counts were drawn at 60% opacity, about 2.3:1 on white, below AA; both now pass
- 2026-10-26 | version: each line of work is named after a drawing, the archive's Dhivehi names in
  the order they were drawn, each once: v0.1 Reyru, v0.2 Kunburu Reyru, v0.3 Gudugudaa Dhooni, v0.4
  Valu Bondana, v0.5 Dhandifulhu Dhooni, v0.6 Dhon Raabondhi, v0.7 Iruvaihudhu, v0.8 Alhi Maakanaa,
  v0.9 Valu Kukulhu. Worked out from the lists like the rest of the version; shown in the footer
  (the Thaana and the bird on hover), in `npm run version --long` and in these headings, which a
  test keeps in step with the lists
- 2026-10-26 | docs: the README opens with the five newest drawings, each on its white card, so the
  first thing it shows is the work. `npm run design` draws the row from `stats.json` and the
  thumbnails (`docs/assets/drawings.webp`), so it follows the archive. The deploy link goes to
  WORKFLOW.md's "Deploy"; the design manifesto as a page on the site joins the TODO
- 2026-10-26 | data: the reference links in `collections.json` lose their `color` (Tailwind classes
  such as `bg-emerald-600`, left from when they were coloured buttons). The viewer draws them as
  plain links and nothing read it; a collection's colour is set once, by its `accent`
- 2026-10-26 | docs: the README is the front door: what the archive is, its features, a quick start
  with four commands, the documentation table, and a paragraph each on versions and deploys, with
  links to the About page and the write-up on how the site was built. Its reference material moved:
  the folder map to ARCHITECTURE.md ("Where things are"), every command and how the version is
  worked out to WORKFLOW.md ("Commands", "Versioning"); the data examples and recipes were already
  in DATA.md
- 2026-10-26 | site: an About page (`#about`, after the collection tabs or last in their menu): what
  the archive is, its first drawing, progress overall and per collection, the five newest drawings,
  how each page is made, a short history with a link to the write-up on how the site was built, and
  the manifesto's first line. Every number comes from `public/stats.json`, so nothing is typed by
  hand, and the page holds more collections without a redesign: six cards, then "Show all", and past
  three collections the prose counts them instead of naming each. Dark mode follows the site. build:
  `stats.json` also names the first drawing (`first`), counts the species named in Dhivehi
  (`named`), and gives each drawing's romanised Dhivehi name (`roman`); its shape moves to
  `src/types/data.ts`, shared by the build and the page
- 2026-10-25 | build: the asset build writes `public/stats.json`, the archive's numbers worked out
  from the lists (each collection's total, drawn, groups, first and latest drawing; the totals; the
  eight newest drawings across every collection), so a page that shows them, such as a coming About
  page, never has them typed by hand. `npm run check` fails when the file is stale
- 2026-10-25 | fix: birds with two Dhivehi names (12 of them, such as the Watercock, "ވަލު ކުކުޅު / ކުލީ
  ކުކުޅު") no longer shatter the viewer's title. Each name gets its own line with its own romanisation,
  the second smaller and marked "also"; a gloss that does not fit wraps under its name
- 2026-10-25 | site: the viewer card has one language per line. "Reyru" now sits after the Thaana on
  the Dhivehi line, so it can no longer read as part of the English title below it; the section
  labels drop their icons, and the `book` icon, used only there, leaves the set
- 2026-10-25 | tests: `mountComponent` mounts a component (with typed stand-in stores) and unmounts
  it after each test; one test file per component. `npm test -- interface` or `-- src/components`
  runs one area or folder. Coverage names every file short of 100%, `.vue` included, with the lines
  missed; CI leads its summary with a one-line verdict and marks each gap on its file in the pull
  request (TESTING.md, "What the runner reports"). The unused `languages` icon is gone
- 2026-10-25 | fix: with "Drawn only" on, opening a collection with nothing drawn and pressing "Show
  what's planned" showed an empty page with no way out. The setting no longer applies where nothing
  is drawn; it still filters every collection that has drawings
- 2026-10-25 | site: the viewer's panel is calmer. The names are one block (the Dhivehi name
  largest, at the new `text-3xl`, with "Reyru" under it as part of the name, then English and
  scientific); the top line adds the month drawn, and its group is a link that shows the group in
  the grid; the illustrator's note is in regular text, in paragraphs, and a long one opens folded
  with "Read more"; the "Learn more" links are plain links. The romanised-name field is gone. Links
  that move you within the site (the group, "#11", "Read more") are in the collection's accent;
  links that leave it stay neutral
- 2026-10-25 | site: the header is one row at every width. Below 768px (or with more than four
  collections) the collection tabs become one menu button naming the current collection; search
  shares the row, and below 420px folds into a button that opens across it. The sidebar opens with
  the collection's name, its count under it and "Drawn only" beside it (so "3 of 30 drawn" cannot
  read as thirty groups); the view's name labels the list. Below 1024px the count sits above the
  grid. The sidebar opens in three levels: the collection's emblem (its icon at 40px in the accent,
  the largest on the page), its name, then its count as the filter, "All 204 · Drawn 15", drawn like
  the view tabs. New `chevronDown` icon
- 2026-10-25 | docs: the guide is legible at its real size: no text under 13px but the type scale's
  own samples, small labels a step darker, larger swatch labels, more room between each principle's
  heading and its description, and more space between icon rows. The type table now says `text-xl`
  is the English title only when no Dhivehi name heads it (as the viewer does). site: the viewer's
  eBird, BirdLife and Wiki links show the accent focus ring like every other control
- 2026-10-25 | docs: the design guide's final refinement pass. A shorter, quieter accent menu; more
  room in the principle columns; one specimen of a name in its three languages (Dhivehi largest,
  English, then the scientific name), each named at its own baseline; more air in the icon groups,
  with softer dividers beside the icons only; more space above the closing line
- 2026-10-24 | fix: Dhivehi names no longer lose the bottom of their vowel marks in tile captions
  and search rows (Faruma's marks reach half an em below the baseline; `.font-dhivehi` now gives
  them a 1.85 line height)
- 2026-10-24 | site: one design, said one way. Search is counted in "matches" everywhere (the filter
  chip now reads "10 matches, 1 drawn", like the dropdown); each view has one name in the header and
  the sidebar ("Families", "Orders", "Months"); a collection's progress shows once, above the grid,
  in both views; one id badge in two placements; two named shadows (`shadow-float`, `shadow-lift`);
  icons in four sizes, checked by a test; the viewer's borders use slate like every other surface;
  the logo tile is the browser-tab icon. The design guide's colours are now read from Tailwind's own
  (oklch) palette rather than Tailwind 3's hex, which moved a few contrast figures and took cyan off
  the accent menu (its marker shade is paler than teal's)
- 2026-10-24 | fix: Dhivehi is set in Faruma wherever it appears, including what is typed into
  search (Faruma now heads the site's font list, limited to Thaana characters)
- 2026-10-24 | fix: a tile's id badge no longer paints over the sticky section heading (each tile
  keeps its layers to itself)
- 2026-10-24 | docs: design guide polished. The image has a serif title, the principles as five
  columns, colour roles as light and dark cards, a slim accent strip, a type specimen with the
  Dhivehi drawn in Faruma (it rendered as broken glyphs before), and every section in one shape:
  label, statement, specifics, one demonstration. DESIGN.md moves the ramp and placeholder tables to
  a reference at the end, and a test checks them, and the contrast table, against the palette
- 2026-10-24 | docs: DESIGN.md rewritten as a design manifesto. Each of the five principles is
  stated in one line, and each numbered section names the principles it serves (a contract test
  checks both). The guide image is redrawn to match on warm paper with fine rules, and the icon
  groups share one column grid, with a divider in the empty column between groups
- 2026-10-24 | fix: a section's sticky heading now meets the top edge; it stopped 24px short (16px
  on phones), the scroll area's padding, and drawings showed through the gap
- 2026-10-24 | site: follows the revised design guide. Names sit in a caption under each drawing;
  undrawn tiles are flat grey (light placeholders redrawn on grey); "x of y drawn" and a "Drawn
  only" switch above the grid, and "Nothing drawn yet" for an empty collection; each section's
  heading sticks to the top (and a family name no longer lingers in the date view); one set of
  empty, loading and error states, the sidebar agreeing with the main area; search says "10 matches,
  1 drawn", marks undrawn results and names the group when that is what matched; the date view reads
  newest first with long empty runs folded; phones name the current collection; "#11" in a note
  links to that drawing; and the viewer has a light theme. First component tests (ItemTile,
  EmptyState, IdBadge, Icon); 400 tests, still 100%
- 2026-10-24 | design guide: rebuilt around five principles (P1 drawings first, P2 show progress
  honestly, P3 always say where you are, P4 one way to do each thing, P5 for everyone, on every
  screen), each with its own icon; every rule now names the principle it comes from, the checklist
  is grouped by them, and the guide image opens with them. Also new rules for what a walk through
  the site found missing. Nothing is laid over a drawing (names move to a caption) and drawn and
  undrawn tiles must differ at a glance; light placeholders sit on grey, not white; one heading per
  section; one set of empty, loading and error states; how the two parts of search report their
  counts; the date view newest first; the phone header names the collection; and which count format
  goes where. The code follows in three pull requests, listed in docs/plans/TODO.md
- 2026-10-23 | upkeep: Node 24.22.1 (an LTS patch), Vite 8.3.5, typescript-eslint 8.72.0, dprint
  0.64.3 and happy-dom 21.0.4; Dependabot proposes npm and GitHub Actions updates every Monday,
  grouped; the CI and nightly workflows run with a read-only token; pull requests start from a
  template with the headings docs/WORKFLOW.md asks for. Tailwind no longer reads `docs/` and
  `.github/`, so words there stop becoming CSS on the site (four unused classes dropped). `main` now
  requires a pull request to be up to date with it before merging
- 2026-10-23 | tests: the weekly deep property run works again (its tests may take as long as 5s ×
  `FC_RUNS_MULTIPLIER`; Vitest's 5s default stopped them since the move to Node), and the 100%
  branch floor no longer fails at random (two drawings on the same day are now tested directly
  instead of only when a property test generated them); stale paths fixed in the CHANGELOG header
  and the ARCHITECTURE diagram
- 2026-10-16 | src/: the styles move to `src/styles/` (`main.css`, `fonts/`), the shared test
  helpers to `src/testing/` with camelCase names like the rest of `src/`, and the icon and logo
  drawings to `src/lib/` (the build scripts read them, so they no longer reach into
  `src/components/`); `useLightBox.ts` is renamed `useLightbox.ts` to match its export. No change to
  the site
- 2026-10-16 | docs: `docs/DECISIONS.md` (why the project is set up as it is, and when to revisit
  each choice) and `docs/WORKFLOW.md` (branch to live site, merging, deploys, upgrading pinned
  dependencies); the README now links every page in `docs/`
- 2026-10-16 | tests: 100% of lines, branches and functions in the `.ts` code (373 tests, up from
  316). The test runner and the placeholder command are tested like the rest; code that only starts
  a real program (each command's entry line, `vite build`, Vitest itself) or guards a case that
  cannot happen is marked `/* c8 ignore */` with its reason; two dead branches were removed. CI now
  fails below 100% of lines or branches (new `--min-branches` flag). Tests for the `.vue` components
  are next (docs/plans/TODO.md)
- 2026-10-16 | script/: one folder per command (`build/`, `version/`, `changelog/`, `design/`,
  `placeholders/`, `test_runner/`) plus `lib/`, with file names that say what they do; the shared
  test helpers move to `src/test_helpers/`. Script names are unchanged
- 2026-10-16 | tooling: moved from Deno to Node + npm. Tests run on Vitest (same files, tiers and
  `npm test` summary), `vue-tsc` type-checks the `.vue` components too, ESLint and dprint replace
  `deno lint` and `deno fmt` (same formatting), and CI uses `setup-node`. Every dependency and
  GitHub Action is on its latest release and pinned exactly: Node 24.22.0 (LTS), Vue 3.5.44, Vite
  8.3.4, Tailwind 4.3.3, sharp 0.35.5, Vitest 5.0.5, TypeScript 6.0.3 (the newest typescript-eslint
  supports), actions pinned to their release commits. The site itself is unchanged
- 2026-10-16 | docs: `docs/` reorganised into reference guides, `plans/` (now just the backlog,
  TODO.md; finished plans are deleted) and `assets/` for the generated images; `npm run test:html`
  writes a browsable line-by-line coverage report
- 2026-10-14 | tests: no untested files left — the build command, the design-guide generator and the
  logo generator are tested (which step runs for which arguments, exit codes, a real asset build on
  a throwaway collection, every generated image written at the right size, and `docs/` kept in step
  with the code that draws it); the coverage run now fails if any source file is not imported by a
  test; 313 tests
- 2026-10-14 | tests: every source file of the site is now loaded by a test; 30 more for the
  collections and ui stores, the scroll-spy, the breakpoint and click-outside (291 in all); line
  coverage 96.5%, floor raised from 92% to 94%
- 2026-10-07 | docs: `docs/TEST-PROCEDURES.md`, a step-by-step runbook for the tests (machine setup,
  everyday running, the pre-PR checklist, what to do when a test, CI, a property test or coverage
  fails, adding tests and folders, reading the reports on GitHub, maintenance, the runner's flags
  and how it works); the documented `deno task test -- --verbose` did not work and is corrected
- 2026-10-07 | tests: the version and changelog commands are tested as commands (dry run, writing,
  nothing to do, failure exit code, a missing list file); that area's line coverage from 73.1% to
  98.3%, the total to 96.2%, floor raised from 90% to 92%
- 2026-10-07 | test reporting: tests and coverage are also grouped by area (what part of the project
  they protect), with a count of source files no test imports; `deno task test:report` saves the
  full report, and CI keeps it; fixed a coverage exclude pattern that was silently leaving
  `record.ts` and the test harness out of the figure (corrected total: 94.9%)
- 2026-10-07 | tests: the asset pipeline is tested end to end on real images in a temporary folder
  (transcoding to square 2048px and 400px WebP, registering new drawings, thumbnail repair, failure
  reporting, the build and check reports); 11 more tests, line coverage 93.8% to 94.2% with three
  more files now counted, floor raised from 88% to 90%
- 2026-10-06 | icons: the collection bird and its placeholders now show the logo's bird; small label
  icons in the footer (version, drawings, commit), the viewer (Dhivehi name, illustrator's note,
  learn more), the sidebar total and the section counts; the retry button and the Mac search
  shortcut get icons too
- 2026-10-06 | logo: a mark (a bird perched on the open edge of an unfinished frame, in the icon
  stroke), a solid tile for small sizes, and lockups with the wordmark; the mark is in the header,
  the files are in `docs/logo/`, and the rules are in the design guide; the footer link shows
  GitHub's mark
- 2026-10-06 | accent menu widened from 6 to 12 contrast-checked hues and shown in the design guide;
  icons grouped by purpose; the search key hints use icons instead of Unicode arrows
- 2026-10-06 | docs: `docs/ARCHITECTURE.md` (the three programs, the site's layers and stores, the
  rules), `docs/DATA.md` (every field in the data files, what the checks enforce, recipes) and
  `docs/TESTING.md` (tiers, writing tests, coverage, CI); the README links to them
- 2026-10-06 | tests: 23 more (the no-git fallback of the version, `markDrawn`, the changelog log
  parser, lightbox image state and zoom limits, collection load errors and stats, the placeholder
  SVG); line coverage from 90.2% to 93.0%, floor raised from 85% to 88%
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
  the group view uses a hierarchy icon; placeholders are redrawn from the collection icons by `deno
  task placeholders`
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
- 2026-09-30 | test harness: tests are tiered by file name (unit / dom / prop / contract) and `deno
  task test` prints one row per tier (about 9 lines instead of 151), lists failures first, and in CI
  writes a job summary, annotates failures and keeps the JUnit file; a weekly `nightly.yml` runs the
  property tests at 25× depth
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

## v0.8.0 Alhi Maakanaa (Redesign, Performance & Tooling)

- 2026-07-05 | scroll-spy fix (content-visibility regression), Dhivehi name + Thaana script search,
  CSS de-duplication (`.text-muted`, `.tile-grid`, `.icon-btn-overlay`)
- 2026-07-05 | Lighthouse Accessibility + SEO to 100 — contrast pass, meta description, favicon path
  fix, eager above-the-fold images
- 2026-07-05 | performance: precomputed item fields (isDrawn / sortKey / searchText), native lazy
  images, debounced search, shallowReactive immutable data, code-split lightbox, Vue prod flags and
  a vendor chunk
- 2026-07-05 | derived versioning (patch = commit count, +count = illustrations) and `deno task
  changelog`; feature-based component structure with `useAppContext` provide/inject
- 2026-07-05 | docs: README rewritten for the new architecture
- 2026-07-05 | repo hygiene: PR CI (lint/format/build), LF line-ending policy, Pages moved to
  workflow builds, dead gh-pages branch removed
- 2026-07-05 | UI cohesion pass: accent design token, shared icon/UI components, matching skeletons,
  Ctrl/⌘K search, dismissible filter chip, unified component naming
- 2026-06-30 | global search: cross-collection results with counters and keyboard navigation
- 2026-05-15 | added new component; bumped deploy script
- 2026-05-12 | refactored search, segmented the build pipeline, overhauled the GitHub deploy
  workflow, re-transcoded all images

## v0.7.0 Iruvaihudhu (Multi-collection Architecture)

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

## v0.6.0 Dhon Raabondhi (QoL, Search, and Data)

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

## v0.5.0 Dhandifulhu Dhooni (Tailwind & Dark Mode)

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

## v0.4.0 Valu Bondana (Vue Rewrite)

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

## v0.3.0 Gudugudaa Dhooni (Deno & Build Tools)

- **0.3.018+003** | 2025-02-25 | project housekeeping
- **0.3.017+003** | 2025-02-24 | added bundler tests
- **0.3.016+003** | 2025-02-19 | added tests to handler
- **0.3.015+003** | 2025-02-15 | code formatting improvements
- **0.3.014+003** | 2025-02-14 | added license
- **0.2.013+003** | 2025-02-14 | fixed expanded images
- **0.2.012+003** | 2025-02-14 | migrated to Deno and esbuild

## v0.2.0 Kunburu Reyru (Deployment Setup)

- **0.2.011+003** | 2025-02-07 | updated dependencies
- **0.2.010+003** | 2025-02-02 | major code refactor
- **0.2.009+003** | 2025-02-01 | added title card
- **0.2.008+003** | 2025-01-28 | fixed animation
- **0.2.007+003** | 2025-01-27 | added favicon
- **0.2.006+003** | 2025-01-27 | fixed local build process
- **0.2.005+003** | 2025-01-26 | configured GitHub Actions workflow for deployment
- **0.2.004+003** | 2025-01-26 | removed node_modules from tracking
- **0.2.003+003** | 2025-01-11 | 🐦 Bird 003: Garganey

## v0.1.0 Reyru (Initial Development)

- **0.1.002+002** | 2024-10-15 | 🐦 Bird 002: Cotton Pygmy-Goose
- **0.1.001+001** | 2024-10-10 | 🐦 Bird 001: Lesser Whistling-Duck
