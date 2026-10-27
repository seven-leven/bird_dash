# Use the platform

> **Status:** planned 2026-10-27; phase 1 done 2026-10-27. What Node 24, TypeScript 6, Vite 8, Vue
> 3.5, Tailwind 4 and the browser already give this project that it does not use yet, and the
> architectural and general improvements found in the same look. Most of it rides along with the
> [test](TEST-OVERHAUL.md) and [site code](SRC-OVERHAUL.md) overhauls; the rest is small and stands
> alone. Delete this page when every row is done or dropped.

## Why

The stack is current, but the code was written a piece at a time, and several pieces are written by
hand where the platform has one built in: a viewer that traps focus itself, a dropdown that watches
for clicks outside, two argument parsers, `try`/`finally` around every fake in the tests. Each
built-in that replaces one removes code, and usually fixes an edge the hand-written one missed. The
same look turned up two bugs (the colour scheme, the month names) and a handful of gaps that are not
about the stack at all (the data is trusted unchecked, an error leaves a blank page, nothing
measures size or accessibility automatically).

## The rule

**Prefer the platform.** A built-in comes before hand-written code, and hand-written code comes
before a dependency. Each row below has to remove code, fix something, or make something visible to
a visitor better; a feature used only because it is new is not a reason. Recorded in DECISIONS.md
with phase 1.

## Fixes first

Small, visible, and none needs a phase. Phase 1 below; all four done 2026-10-27 (✓).

| What                                                                                                                                                                                                                                    | Fix                                                                                                                                                                                                                     |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **No `color-scheme`.** In dark mode the browser still draws the scrollbars, the search input and other native controls light.                                                                                                           | ✓ `color-scheme: light` on `:root` and `dark` on `.dark` (Tailwind's `scheme-light` and `dark:scheme-dark`), in `main.css`                                                                                              |
| **Month names follow the visitor's language.** `monthKey` formatted with `toLocaleString('default', …)`, so a browser set to another language showed its own month names among English text. Tests vary the timezone, not the language. | ✓ `toLocaleString('en', …)`; a test stands in a German browser                                                                                                                                                          |
| **The dark variant's old spelling.** `@variant dark (…)` at the top of `main.css` is the early Tailwind 4 form.                                                                                                                         | ✓ `@custom-variant dark (&:where(.dark, .dark *));`                                                                                                                                                                     |
| **No `theme-color`.** A phone's browser bar stayed its default colour over the page.                                                                                                                                                    | ✓ One `<meta name="theme-color">` in the top bar's colour, set by the theme script in `index.html` and by `useTheme`, so it follows the site's own switch, not only the OS; a contract test keeps the two colours alike |

## What the stack gives

| Tool          | Feature                                                                     | Where it applies                                                                                                                  | Replaces                                                                                               | When                             |
| ------------- | --------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | -------------------------------- |
| Node 24       | `util.parseArgs`                                                            | `script/lib/cli.ts` and `script/testRunner/runTests.ts`, which each have their own `parseArgs`                                    | Two hand-written parsers; `cli.ts` keeps only its `UsageError` and the shape                           | Phase 2                          |
| Node 24       | `util.styleText`                                                            | The reports' marks and headings (`MARK`, `printLines`)                                                                            | Plain text; it colours only on a terminal and honours `NO_COLOR`                                       | Phase 2                          |
| Node 24       | `fs.glob`                                                                   | `listFiles` in `script/lib/fs.ts`                                                                                                 | A hand-written directory walk                                                                          | Phase 2                          |
| Node 24       | `node --run`                                                                | CI and the docs' commands                                                                                                         | `npm run`, which starts slower                                                                         | Phase 2                          |
| TS 6, Node 24 | `using` and `await using` (`Symbol.dispose`)                                | Every fake in the test kit: `using fetch = fakeFetch(…)`, `await using dir = await tempDir()`, `using console = captureConsole()` | `try { … } finally { restore() }` in every test that fakes something                                   | Test overhaul phase 1            |
| TS 6          | `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`                    | `tsconfig.json`                                                                                                                   | Nothing; it catches `list[i]` used as if it were always there                                          | Phase 4, after the site overhaul |
| Vue 3.5       | `defineModel`                                                               | `DrawnFilter` (`drawnOnly` and the `choose` event), the viewer (`item` and `update:item`)                                         | Hand-written prop and event pairs; with it the drawn filter's wiring is one line                       | Site phases 4 and 5              |
| Vue 3.5       | `useTemplateRef`                                                            | The 6 element refs (`CollectionMenu`, `GlobalSearch`, `useDialogKeys`, the ui store)                                              | `ref<HTMLElement>()` and a matching string; ends in `El` by the naming rules                           | Site phase 5, as each file moves |
| Vue 3.5       | `useId`                                                                     | `aria-controls`, `aria-labelledby` and `aria-activedescendant` in search and the viewer                                           | Fixed ids, which collide if a component renders twice                                                  | Site phase 5                     |
| Vue           | `app.config.errorHandler`                                                   | `main.ts`                                                                                                                         | A blank page when a component throws (see below)                                                       | Site phase 6                     |
| Browser       | `<dialog>` and `showModal()`                                                | The viewer                                                                                                                        | Its own focus trap, Escape handling, `aria-modal` and z-index; the page behind becomes inert by itself | After site phase 5               |
| Browser       | The Popover API                                                             | The search dropdown and the collection menu                                                                                       | `useClickOutside` and the menus' own Escape handling                                                   | After site phase 5               |
| Browser       | View Transitions                                                            | Opening and closing the viewer from a tile; changing page                                                                         | Nothing; off under reduced motion, like every other motion                                             | After site phase 5, its own PR   |
| Tailwind 4    | `text-balance`, `text-pretty`                                               | Headings and the About page's paragraphs                                                                                          | Ragged two-line headings (the design guide already balances its own)                                   | Site phase 7                     |
| Tailwind 4    | Container queries (`@container`, `@sm:` …)                                  | The tile, the side nav, the viewer's details                                                                                      | Breakpoints on the window for things that live in a column                                             | Site phase 7                     |
| CSS           | `content-visibility: auto`                                                  | Each gallery section                                                                                                              | Rendering every section of a long collection up front                                                  | Site phase 7                     |
| Vite 8        | Its own chunking option, if `manualChunks` is on its way out under Rolldown | `vite.config.ts`, the `vue` chunk                                                                                                 | Check the build for a deprecation warning first; change only if there is one                           | Phase 2                          |

## Beyond the stack

Architectural and general improvements found in the same look. Each one is a pull request of its
own, at the point given.

| Improvement                                                                                                                                                                                                                                                                                                                                                                                                                                         | When                                  |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| **Semantic colour tokens with `light-dark()`.** 125 `dark:` classes in the `.vue` files pair a light and a dark value by hand (`bg-white dark:bg-slate-900`). Once `color-scheme` is set, `tokens.css` can define `--surface`, `--ink`, `--muted`, `--rule` and the tile grey once each with `light-dark()`, exposed through `@theme` as `bg-surface`, `text-ink`, …; most `dark:` classes go. The same pass as "One set of text roles" in TODO.md. | Site phase 7                          |
| **Check the data at the door.** `fetchJson` returns `res.json() as T`: a list with a missing field or a wrong type reaches a component and fails there, far from the cause. A small hand-written guard per file shape in `data/files.ts` (no dependency) turns a malformed file into the page's error state with the file and the field named; the data contract test uses the same guards on the committed files.                                  | Site phase 2                          |
| **An error state for the whole app.** A component that throws leaves a blank page. `app.config.errorHandler` (and `onErrorCaptured` in the shell) shows an error state with "Try again", like the one the loaders already have ("Couldn't load the gallery").                                                                                                                                                                                       | Site phase 6                          |
| **Accessibility checked in the browser tier.** `axe-core`, pinned, run by the Playwright checks on every page and the open viewer. It would have caught the focus-ring contrast before a human did.                                                                                                                                                                                                                                                 | Test overhaul phase 7                 |
| **A size budget.** `npm run check` measures the built JavaScript and CSS (gzipped) and the images per collection, and fails over a budget written in `script/check/`; CI prints the change against `main`. No dependency.                                                                                                                                                                                                                           | Phase 3                               |
| **AVIF beside WebP.** `sharp` already makes WebP; AVIF is usually about a third smaller for drawings like these. `npm run ingest` makes both and the tile and viewer use `<picture>`. Measure first on the real drawings; drop it if the gain is small.                                                                                                                                                                                             | With "Responsive, smaller thumbnails" |
| **A link preview per drawing.** Every shared link shows the same duck, because the route is in the hash and a link preview never sees it. The build can write a small page per drawing (`item/<id>.html`) with its own title, image and description, which sends a visitor on to `#<collection>/<item>`. A generator, like the others.                                                                                                              | Phase 3                               |
| **A Content-Security-Policy.** GitHub Pages cannot send headers, but a `<meta http-equiv>` policy can: scripts and styles from the site only, with a hash for the inline theme script in `index.html`. A contract test checks the hash and that the inline script still matches `useTheme`'s rule (today a comment says they mirror each other; nothing checks it).                                                                                 | Phase 3                               |
| **Offline, later.** A small hand-written service worker could keep the lists and the thumbnails already seen, so the gallery opens offline and repeat visits are instant. Only once the images are content-addressed or versioned, so a redrawn drawing is never stale.                                                                                                                                                                             | Not before the images are versioned   |

## Phases

Each phase is one pull request: 100% lines and branches, all checks green, DESIGN.md,
ARCHITECTURE.md or SCRIPTS.md updated in the same PR when a rule changes. The rows marked for an
overhaul's phase are done there, not here; this page only ticks them.

- [x] **1. Fixes.** (2026-10-27) The four fixes above, and "Prefer the platform" in DECISIONS.md.
      _Done when_ dark mode draws native controls dark and the months read in English under any
      language.
- [ ] **2. Node in the scripts.** `util.parseArgs` under `cli.ts` and the runner, `styleText` for
      the reports, `fs.glob` for `listFiles`, `node --run` in CI, and the Vite chunking check. _Done
      when_ the scripts have one argument parser, Node's.
- [ ] **3. Checks and the build.** The size budget, the link preview per drawing and the
      Content-Security-Policy. _Done when_ each runs in CI.
- [ ] **4. Stricter types.** After the site overhaul: `noUncheckedIndexedAccess` and
      `exactOptionalPropertyTypes`, fixing what they find. _Done when_ `npm run typecheck` passes
      with both.

## Not in this plan

- **A state library, a router or a UI kit.** The stores, `defineInjection` and the hash route are
  small and tested; a library would add more than it removes.
- **Server rendering or a static site generator for the gallery.** It is one page over JSON; the
  link previews above get the one thing SSR would.
- **The History API instead of the hash.** GitHub Pages has no fallback to `index.html` for unknown
  paths, so a deep link would 404; the hash stays (DECISIONS.md).
