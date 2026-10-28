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
             full/ · thumb/
                │   the contract: fetched at runtime, never imported by src/
                ▼
┌─ 2. The site (src/) ────────────────────────────────────────┐
│ app/  →  gallery/ viewer/ search/ about/ shell/             │
│      →  ui/  browser/  data/  →  domain/                    │
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

The shape of the `public/` files is typed once, in [`src/data/files.ts`](../src/data/files.ts), and
used by all three.

## Where things are

```
public/                 Static assets, served as-is
  collections.json      Collection definitions (id, label, emoji, links, …)
  lists/<id>.json       Item data per collection, grouped by taxonomy
  stats.json            The archive's numbers, written by the asset build
  full/<id>/            Full-resolution WebP illustrations
  thumb/<id>/           Grid thumbnails (generated)
src/
  main.ts               Mounts app/App.vue
  env.d.ts              The build-time globals, which only app/buildInfo.ts reads
  app/                  App.vue (makes and provides the stores, starts the router), AppShell (the
                        frame, which places each feature), the router, the pages, the build's
                        details, actions that touch more than one store
  shell/                TopBar, CollectionMenu, SideNav, AppFooter; the theme and layout stores
  gallery/              Gallery, its sections and tiles, the scroll-spy, the view over a
                        collection; the collections and view stores
  viewer/               Viewer, ViewerDetails, ViewerShare; zoom, paging, the dialog's keys;
                        the viewer store
  search/               SearchBox and its dropdown; finding, folding and highlighting results;
                        the search store
  about/                The About page (#about) in sections, numbered from stats.json; the stats store
  ui/                   Shared components that take props and inject no store (Icon, LogoMark,
                        IdBadge, EmptyState, DrawnFilter, ExternalLink, RetryButton), and the icon
                        and logo drawings (icons.ts, logo.ts) that the scripts use too
  browser/              The browser: theme, breakpoint, debounce, click outside, the accent,
                        the Ctrl+K shortcut, reloading, defineInjection
  data/                 The network: fetchJson, the collection and stats loaders, files.ts (the
                        shapes of the files in public/, which the scripts share)
  domain/               The archive's rules, pure: items and collections, names, counts and their
                        wording, dates, the project's links (the scripts use some of it too)
  journeys/             Whole visits through the real app (TESTING.md, the journey tier)
  styles/               main.css (Tailwind's setup and the imports), tokens.css and accents.css
                        (shared with the docs site), base.css, components.css, utilities.css, fonts/
  testing/              Shared test fixtures, the fake-DOM setup and property-test depth.
                        The tests themselves sit next to the code they cover (see TESTING.md)
script/                 One folder per command, run by Node; shared code in lib/ (SCRIPTS.md)
  ingest/               Take in new drawings: scan, plan, transcode, date them in the lists
  build/                The build's stages, and its Vite plugins: the size budget, the
                        Content-Security-Policy, a link preview per drawing
  generate/             Every generated file: stats, the design guide, icons, logo
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

| Layer            | Folder                                     | What lives there                                                                            |
| ---------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------- |
| Domain           | `src/domain/`                              | The archive's rules, plain TypeScript. A contract test keeps it pure                        |
| Data and browser | `src/data/`, `src/browser/`                | The network (only `data/` fetches) and the browser's APIs                                   |
| Shared UI        | `src/ui/`                                  | Components that take props and emit events, and inject no store; the icon and logo drawings |
| Features         | `src/{gallery,viewer,search,about,shell}/` | Each feature's components, composables and store. A feature does not import another's code  |
| App              | `src/app/`                                 | `App.vue` makes and provides the stores; the frame, the router, the actions across stores   |

### Stores

One per job, made in dependency order in `App.vue` and shared with `provide`/`inject` (through
`defineInjection`, which throws if a store is used outside its provider). A store that needs
another's state is handed it, so no feature imports another:

```
collections ──(collections, items by collection)──► search ──(debounced query)──┐
     └──────────────(the items on screen)────────────────────────────────────────┼──► view ──(drawings)──► viewer
layout ──(the scroll element, narrow, close the sidebar)──────────────────────────┘
theme, stats   (on their own)
```

| Store         | Folder     | Owns                                                                               |
| ------------- | ---------- | ---------------------------------------------------------------------------------- |
| `theme`       | `shell/`   | Light or dark, remembered once chosen                                              |
| `layout`      | `shell/`   | Whether the window is narrow, the sidebar drawer, the page, the scroll element     |
| `collections` | `gallery/` | The collections, the one on screen and its load state, every list loaded so far    |
| `view`        | `gallery/` | Group or month, drawn only, the planned list; the sections, counts and scroll-spy  |
| `search`      | `search/`  | The query, whether the results are open, and the results                           |
| `viewer`      | `viewer/`  | Whether the viewer is open, and on which drawing                                   |
| `stats`       | `about/`   | The archive's numbers (`stats.json`), loaded the first time a page asks, then kept |

Actions that touch more than one store live in [`src/app/actions.ts`](../src/app/actions.ts)
(`selectCollection`, `selectGlobalResult`, `ringTile`).

### Data flow

State moves one way:

1. `collections.json` loads; the first collection's list loads; the others are fetched in the
   background and cached.
2. Raw items are normalised once (`domain/toCollectionItems.ts`) and frozen: the drawn flag, sort
   key, timestamp, names (`domain/itemNames.ts`) and search text are precomputed. Components render
   an item's `names` list and never read a name field by name.
3. The query and view mode feed computed values that produce the grid sections, sidebar entries,
   counts and the viewer's order. Nothing is stored that can be derived.
4. Components render those values and call actions in response to input.

### The URL

[`useHashRoute`](../src/app/useHashRoute.ts) is the only code that reads or writes the address. The
grammar is `#<collection>`, `#<collection>/<item>` or `#<page>`. State changes are mirrored to the
hash, and a hash change (a deep link, the back button) is applied to the stores.

The pages that are not a collection (today, About) are one list,
[`src/app/pages.ts`](../src/app/pages.ts): an id, a label and a component each. The route reads it,
and `App.vue` hands it to the layout store, where the top bar's tabs, the collection menu, the
footer and the main area read it; so a new page is one entry there. A contract test keeps collection
ids and page ids apart.

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

- **Imports follow the layers.** `domain/` imports nothing but itself; a helper in `lib/` never
  imports a store; a component never imports a data composable directly.
- **`src/` never imports from `public/`.** It fetches, through one helper (`lib/fetchJson.ts`), and
  only in the loaders (`useCollections`, `useStats`): a page is a view of a store and never fetches.
  `script/` may import `collections.json`.
- **Components change state only through store actions.**
- **Anything that can be computed is not stored.** The version, the counts and the grouped views are
  all derived.
- **One owner per concern:** one URL owner, one icon registry, one place that words counts, one
  place that types the data files.
- **Pure first.** Put logic in `domain/` as a plain function when you can; it is the cheapest thing
  to test. Reach for a composable only when you need reactivity or the browser.
- **The data decides.** Adding a collection or an item is a JSON and image change, not a code
  change.

## Rules for the site's code

The code follows these rules, and two contract tests keep it so:
[`layers_contract_test.ts`](../src/app/layers_contract_test.ts) (rules 1, 2 and 6) and
[`naming_contract_test.ts`](../src/app/naming_contract_test.ts) (the naming a machine can check);
[`pureDomain_contract_test.ts`](../src/domain/pureDomain_contract_test.ts) keeps rule 3. The words
are in [GLOSSARY.md](GLOSSARY.md); the choices behind them are in [DECISIONS.md](DECISIONS.md)
("Folders by feature", "One word per idea").

### Principles

1. **Organise by feature.** A feature folder (`viewer/`, `search/`, `gallery/`, `about/`, `shell/`)
   holds its components, its composables and its store. Code two features share moves down a layer,
   never sideways into one of them.
2. **Layers point one way.** `app/` → features → `ui/`, `browser/`, `data/` → `domain/`. A layer
   imports only from the layers below it, and a feature not from another: it may inject another's
   store (or the app's actions), which `App.vue` makes and provides, but whatever a feature shows of
   another's (the search box in the top bar, the footer after a page) the app places, by a slot.
3. **`domain/` is pure.** Plain TypeScript: no Vue, no `document`, no `fetch`, no clock. The rules
   of the archive (names, counts, wording, groups, dates) live here and are tested hardest.
4. **One door to the outside.** Only `data/` fetches; only `browser/` (and components) touch
   `document`, `window` or `localStorage`; only `app/buildInfo.ts` reads the build-time globals
   (`__APP_VERSION__` and friends).
5. **A store per feature, derived state stays derived.** A store exposes read-only state and verbs;
   anything that can be computed is computed. Actions that touch more than one store live in
   `app/actions.ts`.
6. **Shared UI does not know the app.** Components in `ui/` take props and emit events; they never
   inject a store. A feature's components inject its own stores; what they need of another feature's
   (the collections in the top bar, the query in the grid, a tile opening the viewer) `AppShell`
   hands them as props and events. `AppShell` is the one component that reads every store, and
   `SideNav`, the gallery's sidebar in the shell's drawer, the one that reads two features'.
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

- `vite.config.ts` imports `script/version/version.ts` and the build's plugins in `script/build/`.
  They are the places the site's build depends on the scripts, kept so the version formula and each
  build step exist once.
