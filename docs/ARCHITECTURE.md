# Architecture

How the project is put together, and the rules that keep it that way. For how it looks, see
[DESIGN.md](DESIGN.md); for the data files, [DATA.md](DATA.md); for the tests,
[TESTING.md](TESTING.md).

## Three programs, one contract

The repository holds three small programs. They meet only at the files in `public/`.

```
raw_png/ (not in git)              script/version/base_version.json + git history
      │                                        │
      ▼                                        ▼
┌─ 1. Asset pipeline (script/) ───────────────────────────────┐
│ ingest/: scanSources (read disk) → planChanges (pure maths) │
│   → applyChanges (sharp, write JSON) → formatIngestReport   │
│ generate/ · version/ · changelog/ · docs/ · lib/            │
└───────────────┬─────────────────────────────────────────────┘
                ▼
   public/   collections.json · lists/<id>.json
             full/ · thumb/ · placeholders/
                │   the contract: fetched at runtime, never imported by src/
                ▼
┌─ 2. The site (src/) ────────────────────────────────────────┐
│ types ← lib ← composables ← stores ← components ← App.vue   │
└─────────────────────────────────────────────────────────────┘

┌─ 3. Test harness and CI (script/testRunner/, .github/) ────┐
│ tiers by file name → runner → JUnit → summary and coverage  │
│ verify.yml, reused by ci.yml (PRs) and deploy.yml (main)    │
└─────────────────────────────────────────────────────────────┘
```

1. **The asset pipeline** runs on your machine. It turns source PNGs into WebP images, dates newly
   drawn items in the list files, and reports anything missing or orphaned.
2. **The site** is a static Vue app. It fetches `collections.json`, then each list file, and builds
   everything else from them. There is no server and no database.
3. **The harness** runs the tests and gates every merge and deploy.

The shape of the `public/` files is typed once, in [`src/types/data.ts`](../src/types/data.ts), and
used by all three.

## Where things are

```
public/                 Static assets, served as-is
  collections.json      Collection definitions (id, label, emoji, links, …)
  lists/<id>.json       Item data per collection, grouped by taxonomy
  stats.json            The archive's numbers, written by the asset build
  full/<id>/            Full-resolution WebP illustrations
  thumb/<id>/           Grid thumbnails (generated)
  placeholders/<id>.webp  Shown for undrawn items (<id>-dark.webp in the dark theme)
src/
  components/
    layout/             Chrome, TopBar, SideNav — the app shell
    about/              The About page (#about), numbered from stats.json
    gallery/            Grid, tiles, lightbox, info sheet
    search/             Global search dropdown and sub-components
    icons/              Icon, CollectionIcon and LogoMark (the drawings are in lib/)
    ui/                 Reusable primitives (IdBadge, EmptyState)
  stores/               Domain state — search, ui, collections, overlay, stats — each with readonly
                        state + actions, shared through provide/inject (defineInjection)
  composables/          Reusable logic (data pipeline, scroll-spy, lightbox, URL routing)
  lib/                  Small framework-free helpers, and the icon and logo drawings
                        (icons.ts, logo.ts) that both the site and the scripts use
  types/                Shared TypeScript types
  styles/               main.css (Tailwind), tokens.css and accents.css (shared with the docs site), fonts/
  testing/              Shared test fixtures, the fake-DOM setup and property-test depth.
                        The tests themselves sit next to the code they cover (see TESTING.md)
script/                 One folder per command, run by Node; shared code in lib/ (SCRIPTS.md)
  ingest/               Take in new drawings: scan, plan, transcode, date them in the lists
  build/                The build's stages, and its Vite plugins: the size budget, the
                        Content-Security-Policy, a link preview per drawing
  generate/             Every generated file: stats, placeholders, the design guide, icons, logo
  check/                Read-only checks: the assets, and the generated files are current
  version/              The derived version; base_version.json stores major/minor only
  changelog/            Insert unlogged commits into CHANGELOG.md
  docs/                 The docs site's helpers (links, live blocks, accents)
  testRunner/           The test runner (`npm test`): tiers, areas, reports, coverage
  lib/                  Io, the command kit, collections, list files, paths
docs/                   Reference guides at the top level; plans/ for work not done yet,
                        assets/ for generated images (see README.md)
```

## The site, layer by layer

Imports only point leftwards in this list; nothing imports from a layer to its right.

| Layer            | Folder             | What lives there                                                                                                                                                  |
| ---------------- | ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Types            | `src/types/`       | Shapes only. `data.ts` is the raw files; `collections.ts` the app's own                                                                                           |
| Pure helpers     | `src/lib/`         | Functions with no Vue and no DOM state: normalising items, wording counts, collapsing search groups; the icon and logo drawings, which the build scripts read too |
| Composables      | `src/composables/` | Reusable logic that uses Vue reactivity or the browser: loading and caching, filtering and grouping, the lightbox, scroll-spy, URL routing                        |
| Stores           | `src/stores/`      | The app's state, one per domain, each exposing read-only state and actions                                                                                        |
| Components       | `src/components/`  | Templates. They read stores and call actions; they hold no shared state                                                                                           |
| Composition root | `src/App.vue`      | Creates the stores, provides them, starts the router                                                                                                              |

### Stores

There are five, created in dependency order and shared with `provide`/`inject` (through
`defineInjection`, which throws if a store is used outside its provider):

```
search ──(debounced query)──┐
                            ├──► collections ──(drawn items)──► overlay
ui ─────(view mode)─────────┘
stats   (on its own)
```

| Store         | Owns                                                                                |
| ------------- | ----------------------------------------------------------------------------------- |
| `search`      | The query and whether the dropdown is open                                          |
| `ui`          | Sidebar, theme, view mode (group or date), scroll-spy                               |
| `collections` | The collection list, the active one, loaded items, and every view derived from them |
| `overlay`     | Which item is open in the lightbox                                                  |
| `stats`       | The archive's numbers (`stats.json`), loaded the first time a page asks, then kept  |

Actions that touch more than one store live in [`src/stores/actions.ts`](../src/stores/actions.ts)
(`switchCollection`, `selectGlobalResult`).

### Data flow

State moves one way:

1. `collections.json` loads; the first collection's list loads; the others are fetched in the
   background and cached.
2. Raw items are normalised once (`lib/collectionItems.ts`) and frozen: the drawn flag, sort key,
   timestamp, names (`lib/itemNames.ts`) and search text are precomputed. Components render an
   item's `names` list and never read a name field by name.
3. The query and view mode feed computed values that produce the grid sections, sidebar entries,
   counts and the lightbox order. Nothing is stored that can be derived.
4. Components render those values and call actions in response to input.

### The URL

[`useHashRoute`](../src/composables/core/useHashRoute.ts) is the only code that reads or writes the
address. The grammar is `#<collection>`, `#<collection>/<item>` or `#<page>`. State changes are
mirrored to the hash, and a hash change (a deep link, the back button) is applied to the stores.

The pages that are not a collection (today, About) are one list, [`src/pages.ts`](../src/pages.ts):
an id, a label and a component each. The route, the top bar's tabs, the collection menu and the main
area all read it, so a new page is one entry there. A contract test keeps collection ids and page
ids apart.

## The asset pipeline

`npm run ingest` runs four steps per collection (it changes files git tracks, so it runs on your
machine, never in CI):

| Step       | File                                  | Does                                                           |
| ---------- | ------------------------------------- | -------------------------------------------------------------- |
| **Scan**   | `script/ingest/scanSources.ts`        | Reads the list file and the three image folders, once          |
| **Plan**   | `script/ingest/planChanges.ts`        | Pure set arithmetic: what to register, transcode, or flag      |
| **Apply**  | `script/ingest/applyChanges.ts`       | Dates new items in the JSON, writes `full/` and `thumb/` WebPs |
| **Report** | `script/ingest/formatIngestReport.ts` | The warnings, each step, the summary                           |

Keeping the plan pure is what makes it testable without touching the disk. `npm run check`
(`script/check/`) runs scan and plan only, and fails if anything is missing or orphaned; it also
compares the generated text files with what their generators would write now.

Other scripts: `version/version.ts` (the version, see the README), `changelog/changelog.ts`, and
`generate/` (every generated file, one generator each: `npm run generate`).

Every script follows the principles and naming in [SCRIPTS.md](SCRIPTS.md): one job per command
(`ingest`, `build`, `generate`, `check`, …), each made with `command` and reaching the outside world
only through `Io`.

## Rules

- **Imports follow the layers.** A helper in `lib/` never imports a store; a component never imports
  a data composable directly.
- **`src/` never imports from `public/`.** It fetches, through one helper (`lib/fetchJson.ts`), and
  only in the loaders (`useCollections`, `useStats`): a page is a view of a store and never fetches.
  `script/` may import `collections.json`.
- **Components change state only through store actions.**
- **Anything that can be computed is not stored.** The version, the counts and the grouped views are
  all derived.
- **One owner per concern:** one URL owner, one icon registry, one place that words counts, one
  place that types the data files.
- **Pure first.** Put logic in `lib/` as a plain function when you can; it is the cheapest thing to
  test. Reach for a composable only when you need reactivity or the browser.
- **The data decides.** Adding a collection or an item is a JSON and image change, not a code
  change.

## Rules for the site's code

Where `src/` is going: the site overhaul ([plans/SRC-OVERHAUL.md](plans/SRC-OVERHAUL.md)) moves the
code to these rules one phase at a time, the site looking and behaving the same throughout. Until a
phase lands, "The site, layer by layer" above describes the code as it is; new code follows these
where the folder it needs already exists. The words are in [GLOSSARY.md](GLOSSARY.md); the choices
behind them are in [DECISIONS.md](DECISIONS.md) ("Folders by feature", "One word per idea").

### Principles

1. **Organise by feature.** A feature folder (`viewer/`, `search/`, `gallery/`, `about/`, `shell/`)
   holds its components, its composables and its store. Code two features share moves down a layer,
   never sideways into one of them.
2. **Layers point one way.** `app/` → features → `ui/`, `browser/`, `data/` → `domain/`. A layer
   imports only from the layers below it. A contract test checks the imports.
3. **`domain/` is pure.** Plain TypeScript: no Vue, no `document`, no `fetch`, no clock. The rules
   of the archive (names, counts, wording, groups, dates) live here and are tested hardest.
4. **One door to the outside.** Only `data/` fetches; only `browser/` (and components) touch
   `document`, `window` or `localStorage`; only `app/buildInfo.ts` reads the build-time globals
   (`__APP_VERSION__` and friends).
5. **A store per feature, derived state stays derived.** A store exposes read-only state and verbs;
   anything that can be computed is computed. Actions that touch more than one store live in
   `app/actions.ts`.
6. **Shared UI does not know the app.** Components in `ui/` take props and emit events; they never
   inject a store. Feature components may inject their own store and the app's.
7. **Types live with their owner.** A type is defined in the module that makes the value, and
   imported from there. No barrel file, and no `types/` folder. The shapes of the files in `public/`
   (shared with `script/`) live in `data/files.ts`.
8. **One word per idea**, and a name never means two things: the viewer is `viewer` everywhere, the
   month view is `'month'`, and the counts are `counts`, not `stats`.
9. **Small files.** A component does one job and stays under about 200 lines; a page is made of
   sections; a composable is one behaviour.

### Naming

| Thing             | Rule                                                                                       | Example                              |
| ----------------- | ------------------------------------------------------------------------------------------ | ------------------------------------ |
| Folders           | A feature or a layer, one word                                                             | `viewer/`, `domain/`                 |
| Files             | Named after the main export (DECISIONS.md)                                                 | `useScrollSpy.ts`                    |
| Components        | PascalCase noun; prefixed with the feature when the word alone is vague                    | `ViewerDetails.vue`, `SearchBox.vue` |
| Composables       | `use` + what it gives; never `Logic`, `Data`, `Manager`, `Helper`                          | `useScrollSpy`, `useCollectionView`  |
| Store verbs       | `open`, `close`, `select…`, `set…`, `toggle…`, `show…`; never `update`, `switch`, `handle` | `selectCollection`                   |
| Events            | kebab-case verbs                                                                           | `select`, `close`, `go-to-group`     |
| Template handlers | `on` + event                                                                               | `onSelect`                           |
| Booleans          | `is`, `has`, `should`, `can`                                                               | `isNarrow`, `hasNext`                |
| Element refs      | end in `El`                                                                                | `dialogEl`, `scrollEl`               |
| Types             | The noun; no `Data`, `Info`, `Config`, `Return` suffix                                     | `Collection`, `CollectionView`       |
| Variables         | Whole words; `i` and `e` only in one-line lambdas                                          | `collection`, not `col`              |

## Known gaps

- Eleven `.vue` files (the shell, search, the viewer component, `LogoMark`) have no test of their
  own, and a `.vue` file counts toward coverage only once a test imports it; the test overhaul's
  phase 4 closes this ([plans/TEST-OVERHAUL.md](plans/TEST-OVERHAUL.md)).
- `vite.config.ts` imports `script/version/version.ts` and the build's plugins in `script/build/`.
  They are the places the site's build depends on the scripts, kept so the version formula and each
  build step exist once.
