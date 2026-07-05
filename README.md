# Wildlife Illustrations

[Live Demo](https://seven-leven.github.io/bird_dash/)

A digital collection showcasing illustrations of wild life species.

## Tech Stack

- **Runtime:** [Deno](https://deno.land/)
- **Framework:** Vue 3
- **Build Tool:** Vite
- **Styling:** Tailwind CSS v4

## Local Development

1. **Clone the repo**
   ```bash
   git clone https://github.com/seven-leven/bird_dash.git
   cd bird_dash
   ```

2. **Install dependencies**
   ```bash
   deno install
   ```

3. **Start the dev server**
   ```bash
   deno task dev
   ```
   Open [http://localhost:5173](http://localhost:5173).

## Deployment

The project uses GitHub Actions to build and deploy to GitHub Pages automatically on push to `main`.

**Build command:**

```bash
deno task build
```

## Structure

- `src/components/`: Vue components, grouped by feature — `layout/` (Chrome, TopBar, SideNav),
  `gallery/` (grid, tiles, lightbox), `search/` (global search), `icons/`, `ui/` (shared bits).
- `src/composables/`: App logic; `useAppContext` wires state and actions into the chrome.
- `public/`: Static assets — `collections.json` defines the collections, `lists/*.json` the items.
- `script/`: Deno build pipeline (image transcoding, integrity checks, versioning, changelog).
- `deno.jsonc`: Project configuration and task definitions.
- `vite.config.ts`: Build configuration; injects the derived app version.

## Versioning

Versions follow `x.y.z+w`. Only `x.y` (major/minor) is stored, in `version.json`; the patch (`z` =
commit count) and illustration count (`w`) are computed from the repo at build time, so the version
can never drift and needs no bump commits.

- `deno task version` — print the current version
- `deno task changelog` — insert commits made since `CHANGELOG.md` was last touched under
  _Unreleased_ (use `--dry-run` to preview)

## License

MIT
