# Wildlife Illustrated

A digital gallery of hand-drawn wildlife illustrations, organized into collections (birds, sharks,
shells) with cross-collection search, taxonomic and timeline views, Dhivehi names, and a full-screen
lightbox.

**[View the live site →](https://seven-leven.github.io/bird_dash/)**

## Features

- **Multiple collections** — birds, sharks, and shells, each with its own taxonomy, emoji, and
  reference links. Adding a new one is JSON + images, no code.
- **Two views** — browse by taxonomic group (Family, Order, …) or as a chronological timeline of
  when each piece was drawn.
- **Global search** — search every collection at once by common name, scientific name, or ID, with
  keyboard navigation (`↑`/`↓`/`↵`) and `Ctrl`/`⌘ K` to focus.
- **Progress tracking** — undrawn species show a placeholder silhouette; the sidebar and each group
  header report how many are drawn versus total.
- **Lightbox** — full-resolution view with zoom, pan, prev/next navigation, and an info panel
  showing scientific/Dhivehi names, the illustrator's note, and reference links.
- **Dark mode**, responsive layout, and Dhivehi (Thaana) script support.

## Tech Stack

- **Runtime & tooling:** [Deno](https://deno.land/)
- **Framework:** Vue 3 (`<script setup>`, composables, provide/inject)
- **Build tool:** Vite
- **Styling:** Tailwind CSS v4 (single accent design token, class-based dark mode)
- **Images:** [sharp](https://sharp.pixelplumbing.com/) (PNG → WebP transcoding)

## Quick Start

```bash
# 1. Clone
git clone https://github.com/seven-leven/bird_dash.git
cd bird_dash

# 2. Install dependencies (sharp needs its native binary, hence --allow-scripts)
deno install --allow-scripts

# 3. Run the dev server
deno task dev
```

Open [http://localhost:5173](http://localhost:5173).

## Project Structure

```
public/                 Static assets, served as-is
  collections.json      Collection definitions (id, label, emoji, links, …)
  lists/<id>.json       Item data per collection, grouped by taxonomy
  full/<id>/            Full-resolution WebP illustrations
  thumb/<id>/           Grid thumbnails (generated)
  placeholders/<id>.webp  Silhouette shown for undrawn items
src/
  components/
    layout/             Chrome, TopBar, SideNav — the app shell
    gallery/            Grid, tiles, lightbox, info sheet
    search/             Global search dropdown and sub-components
    icons/              Icon.vue + the icon registry (icons.ts)
    ui/                 Reusable primitives (IdBadge, EmptyState)
  stores/               Domain state — search, ui, collections, overlay — each with readonly
                        state + actions, shared through provide/inject (defineInjection)
  composables/          Reusable logic (data pipeline, scroll-spy, lightbox, URL routing)
  lib/                  Small framework-free helpers
  types/                Shared TypeScript types
script/                 Deno build pipeline (transcode, integrity, version, changelog)
test/                   Shared test helpers (fixtures, fake-DOM setup, property-test depth)
                        — the tests themselves sit next to the code they cover (see Testing)
version.json            Stored major/minor only — patch and count are derived
```

State flows one way: `App.vue` creates the stores in dependency order (search and ui → collections →
overlay) and provides them; components read state from the stores and change it only through their
actions. `useHashRoute` is the single owner of URL ⇄ state sync (`#<collection>` /
`#<collection>/<item>`).

## Data Model

The app is data-driven — content lives entirely in `public/`, no code changes needed.

**`public/collections.json`** — one entry per collection:

```json
{
  "id": "birds",
  "label": "Birds",
  "emoji": "🐦",
  "groupLabel": "Family",
  "itemLabel": "bird",
  "links": [
    {
      "label": "eBird",
      "color": "bg-emerald-600 hover:bg-emerald-500",
      "url": "https://www.google.com/search?q={{common}}+ebird"
    }
  ]
}
```

Link URLs support `{{common}}` (common name) and `{{sci}}` (scientific name) placeholders.

**`public/lists/<id>.json`** — items grouped by taxonomy. An item is considered _drawn_ once it has
a `drawn` date; without one it renders as the placeholder silhouette. `dhiv` and `dhiv_script` are
rendered specially; any other string fields appear in the info panel.

```json
{
  "Ducks, Geese, and Swans": [
    {
      "id": "001",
      "name": "Lesser Whistling-Duck",
      "sci": "Dendrocygna javanica",
      "dhiv": "Reyru",
      "dhiv_script": "ރޭރު",
      "drawn": "2024-10-10",
      "illustratorNote": "The first drawing—a benchmark for future work."
    }
  ]
}
```

### Adding an illustration

1. Drop the source PNG in `raw_png/<collection>/<id>.png` (e.g. `raw_png/birds/005.png`).
2. Add or update the item's entry in `public/lists/<collection>.json`, giving it a `drawn` date.
3. Run `deno task build:assets` to transcode the PNG into `full/` and `thumb/` WebPs.

### Adding a collection

1. Add an entry to `public/collections.json`.
2. Create `public/lists/<id>.json` and a `public/placeholders/<id>.webp` silhouette.
3. Add source art under `raw_png/<id>/` and run `deno task build:assets`.

## Tasks

| Task                                              | Description                                                          |
| ------------------------------------------------- | -------------------------------------------------------------------- |
| `deno task dev`                                   | Start the Vite dev server                                            |
| `deno task build`                                 | Full build: transcode assets, then bundle the frontend               |
| `deno task build:assets`                          | Transcode images and register new items only                         |
| `deno task build:vite`                            | Bundle the frontend only (assumes assets are built)                  |
| `deno task check`                                 | Integrity check (missing/orphaned images); exits 1 on problems       |
| `deno task test`                                  | Every test tier, one summary row per tier (`test unit dom` for some) |
| `deno task test:unit` (`dom`, `prop`, `contract`) | Just that tier                                                       |
| `deno task test:watch`                            | Re-run the tests on every save                                       |
| `deno task test:coverage`                         | Every tier + coverage table; fails below the line-coverage floor     |
| `deno task typecheck`                             | Type-check the `.ts` sources (`.vue` templates are not covered)      |
| `deno task version`                               | Print the current derived version                                    |
| `deno task changelog`                             | Insert unlogged commits under _Unreleased_ (`--dry-run` to preview)  |
| `deno task preview`                               | Preview the production build locally                                 |
| `deno task lint` / `format`                       | Lint and format                                                      |

## Testing

Tests sit next to the code they cover, and the **file name decides the tier**
([`script/test/tiers.ts`](script/test/tiers.ts) is the one place that maps names to tiers):

| Tier       | File name            | Use it for                                                                            |
| ---------- | -------------------- | ------------------------------------------------------------------------------------- |
| `unit`     | `x_test.ts`          | pure logic — start here                                                               |
| `dom`      | `x_dom_test.ts`      | code that needs `document`, `location`, focus or storage (fake DOM via `test/dom.ts`) |
| `prop`     | `x_prop_test.ts`     | an invariant that should hold for _any_ input (fast-check)                            |
| `contract` | `x_contract_test.ts` | checks the real files in the repo (`public/*.json`, layout)                           |

`deno task test` prints one row per tier instead of a line per test. When something fails it lists
the failing tests first (file, line, message) and then Deno's full output — the diff, or the type
error that stopped the run. `-v` adds a per-file list. In CI the same run writes a summary table to
the job page, annotates failures on the changed files, and keeps the JUnit file.

- **Property depth.** `FC_RUNS_MULTIPLIER=10 deno task test:prop` runs ten times as many generated
  inputs; a weekly scheduled workflow ([`nightly.yml`](.github/workflows/nightly.yml)) runs them at
  25×. A failing property prints its seed — pass `{ seed, path }` to reproduce it.
- **A test in the wrong place fails the suite.** The runner only looks in `src/` and `script/`, and
  a contract test checks that no `*_test.ts` file lives anywhere it would be skipped.
- Coverage covers `.ts` only (Deno cannot import `.vue` files), so component behaviour needs browser
  tests, which are not set up yet.

## Versioning

The footer of the site reads `v0.8.157 · 18 drawings · 4f0f400`. Nothing here is stored except
`major.minor`; the rest is worked out from the repo when the site is built, so it cannot drift.

| Part          | Where it comes from                                                                 |
| ------------- | ----------------------------------------------------------------------------------- |
| `0.8`         | `version.json` — edit by hand when a new line of work starts (e.g. `0.8` → `0.9`)   |
| `.157` patch  | number of commits in the history (`git rev-list --count HEAD`) — see the note below |
| `18 drawings` | illustrations with a `drawn` date across `public/lists/*.json`                      |
| `4f0f400`     | the commit the build was made from                                                  |

- **The patch is a build counter, not a count of fixes.** On `main` it includes merge commits, so it
  rises by a few with every merged PR, and a local branch shows a different number from the deployed
  site (which is why the commit is shown too).
- **One implementation.** [`script/version/compute.ts`](script/version/compute.ts) computes all of
  it. `deno task version` prints it (`--long` for the whole line), the build and check summaries
  print it, and `vite.config.ts` calls the same function to inject it into the footer.
- **Without git** (e.g. a zip download) a local build warns and shows patch `0` / commit `unknown`;
  `deno task version` and any build with `CI` set fail instead of inventing a number.

There are no git hooks, tags or releases: CI and the deploy are the only gates. Changelog entries
are curated with `deno task changelog`, which lists every commit made since `CHANGELOG.md` was last
touched and inserts them under an _Unreleased_ heading to edit and commit.

## Deployment

Pull requests and deploys run the same checks, defined once in
[`verify.yml`](.github/workflows/verify.yml): lint, format, type-check, every test tier with a
coverage floor (in a timezone west of UTC, so accidental local-time date logic fails), the asset
integrity check, and the production build. The tests also run in three more timezones (UTC, India,
and UTC+14) in parallel. [`ci.yml`](.github/workflows/ci.yml) runs it on every pull request;
[`deploy.yml`](.github/workflows/deploy.yml) runs it on every push to `main` and publishes the built
site to GitHub Pages only if everything passed. The workflows check out full git history
(`fetch-depth: 0`) so the derived version is accurate.

## License

[MIT](LICENSE)
