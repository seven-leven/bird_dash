# TODO

## 🚀 High Priority (Fixes & Cleanup)

- [ ] **Fixes**:
  - [x] Version numbering logic — version is now derived at build time (patch = commit count, count
        = drawn illustrations), so it can no longer drift.
  - [x] Date sorting — the lightbox now pages drawn items chronologically (by drawn date), not by
        id.
  - [x] Thumbnail sizing inconsistencies.
- [ ] **Technical Debt**:
  - [x] URL/routing — hash routing (`#<collection>` / `#<collection>/<item>`) deep-links a
        collection or an item; deep-linking an item scrolls/opens it, and tiles/images are
        shareable.
  - [x] Scroll-spy via `IntersectionObserver` (with a throttled scroll fallback) — no per-event
        layout reads, and `content-visibility` virtualization can now be re-introduced safely.

## 🏗️ Architecture & Features

- [x] **Search**: Global search (ID, common/scientific name, Dhivehi name + Thaana script) with
      cross-collection results, counters, and keyboard navigation.
- [ ] **Data**:
  - [ ] Add Conservation status (IUCN / Maldives Red List).
  - [ ] Add Seasonality data (Iruvai / Hulhangu).
- [ ] **Media**:
  - [ ] Add support for multiple images per item.

## 🛠️ Workflow & Tooling

- [x] **Ship Script**: `deno task changelog` inserts unlogged commits under _Unreleased_.
- [x] **Docs**: `CHANGELOG.md` scheme documented; entries curated via the changelog task.
- [x] **CI**: lint / format / build run on every pull request.
- [x] **Accessibility & SEO**: Lighthouse to 100 (contrast, meta description, favicon).
- [ ] Proper group names throughout each collection. _(data task — needs correct taxonomy per item
      in `public/lists/*.json`)_
- [ ] Group images by collection, matching the storage layout. _(data/tooling task — needs a spec)_
- [x] Extract types.
- [x] Standardize names for all types (PascalCase interfaces per domain in `src/types/`; removed the
      stray `loadingState`).
- [ ] Responsive / higher-compression thumbnails (Lighthouse image-delivery, currently unscored).
