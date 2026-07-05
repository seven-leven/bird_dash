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
    icons/              Shared SVG icon components
    ui/                 Reusable primitives (IdBadge, EmptyState)
  composables/          App logic; useAppContext wires state into the chrome
  types/                Shared TypeScript types
script/                 Deno build pipeline (transcode, integrity, version, changelog)
version.json            Stored major/minor only — patch and count are derived
```

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

| Task                        | Description                                                         |
| --------------------------- | ------------------------------------------------------------------- |
| `deno task dev`             | Start the Vite dev server                                           |
| `deno task build`           | Full build: transcode assets, then bundle the frontend              |
| `deno task build:assets`    | Transcode images and register new items only                        |
| `deno task build:vite`      | Bundle the frontend only (assumes assets are built)                 |
| `deno task check`           | Read-only integrity report (missing/orphaned images)                |
| `deno task version`         | Print the current derived version                                   |
| `deno task changelog`       | Insert unlogged commits under _Unreleased_ (`--dry-run` to preview) |
| `deno task preview`         | Preview the production build locally                                |
| `deno task lint` / `format` | Lint and format                                                     |

## Versioning

Versions follow `x.y.z+w`:

- **`x.y`** — major/minor, the only part stored (in `version.json`); bump by hand for releases.
- **`z`** — patch, the commit count.
- **`w`** — total drawn illustrations across all collections.

`z` and `w` are **derived at build time** (from git history and `public/lists/*.json`) and injected
into the bundle by `vite.config.ts`, so the displayed version always reflects reality and can never
drift. Print it any time with `deno task version`.

Changelog entries are curated with `deno task changelog`, which lists every commit made since
`CHANGELOG.md` was last touched and inserts them under an _Unreleased_ heading to edit and commit.

## Deployment

GitHub Actions builds and deploys to GitHub Pages on every push to `main`
([`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)). Pull requests run lint, format,
and build checks via [`ci.yml`](.github/workflows/ci.yml). Both check out full git history
(`fetch-depth: 0`) so the derived version is accurate.

## License

[MIT](LICENSE)
