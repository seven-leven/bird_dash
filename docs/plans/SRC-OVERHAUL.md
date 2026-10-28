# Site code overhaul

> **Status:** planned 2026-10-26; phases 0 (the rules) to 5 (features) done 2026-10-27, after the
> test overhaul's phases 1–3 (its journey tests are the safety net for moving files). Rebuilds the
> layout and naming of `src/` (the site's code: components, composables, lib, stores, styles, types)
> from the ground up, one pull request per phase, with the site looking and behaving the same
> throughout. `src/testing/` is out of scope except where its imports have to follow a move. The
> scripts went through the same (done 2026-10-26: [SCRIPTS.md](../SCRIPTS.md) and the CHANGELOG).
> Delete this page when phase 8 is done.

## Why

The site works, every line is tested, and the five decoupling items in TODO.md are done. What is
left is how the code is arranged and named, which grew a folder of each _kind_ at a time:

- **Folders by kind, not by feature.** The viewer is spread over `components/gallery/LightBox.vue`,
  `ItemSheet.vue`, `composables/ui/useLightbox.ts`, `useZoomPan.ts`, `useDialogKeys.ts`,
  `useDrawingNav.ts`, `stores/overlay.ts` and `types/`. Changing one feature means visiting five
  folders.
- **One thing, three names.** The viewer is `LightBox` (component), `useLightbox` (composable),
  `overlay` and `expandedImage` (store), and "the viewer" (DESIGN.md, the UI). The month view is
  `'date'` in code. `stats` is both the collections store's live counts and the `stats.json` store.
- **Vague names.** `Chrome.vue`, `GalleryContent.vue`, `useScrollLogic`, `useCollectionData` beside
  `useCollections`, `data` (`data.items`, `data.loading`), `COLLECTIONS` for a ref, `switch`,
  `update`, `isMobile` (it means "narrower than 1024px").
- **`lib/` is four things.** Pure domain rules (`itemNames`, `collapseGroups`), wording
  (`formatCount`, `viewName`), the browser (`accent` sets an attribute on `<html>`, `flashItem`,
  `scrollBehavior`), the network (`fetchJson`) and drawings (`icons`, `logo`).
- **Some things live in the wrong layer.** `monthKey`, a date formatter, lives in
  `useCollectionData` and two components import the composable to get it. `defineInjection` is in
  `composables/` but is not a composable. `useClickOutside` is under `search/` but is general.
- **Types by kind.** `types/composables.ts` holds the return types of composables;
  `types/collections.ts` and `types/data.ts` are far from the code that makes those shapes; a barrel
  (`types/index.ts`) hides where anything comes from.
- **One store, four jobs.** `stores/ui.ts` (97 lines) holds the theme, the viewport, the sidebar,
  the page, the view mode, the drawn-only filter and the scroll-spy.
- **Big files.** `AboutPage.vue` 341 lines (the history, the cards and the sentence builders),
  `GlobalSearch.vue` 256, `useCollectionData.ts` 201, `main.css` 392 (Tailwind setup, tokens,
  palettes, utilities and component classes in one file).

## Decisions (settled 2026-10-27)

| Question                      | Settled                                                                                                 | Why                                                                        |
| ----------------------------- | ------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Folders by feature or kind    | By feature (`viewer/`, `search/`, `gallery/`, …), with shared layers below them                         | A change to one feature stays in one folder; the import rules keep it tidy |
| One name for the viewer       | `viewer` everywhere (`Viewer.vue`, `useViewer`, the `viewer` store)                                     | It is what DESIGN.md and the interface call it                             |
| The month view's name         | `'month'`, not `'date'` (the `ViewMode` value)                                                          | The view is "Months" on screen; `'date'` is a field, not a view            |
| How far to split the ui store | Three: `theme`, `layout` (viewport, sidebar, page, scroll-spy), `view` (mode, filter, the derived grid) | One job each, and the grid's derivations leave the collections store too   |

## The rules it ends at

In [ARCHITECTURE.md](../ARCHITECTURE.md), "Rules for the site's code" (phase 0): the principles and
the naming. The words are in [GLOSSARY.md](../GLOSSARY.md), each with where the code still says
something else; every "to be …" there is a rename in the table below, and phase 8 checks none is
left.

## Where it ends up

```
src/
  main.ts
  app/          App.vue (makes and provides the stores), AppShell.vue, pages.ts,
                useHashRoute.ts, actions.ts, buildInfo.ts
  domain/       pure: Collection and Item types, toCollectionItems, itemNames, dhivehiNames,
                countWords, viewName, dates, collapseGroups, noteLinks, normalizeQuery, linkUrl
  data/         fetchJson, files.ts (the shapes of public/), useCollectionLoader, useStatsLoader
  browser/      defineInjection, useTheme, useBreakpoint, useDebouncedRef, useClickOutside,
                applyAccent, scrollBehavior
  ui/           Icon, CollectionIcon, LogoMark, IdBadge, EmptyState, DrawnFilter;
                icons.ts and logo.ts (the drawings Icon and LogoMark draw)
  shell/        TopBar, CollectionMenu, SideNav, AppFooter, the layout and theme stores
  gallery/      Gallery, GallerySection, ItemTile, tileImage, flashTile, useScrollSpy,
                useCollectionView, the collections and view stores
  viewer/       Viewer, ViewerDetails, useViewer, useZoomPan, useDialogKeys, useDrawingNav,
                the viewer store
  search/       SearchBox, SearchResults, SearchSummary, SearchKeyHints, useSearchResults,
                useResultKeys, useHighlight, the search store
  about/        AboutPage and its sections (Intro, Progress, Newest, History, Design),
                aboutSentences.ts, the stats store
  styles/       main.css (Tailwind setup and imports only), tokens.css, accents.css,
                components.css, utilities.css, base.css
  testing/      unchanged, apart from imports
  env.d.ts      the build-time globals (was vite-env.d.ts)
```

### Renames

| Now                                                                                                                  | After                                                                                                    |
| -------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `components/layout/Chrome.vue`                                                                                       | `app/AppShell.vue`                                                                                       |
| `App.vue`, `pages.ts`, `stores/actions.ts`, `composables/core/useHashRoute.ts`                                       | `app/App.vue`, `app/pages.ts`, `app/actions.ts`, `app/useHashRoute.ts`                                   |
| `components/gallery/GalleryContent.vue`                                                                              | `gallery/Gallery.vue`, with `GallerySection.vue` split out                                               |
| `components/gallery/LightBox.vue`, `ItemSheet.vue`                                                                   | `viewer/Viewer.vue`, `viewer/ViewerDetails.vue`                                                          |
| `composables/ui/useLightbox.ts`                                                                                      | `viewer/useViewer.ts`                                                                                    |
| `stores/overlay.ts` `expandedImage`, `open`, `close`, `update`                                                       | `viewer/viewerStore.ts` `isOpen`, `item`, `open`, `close`, `show`                                        |
| `components/search/GlobalSearch.vue`                                                                                 | `search/SearchBox.vue` (the dropdown's parts split out)                                                  |
| `SearchResultsList.vue`, `SearchDropdownHeader.vue`, `SearchKeyboardHints.vue`                                       | `SearchResults.vue`, `SearchSummary.vue`, `SearchKeyHints.vue`                                           |
| `composables/collection/useGlobalSearch.ts`                                                                          | `search/useSearchResults.ts`                                                                             |
| `composables/search/useSearchNavigation.ts`, `useSearchHighlight.ts`                                                 | `search/useResultKeys.ts`, `search/useHighlight.ts`                                                      |
| `composables/search/useClickOutside.ts`                                                                              | `browser/useClickOutside.ts`                                                                             |
| `composables/collection/useCollections.ts` (returns `COLLECTIONS`, `data`, `switchCollection`)                       | `data/useCollectionLoader.ts` (`collections`, `items`, `loadState`, `selectCollection`)                  |
| `composables/collection/useCollectionData.ts` (and its `monthKey`)                                                   | `gallery/useCollectionView.ts`; `domain/dates.ts` `monthName`                                            |
| `composables/collection/useStats.ts`                                                                                 | `data/useStatsLoader.ts`                                                                                 |
| `composables/ui/useScrollLogic.ts`                                                                                   | `gallery/useScrollSpy.ts`                                                                                |
| `composables/core/injection.ts`                                                                                      | `browser/defineInjection.ts`                                                                             |
| `composables/core/useDebounce.ts` (exports `useDebouncedRef`)                                                        | `browser/useDebouncedRef.ts`                                                                             |
| `composables/core/useBreakpoints.ts` (`isMobile`)                                                                    | `browser/useBreakpoint.ts` (`isNarrow`)                                                                  |
| `stores/ui.ts`                                                                                                       | `shell/themeStore.ts`, `shell/layoutStore.ts`, `gallery/viewStore.ts`                                    |
| collections store `stats`, `data`, `switch`, `list`                                                                  | `counts` (moves to the view store), `loadState`, `selectCollection`, `collections`                       |
| `lib/collectionItems.ts` (`toCollectionItems`, `resolveUrl`, `tileImage`)                                            | `domain/toCollectionItems.ts`, `domain/linkUrl.ts`, `gallery/tileImage.ts`                               |
| `lib/formatCount.ts`                                                                                                 | `domain/countWords.ts`                                                                                   |
| `lib/accent.ts`, `lib/scrollBehavior.ts`, `lib/flashItem.ts`                                                         | `browser/applyAccent.ts`, `browser/scrollBehavior.ts`, `gallery/flashTile.ts`                            |
| `lib/icons.ts`, `lib/logo.ts`, `components/icons/*`, `components/ui/*`                                               | `ui/`                                                                                                    |
| `types/data.ts` `RawItem`, `RawCollectionData`, `RawCollectionConfig`                                                | `data/files.ts` `ListEntry`, `ListFile`, `CollectionEntry`                                               |
| `types/collections.ts` `CollectionConfig`, `CollectionItem`, `DataState`, `GlobalStats`, `CollectionCache`           | `domain/` `Collection`, `Item`; `data/` `LoadState`; `ArchiveCounts`; `ItemsByCollection`                |
| `types/composables.ts` `GroupedData`, `CollectionStats`, `SidebarItem`, `GlobalSearchResult`, `UseScrollLogicReturn` | `CollectionView`, `ViewCounts`, `SectionEntry`, `SearchResult` with their composables; the last one goes |
| `ViewMode` `'group' \| 'date'`                                                                                       | `View` `'group' \| 'month'`                                                                              |
| `vite-env.d.ts`; `__APP_*__` read in `AppFooter.vue`                                                                 | `env.d.ts`; read once in `app/buildInfo.ts`                                                              |
| `styles/main.css` (392 lines)                                                                                        | `main.css` imports `tokens`, `accents`, `base`, `components`, `utilities`                                |

### Duplicates to fold

Found by a sweep on 2026-10-27 (repeated lines, names, strings, class lists and numbers across
`src/`, `script/` and `docs/.vitepress/`). Whole repeated blocks are rare; what repeats is small: a
helper, a constant, a few lines of markup. Each one is folded in the phase that already moves its
code, so it costs no extra pass.

| Repeated                                                                                                                                                                                                                                                 | Becomes                                                                                                                                                                 | Phase |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| **`plural(n, word)`**, written four times: `lib/formatCount.ts` and again in `script/check/formatCheckReport.ts`, `script/ingest/formatIngestReport.ts`, `script/version/version.ts`                                                                     | `domain/countWords.ts` `plural`; the scripts import it (they already import from `src/`)                                                                                | 1     |
| **The project's links**: the repository URL in `AppFooter.vue` (`SOURCE_URL`) and `script/lib/project.ts` (`REPO_URL`); the write-up URL in `AboutPage.vue` (`FOLIO_URL`); the site and repository URLs spelled out again in `docs/.vitepress/config.ts` | `domain/links.ts` (`REPO_URL`, `SITE_URL`, `DOCS_URL`, `WRITE_UP_URL`); `project.ts` and the docs' nav import it (the edit link stays inlined: VitePress serialises it) | 1     |
| **The narrow breakpoint, 1024**: the default of `useBreakpoints` and passed again by `stores/ui.ts`                                                                                                                                                      | One named constant in `browser/useBreakpoint.ts`, no argument, its comment tying it to Tailwind's `lg`                                                                  | 2     |
| **The search delay, 120 ms**: the default of `useDebouncedRef` and passed again by `stores/search.ts`                                                                                                                                                    | The search store names it (`SEARCH_DELAY`); `useDebouncedRef` takes the delay with no default                                                                           | 2     |
| **`currentPage = computed(() => findPage(page.value))`** in `Chrome.vue` and `CollectionMenu.vue`                                                                                                                                                        | A `currentPage` getter on the layout store                                                                                                                              | 3     |
| **The drawn filter's wiring**: the same four bindings and `(only) => only !== drawnOnly && toggleDrawnOnly()` in `GalleryContent.vue` and `SideNav.vue`, under two different conditions (only the side nav hides it at 0 drawn)                          | The view store's `showsDrawnFilter` and `setDrawnOnly(only)`; one condition, decided once                                                                               | 3     |
| **An external link**: `target="_blank" rel="noopener noreferrer"`, the icon and "(opens in a new tab)" in `AboutPage.vue` (twice), `ItemSheet.vue` and `AppFooter.vue`, with three different class lists                                                 | `ui/ExternalLink.vue` (`href`, an optional icon, the slot)                                                                                                              | 4     |
| **"Try again"**: the same button (`btn-primary focus-ring mt-3`, the reset icon) in `App.vue`, `AboutPage.vue` and `GalleryContent.vue`; `const reload = () => location.reload()` in two of them                                                         | `ui/RetryButton.vue`, emitting `retry`; the page reload in one place in `browser/`                                                                                      | 4     |
| **The loading grid**: ten pulsing tiles, the same markup in `App.vue` and `GalleryContent.vue`                                                                                                                                                           | `gallery/GallerySkeleton.vue`, used by both                                                                                                                             | 5     |
| **The viewer's props**, typed twice: `defineProps` in `LightBox.vue` and `LightboxOptions.props` in `useLightbox.ts`                                                                                                                                     | `ViewerProps` exported by `useViewer.ts`; `defineProps<ViewerProps>()`                                                                                                  | 5     |
| **The skeleton's colours** `animate-pulse bg-slate-200 dark:bg-slate-800`, 7 times in 4 files; **a text link** `font-medium text-accent-700 dark:text-accent-400 hover:underline underline-offset-2`, 3 times                                            | `.skeleton` and `.link` in `components.css`                                                                                                                             | 7     |

Phase 8's naming test also fails on a function defined twice under one name in `src/`, so a copy
cannot creep back.

## Phases

Each phase is one pull request, and folds the duplicates above marked for it. In every one: the site
looks and behaves the same, 100% lines and branches, all four checks green, files moved with `git
mv` so history follows, tests moved beside their files, and in the same PR the paths in
`script/testRunner/areas.ts`, the imports in `script/` and `docs/.vitepress/` (which import
`src/lib/icons.ts`, `logo.ts`, `pages.ts`, `types/data.ts` and the icon components), and the docs
that name a moved file. Best done when no other pull request touching `src/` is open, as nearly
every file moves.

- [x] **0. Agree the rules.** (2026-10-27) Settle the decisions above; write the principles, the
      glossary and the naming into ARCHITECTURE.md (the words are in GLOSSARY.md); a DECISIONS.md
      entry ("folders by feature"). _Done when_ the rules are merged.
- [x] **1. Domain** (2026-10-27). `domain/` from the pure half of `lib/`: `itemNames`,
      `dhivehiNames`, `collapseGroups`, `noteLinks`, `normalizeQuery`, `viewName`, `countWords` (was
      `formatCount`), `toCollectionItems` (was `collectionItems`, with `toCollection`), `linkUrl`
      (was `resolveUrl`), and `dates.ts` (`monthName`, was the composable's `monthKey`, with
      `parseDay` and `dayName` from the About page). The `Collection` and `Item` types (were
      `CollectionConfig` and `CollectionItem`) live in `toCollectionItems.ts`; `types/index.ts`
      re-exports them until phase 8. Folded: `plural` (the scripts import it) and the project's
      links (`domain/links.ts`; `script/lib/project.ts` goes). `pureDomain_contract_test.ts` keeps
      it pure. `tileImage` waits in `toCollectionItems.ts` for `gallery/` (phase 5).
- [x] **2. Data and browser** (2026-10-27). `data/`: `fetchJson`, `useCollectionLoader`
      (`collections`, `itemsByCollection`, `loadState`, `selectCollection`; the types `LoadState`,
      `ArchiveCounts`, `ItemsByCollection`), `useStatsLoader`, `files.ts` (`ListEntry`, `ListFile`,
      `CollectionEntry`, the stats shapes). `browser/`: `defineInjection`, `useTheme`,
      `useBreakpoint` (`isNarrow`, below `NARROW_BELOW`), `useDebouncedRef` (no default; the search
      store names `SEARCH_DELAY`), `useClickOutside`, `applyAccent`, `scrollBehavior`. `domain/` may
      import the file shapes, types only. `flashItem` and `shareLink` waited in `lib/` for their
      features (phase 5).
- [x] **3. Stores** (2026-10-27), each made straight into its feature: `shell/themeStore`,
      `shell/layoutStore` (narrow, sidebar, page and `currentPage`, the scroll element),
      `gallery/collectionsStore` (what is loaded), `gallery/viewStore` (view, drawn only, the
      planned list, the sections and `counts`, the drawings the viewer pages, and the scroll-spy,
      which the plan had in the layout store: it is the gallery's, and the layout's narrow flag,
      scroll element and sidebar are handed to it, so no feature imports another),
      `search/searchStore` (now finding its own results), `viewer/viewerStore` (`isOpen`, `item`,
      `open`, `close`, `show`), `about/statsStore`, and `app/actions.ts` (`selectCollection`).
      Folded: `currentPage` and the drawn filter (`showsDrawnFilter`, `setDrawnOnly`).
- [x] **4. Shared UI** (2026-10-27). `ui/` from `components/icons/`, `components/ui/`,
      `lib/icons.ts` and `lib/logo.ts`; none injects a store. Folded: `ExternalLink.vue` and
      `RetryButton.vue` (the reload once, in `browser/reloadPage.ts`).
- [x] **5. Features** (2026-10-27), renamed to the tables above. `AboutPage.vue` is six sections
      (`AboutIntro`, `Progress`, `Newest`, `Making`, `History`, `Design`) with `aboutSentences.ts`,
      `drawingLinks.ts` and a `.link-out` class; `SearchBox` keeps the box, `SearchDropdown` draws
      the results, and Ctrl+K is `browser/useFocusShortcut`; `Gallery` has `GallerySection` and
      `GallerySkeleton` (also `App.vue`'s); `ViewerDetails` has `ViewerShare`; `ViewerProps` is
      typed once. `View` is `'group' | 'month'`. Two departures: `tileImage` is
      `domain/tileImage.ts`, as the search results use it too; and `components/`, `composables/` and
      `stores/` could only go with `AppShell` (was `Chrome`), `useHashRoute` and `actions` in
      `app/`, so they moved ahead of phase 6. No file is over 200 lines.
- [x] **6. App** (2026-10-28). `App.vue` and `pages.ts` into `app/`; `app/buildInfo.ts` reads the
      build-time globals, once; `vite-env.d.ts` is `env.d.ts`. So that the layers point one way, the
      app places the features rather than the features each other: `AppShell` puts the search box in
      the top bar (a slot) and the footer after the gallery or a page (their default slot), and
      hands the footer the build; `App.vue` hands the page list to the layout store, where the shell
      reads it.
- [x] **7. Styles** (2026-10-28). `main.css` is Tailwind's setup (the sources, the dark variant, the
      theme mapping) and the imports; `base.css` the page's own rules (colour scheme, reduced
      motion, the Thaana line), `components.css` the `@layer components` classes, `utilities.css`
      the speeds, the tile grid and the scrollbar; `tokens.css` and `accents.css` as they were.
      Folded: `.skeleton` and `.link`. The guide reads the speeds from `utilities.css`. Gone: the
      unused `shimmer` animation.
- [x] **8. Close** (2026-10-28). `layers_contract_test.ts` checks every layer's imports (a feature
      may inject another's store or the app's actions, nothing else of it);
      `naming_contract_test.ts` checks that a file is named after what it makes (so `noteLinks.ts`
      is `noteSegments.ts`, and `createAppActions` is `createActions`), that no composable is called
      Logic, Data, Manager or Helper, and that no function is defined twice. `types/` is gone: each
      type lives with the module that makes it (`View` in `domain/viewName.ts`, the search's in
      `useSearchResults.ts`, the gallery's in `useCollectionView.ts`), and `collapseGroups` folds
      any group, so `domain/` needs none of them. The layout diagram in ARCHITECTURE.md is redrawn.
      This page goes once the features below are in.

## Features that ride along

The TODO has features that need the very code a phase moves. Each one comes as **its own pull
request straight after that phase**, on the new layout, so the phases themselves still change
nothing a visitor sees, and every visible change is reviewed on its own (in the browser, both
themes, a phone width).

| After phase  | Feature (from TODO.md)                                                                                                                                                                                              | Why there                                                                                                      |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| 1. Domain    | **A `kind` per collection** (`species` or `series`) in the `Collection` type and `data/files.ts`; the data contract test checks each kind's fields                                                                  | The domain types are rewritten in phase 1; adding the kind then costs one type, not a second pass              |
| 3. Stores    | **Fewer stores per component**: `Chrome`, `TopBar` and `GalleryContent` inject four stores each (the "afterwards" note under the decoupling items)                                                                  | Splitting the ui store and moving the grid's derivations is exactly what lets each component take only its own |
| 4. Shared UI | **Placeholders as icons**: an undrawn tile, a failed load and a search row draw `CollectionIcon` in the muted colour, instead of a generated image; `public/placeholders/`, its generator and `tileImage`'s URLs go | `ui/` is assembled in phase 4, and the icon component it builds is the one that replaces the images            |
| 4. Shared UI | **An icon per series** (butterfly, cake, mountain, sphere, face, running animal), drawn to the icon rules                                                                                                           | New entries in the registry `ui/` now owns                                                                     |
| 5. Features  | **Several images per item** (a series piece, or a drawing with its sketches): the viewer pages through an item's images with the same zoom and keys                                                                 | The viewer's parts (`useZoomPan`, `useDialogKeys`, `useDrawingNav`) land in `viewer/` together                 |
| 5. Features  | **The About page by kind**: "species", "Named in Dhivehi" and "Checked against references" counted for `species` collections only, series counted on their own                                                      | `AboutPage.vue` is split into sections in phase 5                                                              |
| 5. Features  | **Responsive thumbnails**: `srcset` on tiles, once `npm run ingest` makes a second, smaller size                                                                                                                    | The tile moves into `gallery/`; the second size is a scripts change made first                                 |
| 7. Styles    | **One set of text roles** (`.text-strong`, `.text-body`, `.text-muted`) replacing `.viewer-title/-body/-label`                                                                                                      | `components.css` is written in phase 7                                                                         |
| 7. Styles    | **Five type sizes**: drop `text-micro`, use `text-xs` for `.caps-label`, `.count-pill`, `.kbd-hint`; check 375px                                                                                                    | Same file, same pass; the guide and DESIGN.md change with it                                                   |
| 7. Styles    | **Warm paper on the site** (slate to stone), as its own commit so it is easy to drop                                                                                                                                | The neutral ramp lives in the files phase 7 writes                                                             |

[PLATFORM.md](PLATFORM.md) lists what Vue 3.5, Tailwind 4 and the browser add in the same phases
(`defineModel`, `useId`, `<dialog>` for the viewer, popovers, `light-dark()` tokens, the data
checked at the door); its rows are done in the phase named there.

Not riding along: **the focus-ring contrast fix** (in TODO.md's fixes) is too small and too urgent
to wait for a phase, and the series' **name decision** ("Wildlife Illustrated" over a sweet-treats
collection) is a choice, not code; both are done on their own.

## What keeps it safe

- **The tests check behaviour, not paths.** A move that changes what the site does fails a test; the
  component tests mount the real components.
- **The type check catches every broken import**, in `src/`, `script/` and the docs theme.
- **The docs build fails on a dead link** to a moved file; the area test fails on a file left out of
  an area.
- **Look before merging.** Each phase is checked in the browser (the gallery, the viewer, search,
  About, both themes, a phone width), as the earlier refactors were.

## Not in this plan

- `src/testing/`: unchanged apart from its imports.
- New features or visual changes inside a phase: they ride along after it (above), or go in TODO.md.
- A router library, a state library or other new dependencies: the hash route and the
  `provide`/`inject` stores stay.
