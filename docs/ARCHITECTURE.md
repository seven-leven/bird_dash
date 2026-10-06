# Architecture

How the project is put together, and the rules that keep it that way. For how it looks, see
[DESIGN.md](DESIGN.md); for the data files, [DATA.md](DATA.md); for the tests,
[TESTING.md](TESTING.md).

## Three programs, one contract

The repository holds three small programs. They meet only at the files in `public/`.

```
raw_png/ (not in git)              script/version/version.json + git history
      │                                        │
      ▼                                        ▼
┌─ 1. Asset pipeline (script/) ───────────────────────────────┐
│ build.ts → scan (read disk) → plan (pure set maths)         │
│          → execute (sharp, write JSON) → report             │
│ version/ · changelog.ts · placeholders/ · docs/             │
└───────────────┬─────────────────────────────────────────────┘
                ▼
   public/   collections.json · lists/<id>.json
             full/ · thumb/ · placeholders/
                │   the contract: fetched at runtime, never imported by src/
                ▼
┌─ 2. The site (src/) ────────────────────────────────────────┐
│ types ← lib ← composables ← stores ← components ← App.vue   │
└─────────────────────────────────────────────────────────────┘

┌─ 3. Test harness and CI (script/test*, .github/) ───────────┐
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

## The site, layer by layer

Imports only point leftwards in this list; nothing imports from a layer to its right.

| Layer            | Folder             | What lives there                                                                                                                           |
| ---------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Types            | `src/types/`       | Shapes only. `data.ts` is the raw files; `collections.ts` the app's own                                                                    |
| Pure helpers     | `src/lib/`         | Functions with no Vue and no DOM state: normalising items, wording counts, collapsing search groups                                        |
| Composables      | `src/composables/` | Reusable logic that uses Vue reactivity or the browser: loading and caching, filtering and grouping, the lightbox, scroll-spy, URL routing |
| Stores           | `src/stores/`      | The app's state, one per domain, each exposing read-only state and actions                                                                 |
| Components       | `src/components/`  | Templates. They read stores and call actions; they hold no shared state                                                                    |
| Composition root | `src/App.vue`      | Creates the stores, provides them, starts the router                                                                                       |

### Stores

There are four, created in dependency order and shared with `provide`/`inject` (through
`defineInjection`, which throws if a store is used outside its provider):

```
search ──(debounced query)──┐
                            ├──► collections ──(drawn items)──► overlay
ui ─────(view mode)─────────┘
```

| Store         | Owns                                                                                |
| ------------- | ----------------------------------------------------------------------------------- |
| `search`      | The query and whether the dropdown is open                                          |
| `ui`          | Sidebar, theme, view mode (group or date), scroll-spy                               |
| `collections` | The collection list, the active one, loaded items, and every view derived from them |
| `overlay`     | Which item is open in the lightbox                                                  |

Actions that touch more than one store live in [`src/stores/actions.ts`](../src/stores/actions.ts)
(`switchCollection`, `selectGlobalResult`).

### Data flow

State moves one way:

1. `collections.json` loads; the first collection's list loads; the others are fetched in the
   background and cached.
2. Raw items are normalised once (`lib/collectionItems.ts`) and frozen: the drawn flag, sort key,
   timestamp and search text are precomputed.
3. The query and view mode feed computed values that produce the grid sections, sidebar entries,
   counts and the lightbox order. Nothing is stored that can be derived.
4. Components render those values and call actions in response to input.

### The URL

[`useHashRoute`](../src/composables/core/useHashRoute.ts) is the only code that reads or writes the
address. The grammar is `#<collection>` or `#<collection>/<item>`. State changes are mirrored to the
hash, and a hash change (a deep link, the back button) is applied to the stores.

## The asset pipeline

`deno task build:assets` runs four steps per collection:

| Step        | File                         | Does                                                           |
| ----------- | ---------------------------- | -------------------------------------------------------------- |
| **Scan**    | `script/pipeline/scan.ts`    | Reads the list file and the three image folders, once          |
| **Plan**    | `script/pipeline/plan.ts`    | Pure set arithmetic: what to register, transcode, or flag      |
| **Execute** | `script/pipeline/execute.ts` | Dates new items in the JSON, writes `full/` and `thumb/` WebPs |
| **Report**  | `script/pipeline/report.ts`  | Prints the summary                                             |

Keeping the plan pure is what makes it testable without touching the disk. `deno task check` runs
scan and plan only, and fails if anything is missing or orphaned.

Other scripts: `version/compute.ts` (the version, see the README), `changelog.ts`,
`placeholders/generate.ts` and `docs/design_guide.ts` (generated images).

## Rules

- **Imports follow the layers.** A helper in `lib/` never imports a store; a component never imports
  a data composable directly.
- **`src/` never imports from `public/`.** It fetches. `script/` may import `collections.json`.
- **Components change state only through store actions.**
- **Anything that can be computed is not stored.** The version, the counts and the grouped views are
  all derived.
- **One owner per concern:** one URL owner, one icon registry, one place that words counts, one
  place that types the data files.
- **Pure first.** Put logic in `lib/` as a plain function when you can; it is the cheapest thing to
  test. Reach for a composable only when you need reactivity or the browser.
- **The data decides.** Adding a collection or an item is a JSON and image change, not a code
  change.

## Known gaps

- `.vue` files are not type-checked or covered by automated tests (Deno cannot import them), so
  component behaviour is verified by hand. A real-browser test tier would close this.
- `vite.config.ts` imports `script/version/compute.ts`. It is the one place the site's build depends
  on the pipeline's code, kept so the version formula exists once.
