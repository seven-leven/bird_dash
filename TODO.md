# TODO

## 🐛 Fixes
- [x] **Thumbnail Aspect Ratio**: Fix squeezed images; ensure they maintain ratio.
- [x] **Expanded Image Scaling**: Fix overflow; ensure images fit within the viewport.
- [x] **Build Script Efficiency**: Update script to skip existing images instead of regenerating everything.
- [ ] **Version numbering**: Fix version numbering.
- [ ] **Date sorting**: When sorted by date, make sure it cycles by date, not ID.
- [ ] **Thumbnail sizing issues**: Fix thumbnail sizing issues (ensure consistent display).

## 🏗️ Architecture — Multi-Collection Refactor
- [ ] **`collections.ts`**: Create convention-driven config derived from a single `COLLECTIONS` string array. Each entry auto-derives `dataUrl`, `imageBase`, `fullImageBase`, and `label` by naming convention; supports an `overrides` map for exceptions (e.g. different `groupLabel`).
- [ ] **Folder structure**: Reorganise `public/thumb/` and `public/full/` into per-collection subfolders (`thumb/birds/`, `thumb/sharks/`, etc.).
- [ ] **`Dashboard.vue`**: Extract current `App.vue` logic into a generic `Dashboard.vue` component that accepts a collection config as a prop. `App.vue` becomes a thin shell.
- [ ] **Top nav bar**: Add a persistent nav bar in `App.vue` that renders a tab per collection, driven by the `collections` array — no hardcoding.
- [ ] **Generic `Item` type**: Replace the `Bird` interface with a generic `Item` type. Rename `family` → `group`, `birdId` → `itemId`. Bird-specific fields (`dhiv`, `dhiv_script`) move into a `meta?: Record<string, string>` bag.
- [ ] **`InfoPanel.vue`** *(was `BirdInfoPanel.vue`)*: Make collection-agnostic. Render `meta` fields generically. Accept a `links` prop (array of `{ label, color, url(item) }`) from the collection config instead of hardcoding eBird/BirdLife.
- [ ] **Collection `links` config**: Define per-collection external links in `collections.ts` (e.g. eBird + BirdLife for birds; iNaturalist + FishBase for sharks). Panel renders whatever it receives.
- [ ] **`sharks.json`**: Create initial sharks data file matching the same JSON structure as `birds.json`.

## 🛠️ Workflow & Tooling
- [ ] **Ship script integration**: Create an interface to auto-update `CHANGELOG.md` during the ship process.
- [ ] **Data manager**: Create a file `dataManager.ts` to handle data operations.

## ✨ New Features & Data
- [x] **Dhivehi support**: Add bird names in Dhivehi (Thaana).
- [x] **Filtering**: Add UI to filter birds by category or group.
- [ ] **Conservation status**: Add IUCN / Maldives Red List status.
- [ ] **Seasonality**: Add monsoon-specific data (Iruvai / Hulhangu).
- [x] **External links**: Add buttons/links to Wikipedia and eBird for each species.
- [x] **Illustrator notes**: Add a personal comment or "behind the scenes" note for each drawing.
- [ ] **Search enhancement**: Add search functionality by ID, Dhivehi name, and Dhivehi script.