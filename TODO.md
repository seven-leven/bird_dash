# TODO

## 🚀 High Priority (Fixes & Cleanup)

- [ ] **Fixes**:
  - [ ] Version numbering logic (version.json patch counter has drifted from actual commit count).
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

- [ ] **Ship Script**: Create interface to auto-update `CHANGELOG.md` during deployment.
- [ ] **Docs**: Complete overhaul of `CHANGELOG.md` updates.
- [ ] Proper group names throughout each collection.
- [ ] Group images by collection, matching the storage layout.
- [x] Extract types.
- [ ] Standardize names for all types.
