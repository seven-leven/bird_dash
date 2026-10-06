# Wildlife Illustrated

A digital gallery of hand-drawn wildlife illustrations, organized into collections (birds, sharks,
shells) with cross-collection search, taxonomic and timeline views, Dhivehi names, and a full-screen
lightbox.

**[View the live site →](https://seven-leven.github.io/bird_dash/)**

## Features

- **Multiple collections** — birds, sharks, and shells, each with its own taxonomy, icon, and
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
  placeholders/<id>.webp  Shown for undrawn items (<id>-dark.webp in the dark theme)
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
  version/version.json  Stored major/minor only — patch and count are derived
  test/                 The test runner; test/helpers/ holds shared fixtures, the fake-DOM
                        setup and property-test depth. The tests themselves sit next to
                        the code they cover (see Testing)
docs/                   Design guide, icon sheet, TODO
```

State flows one way: `App.vue` creates the stores in dependency order (search and ui → collections →
overlay) and provides them; components read state from the stores and change it only through their
actions. `useHashRoute` is the single owner of URL ⇄ state sync (`#<collection>` /
`#<collection>/<item>`).

## Data Model

The app is data-driven — content lives entirely in `public/`, no code changes needed. The quick
version is below; [`docs/DATA.md`](docs/DATA.md) is the full reference. The shape of these files is
typed once, in [`src/types/data.ts`](src/types/data.ts), and shared by the build scripts, the app's
loader and the data contract test.

**`public/collections.json`** — one entry per collection:

```json
{
  "id": "birds",
  "label": "Birds",
  "emoji": "🐦",
  "icon": "bird",
  "accent": "teal",
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

`icon` names a line icon in [`src/components/icons/icons.ts`](src/components/icons/icons.ts), where
every SVG in the app lives; without one the emoji is shown instead. `accent` picks the collection's
accent colour from the palettes in [`src/assets/main.css`](src/assets/main.css) (twelve to choose
from, listed in [`docs/DESIGN.md`](docs/DESIGN.md); default teal). Link URLs support `{{common}}`
(common name) and `{{sci}}` (scientific name) placeholders.

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
2. Create `public/lists/<id>.json`. Add an icon for it to `icons.ts`, name it in the entry, and run
   `deno task placeholders` to draw its light and dark placeholders (`public/placeholders/<id>.webp`
   and `<id>-dark.webp`) from it.
3. Add source art under `raw_png/<id>/` and run `deno task build:assets`.

## Documentation

| Guide                                          | What it covers                                                    |
| ---------------------------------------------- | ----------------------------------------------------------------- |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | The three programs, the layers of the site, the stores, the rules |
| [`docs/DATA.md`](docs/DATA.md)                 | Every field in `collections.json` and the list files; recipes     |
| [`docs/TESTING.md`](docs/TESTING.md)           | Tiers, writing tests, coverage, CI                                |
| [`docs/DESIGN.md`](docs/DESIGN.md)             | Colours, type, spacing, states, icons; a checklist for UI changes |

[`docs/design-guide.png`](docs/design-guide.png), [`docs/icons.png`](docs/icons.png) and
[`docs/logo.png`](docs/logo.png) are drawn from the real tokens, icons and logo by
`deno task design`, which also writes the logo files in `docs/logo/`.

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
| `deno task changelog`                             | Insert unlogged commits in the newest section (`--dry-run` previews) |
| `deno task placeholders`                          | Redraw the placeholder images from each collection's icon            |
| `deno task design`                                | Redraw the design guide image and the icon sheet                     |
| `deno task preview`                               | Preview the production build locally                                 |
| `deno task lint` / `format`                       | Lint and format                                                      |

## Testing

Tests sit next to the code they cover, and the file name decides the tier: `x_test.ts` (unit),
`x_dom_test.ts` (fake browser), `x_prop_test.ts` (property-based) and `x_contract_test.ts` (the real
files in this repo). `deno task test` runs them all and prints one row per tier;
`deno task test:coverage` adds a coverage table and fails below the floor.

[`docs/TESTING.md`](docs/TESTING.md) has the full guide: choosing a tier, writing a test, property
tests, coverage, and what CI runs.

## Versioning

The footer of the site reads something like `v0.9.161 · 18 drawings · 4f0f400`. Nothing here is
stored except `major.minor`; the rest is worked out from the repo when the site is built, so it
cannot drift.

| Part          | Where it comes from                                                                               |
| ------------- | ------------------------------------------------------------------------------------------------- |
| `0.9`         | `script/version/version.json` — edit by hand when a new line of work starts (e.g. `0.9` → `0.10`) |
| `.157` patch  | number of commits in the history (`git rev-list --count HEAD`) — see the note below               |
| `18 drawings` | illustrations with a `drawn` date across `public/lists/*.json`                                    |
| `4f0f400`     | the commit the build was made from                                                                |

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
touched and inserts them at the top of the newest section to edit and commit. Every merge to `main`
deploys, so there is no "unreleased" section.

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
