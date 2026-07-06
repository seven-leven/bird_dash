# TODO

## 🚀 High Priority (Fixes & Cleanup)

- [ ] **Fixes**:
  - [x] Version numbering logic — version is now derived at build time (patch = commit count, count
        = drawn illustrations), so it can no longer drift.
  - [ ] Date sorting (cycle by date, not ID).
  - [x] Thumbnail sizing inconsistencies.
- [ ] **Technical Debt**:
  - [ ] Standardize URL/routing logic for collections and items.
  - [ ] Scroll-spy via `IntersectionObserver` — required before re-introducing `content-visibility`
        virtualization for large collections (offset-based tracking is incompatible with it).

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
- [ ] Proper group names throughout each collection.
- [ ] Group images by collection, matching the storage layout.
- [x] Extract types.
- [ ] Standardize names for all types.
- [ ] Responsive / higher-compression thumbnails (Lighthouse image-delivery, currently unscored).
