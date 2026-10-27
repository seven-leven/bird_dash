# Glossary

The words this project uses, each with one meaning, so the interface, the code, the docs and the
commit messages say the same thing. When a word here and a name in the code disagree, the word wins
and the code is renamed; the third column says where that is still to happen.

Use the word in the first column; avoid the ones in the last.

## The archive

| Word                   | Means                                                                                                    | In the code                                                                | Not                                       |
| ---------------------- | -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ----------------------------------------- |
| **archive**            | Everything on the site together: every collection, drawn and not                                         | `stats.json` counts it                                                     | portfolio, gallery (that is a page)       |
| **collection**         | Birds, sharks, shells: one entry in `public/collections.json`, with its own list, icon and accent        | `CollectionConfig` (to be `Collection`)                                    | category, set, series                     |
| **list**               | A collection's file of items, `public/lists/<collection>.json`, keyed by group                           | `RawCollectionData` (to be `ListFile`)                                     | data, catalogue                           |
| **item**               | One entry in a list, drawn or not. Most are species; not every one has to be                             | `CollectionItem` (to be `Item`)                                            | species (in general), card, entry         |
| **item id**            | The digits that number an item in its collection (`029`): in the URL, the file names and the order       | `itemId`. The internal `id` (`birds-item-1`, in list order) is never shown | number, index                             |
| **drawing**            | A drawn item's picture, by the illustrator                                                               | `isDrawn`, `drawnTime`                                                     | image (for the idea), illustration        |
| **drawn**              | An item that has a drawing: a `drawn` date in its list entry                                             | `drawn: 'YYYY-MM-DD'`                                                      | done, complete                            |
| **placeholder**        | What an item without a drawing shows: its collection's icon, faint on grey; one per collection and theme | `public/placeholders/<id>.webp`, `<id>-dark.webp`                          | blank, missing image                      |
| **group**              | A list's top-level key: a family, an order, a group. The collection names it (`groupLabel`: "Family")    | `group`, `groupLabel`                                                      | category, section (that is the gallery's) |
| **names**              | An item's names, in order: its Dhivehi names, English, Latin                                             | `item.names` (`src/lib/itemNames.ts`)                                      | title, label                              |
| **title**              | The name an item is headed by: the first Dhivehi name, or the English one when it has none               | role `title`                                                               | heading                                   |
| **Dhivehi name**       | A name in Thaana, set in Faruma, often with its **romanisation** (how to say it in Latin letters)        | `dhiv_script`, `dhiv`; role `title` or `also`, `roman`                     | local name, translation                   |
| **illustrator's note** | The illustrator's own words about a drawing                                                              | `illustratorNote`                                                          | description, caption                      |
| **stats**              | The archive's numbers, worked out by the build into `public/stats.json` and shown on the About page      | `Stats`, the `stats` store                                                 | counts (those are live)                   |

## The site

| Word                   | Means                                                                                        | In the code                                                         | Not                                       |
| ---------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- | ----------------------------------------- |
| **page**               | What the main area shows: the gallery, or one of the pages in `src/pages.ts` (About)         | `Page`, `PAGES`                                                     | route, screen, view                       |
| **gallery**            | The page of one collection's tiles, in sections                                              | `GalleryContent.vue` (to be `Gallery.vue`)                          | grid (that is its layout), content        |
| **view**               | How the gallery is arranged: by **group** or by **month**                                    | `ViewMode` `'group' \| 'date'` (to be `View`, `'month'`)            | mode, date view                           |
| **section**            | One heading and its tiles in the gallery: a group, or a month                                | `activeSection`, `registerHeader`                                   | group (in the month view), block          |
| **drawn only**         | The group view's filter that hides items without a drawing                                   | `drawnOnly`                                                         | hide placeholders                         |
| **tile**               | One item in the gallery: its image (drawing or placeholder) and its names below              | `ItemTile.vue`                                                      | card, thumbnail (that is the image file)  |
| **sidebar**            | The list of sections beside the gallery, under the collection's emblem                       | `SideNav.vue`, `sidebarOpen`                                        | menu, drawer                              |
| **emblem**             | The collection's icon at the top of the sidebar, the largest icon on the page                | `CollectionIcon` at `size-10`                                       | logo                                      |
| **viewer**             | The full-size drawing, with zoom, its details and the way to the next one                    | `LightBox.vue`, `useLightbox`, the `overlay` store (to be `viewer`) | lightbox, overlay, modal, popup           |
| **details**            | The panel beside the drawing in the viewer: names, facts, the note, links                    | `ItemSheet.vue` (to be `ViewerDetails.vue`)                         | sheet, info                               |
| **search**             | Finding items across every collection, from the top bar                                      | `GlobalSearch.vue`, the `search` store                              | filter (that is drawn only)               |
| **result**             | One item that matches a search; results are grouped by collection                            | `GlobalSearchResult` (to be `SearchResult`)                         | hit, match (that is the matched text)     |
| **counts**             | The live numbers of what is on screen: "4 of 8", "10 matches, 1 drawn"                       | the collections store's `stats` (to be `counts`)                    | stats                                     |
| **accent**             | A collection's colour, one hue from the menu of palettes in `src/styles/`; the signal colour | `accent`, `data-accent`, `accent-500`                               | theme colour, brand colour                |
| **theme**              | Light or dark                                                                                | `useTheme`, `.dark`                                                 | mode, colour scheme                       |
| **id badge**           | The small `#029` on a tile and in the viewer                                                 | `IdBadge.vue`                                                       | number tag                                |
| **mark**, **wordmark** | The logo's drawing; the words "Wildlife Illustrated" set beside it. Together, a **lockup**   | `LogoMark.vue`, `WORDMARK`                                          | icon (for the mark), logo (for the words) |
| **icon**               | One drawing from the registry in `src/lib/icons.ts`, drawn by `<Icon>`                       | `ICONS`, `Icon.vue`                                                 | glyph, symbol                             |
| **manifesto**          | The design rules, [DESIGN.md](DESIGN.md), and its five **principles** (P1–P5)                |                                                                     | style guide                               |
| **docs site**          | These pages built in the site's design, at `/bird_dash/docs/`                                | `docs/.vitepress/`                                                  | wiki                                      |

## The code

| Word                            | Means                                                                                                       | In the code                                    | Not                |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------- | ---------------------------------------------- | ------------------ |
| **store**                       | One area of state, made once in `App.vue` and shared with `provide`/`inject`: read-only state and its verbs | `create…Store`, `use…`                         | context, service   |
| **action**                      | A verb that changes more than one store                                                                     | `src/stores/actions.ts`                        | handler            |
| **composable**                  | A `use…` function that builds reactive state or behaviour                                                   | `src/composables/`                             | hook, mixin        |
| **derived**                     | Computed from other state, never stored                                                                     | `computed`                                     | cached             |
| **layer**, **feature**          | The planned layout of `src/`: shared layers (`domain/`, `data/`, `browser/`, `ui/`) under feature folders   | [plans/SRC-OVERHAUL.md](plans/SRC-OVERHAUL.md) | module (too vague) |
| **command**                     | A script run as `npm run <word>`; one job each ([SCRIPTS.md](SCRIPTS.md))                                   | `script/<command>/`                            | task, tool         |
| **plan**, **apply**, **report** | A command's three parts: decide (pure), do, say                                                             | `planChanges`, `applyChanges`                  |                    |

## Building and releasing

| Word                | Means                                                                                                     | In the code                                   | Not                                   |
| ------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------- | ------------------------------------- |
| **source art**      | The illustrator's PNGs, in `raw_png/<collection>/` on your machine, never in git                          | `raw_png/`                                    | originals, raw                        |
| **full**, **thumb** | The two WebP sizes made from source art: the viewer's and the tile's                                      | `public/full/`, `public/thumb/`               | large, small, thumbnail               |
| **ingest**          | Take in new drawings: make the WebPs, date the new entries, rewrite `stats.json`. Changes tracked files   | `npm run ingest`, `script/ingest/`            | import, add, build                    |
| **build**           | Make `dist/` from what is committed: the site, then the docs. Changes nothing git tracks                  | `npm run build`, its stages `site` and `docs` | compile, bundle (that is Vite's part) |
| **generate**        | Redraw a generated file: the placeholders, the design guide, the icon sheet, the logo files, `stats.json` | `npm run generate`, `script/generate/`        | render, export                        |
| **generated file**  | A committed file a command writes, never edited by hand; `check` fails when one is stale                  |                                               | asset (too vague)                     |
| **check**           | Compare the repository with what it should be, change nothing, exit 1 on a problem                        | `npm run check`                               | validate, lint (that is ESLint)       |
| **deploy**          | Publish `dist/` to GitHub Pages; every merge to `main` does, if the checks pass                           | `deploy.yml`                                  | release                               |
| **version**         | `0.9.<commits>`, worked out at build time, never stored                                                   | `npm run version`                             | release number                        |
| **line**            | A line of work, the `major.minor` part (`0.9`), named after a drawing's Dhivehi name: v0.9 "Valu Kukulhu" | `base_version.json`, `line_names.ts`          | release, milestone                    |
| **changelog entry** | One line of `CHANGELOG.md`: a date, then what changed, in words a visitor understands                     | `npm run changelog`                           | commit message                        |

## Testing

| Word               | Means                                                                                                                                                                                          | In the code                          | Not                                       |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ | ----------------------------------------- |
| **tier**           | The kind of test, by file name: **unit** `_test`, **dom** `_dom_test`, **prop** `_prop_test`, **contract** `_contract_test`; planned: **journey** `_journey_test`, **browser** `_browser_test` | `script/testRunner/tiers.ts`         | level, suite                              |
| **area**           | The part of the project a test protects (data and search, viewer and interface, …), by path                                                                                                    | `script/testRunner/areas.ts`         | module, category                          |
| **contract test**  | A test that reads the real files (lists, CSS, docs) and checks they agree with the code                                                                                                        | `*_contract_test.ts`                 | integration test                          |
| **property test**  | A test that checks a rule over many generated inputs (fast-check)                                                                                                                              | `*_prop_test.ts`                     | fuzz test                                 |
| **coverage floor** | The least coverage a run may have and pass: 100% of lines and branches                                                                                                                         | `--min-lines=100 --min-branches=100` | target, goal                              |
| **deep run**       | The weekly run of the property tests with many more inputs                                                                                                                                     | `nightly.yml`, `FC_RUNS_MULTIPLIER`  | soak test                                 |
| **promise**        | Something the site says it does (from the manifesto's principles or the README); each is kept by tests                                                                                         | the promise list in TESTING.md       | requirement, spec                         |
| **journey**        | A whole visit through the real app, in a test: open the site, search, land in the viewer, go back                                                                                              | `*_journey_test.ts` (planned)        | end-to-end (that is a real browser), flow |
| **fake**           | A stand-in for the outside world in a test (`fetch`, the console, a folder, the clock), from one kit                                                                                           | `src/testing/fakes/` (planned)       | mock, stub (unless it records calls)      |
| **scenario**       | A named, shared set of test data: an archive with gaps, a bird with two Dhivehi names                                                                                                          | `src/testing/scenarios/` (planned)   | setup, seed                               |
| **fixture**        | A ready-made value for tests (`makeItem`, `makeCollection`)                                                                                                                                    | `src/testing/fixtures.ts`            | mock (that is a fake behaviour)           |

## Words with two meanings

| Word       | Here                                                                                                                                          |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **tile**   | In the gallery, an item's tile. In the logo, the **tile** is the solid square version of the mark (`tile.svg`). Say "logo tile" for that one. |
| **assets** | `public/` holds the site's images; `docs/assets/` holds the docs' generated images; `dist/assets/` is what Vite emits. Name the folder.       |
| **id**     | An item's **item id** (`029`) or a collection's id (`birds`). The internal `id` (`birds-item-1`) is code only.                                |
| **group**  | A list's group ("Ducks, Geese, and Swans"), or the **view** by group. Never a search result's collection: say "results from Birds".           |
| **stats**  | Only `stats.json`. The numbers on screen are **counts**.                                                                                      |

## Adding a word

Add it when two people (or a person and the code) could mean different things by it. Give the word
to use, what it means in one line, where the code says it, and the words not to use. If the code
disagrees, note the rename and add it to a plan.
