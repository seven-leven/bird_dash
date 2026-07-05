# TODO

## 🚀 High Priority (Fixes & Cleanup)

- [ ] **Fixes**:
  - [x] Version numbering logic — version is now derived at build time (patch = commit count, count
        = drawn illustrations), so it can no longer drift.
  - [ ] Date sorting (cycle by date, not ID).
  - [x] Thumbnail sizing inconsistencies.
- [ ] **Technical Debt**:
  - [ ] Standardize URL/routing logic for collections and items.

## 🏗️ Architecture & Features

- [x] **Search**: Implement global search (ID, Dhivehi name, Script) with cross-collection results
      and result counters.
- [ ] **Data**:
  - [ ] Add Conservation status (IUCN / Maldives Red List).
  - [ ] Add Seasonality data (Iruvai / Hulhangu).
- [ ] **Media**:
  - [ ] Add support for multiple images per item.

## 🛠️ Workflow & Tooling

- [x] **Ship Script**: `deno task changelog` inserts unlogged commits under _Unreleased_.
- [x] **Docs**: `CHANGELOG.md` scheme documented; entries curated via the changelog task.
- [ ] Proper group names throughout each collection.
- [ ] Group images by collection, matching the storage layout.
- [x] Extract types.
- [ ] Standardize names for all types.
