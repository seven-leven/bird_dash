# TODO

## 🚀 High Priority (Fixes & Cleanup)

- [ ] **Fixes**:
  - [ ] Version numbering logic.
  - [ ] Date sorting (cycle by date, not ID).
  - [ ] Thumbnail sizing inconsistencies.
  - [ ] Resolve mismatch between bird IDs and image filenames.
- [ ] **Technical Debt**:
  - [ ] Refactor `scripts/utils.ts` to remove hardcoded collection paths.
  - [ ] Standardize URL/routing logic for collections and items.

## 🏗️ Architecture & Features

- [ ] **Search**: Implement global search (ID, Dhivehi name, Script) with cross-collection results
      and result counters.
- [ ] **Data**:
  - [ ] Add Conservation status (IUCN / Maldives Red List).
  - [ ] Add Seasonality data (Iruvai / Hulhangu).
- [ ] **Media**:
  - [ ] Add support for multiple images per item.

## 🛠️ Workflow & Tooling

- [ ] **Ship Script**: Create interface to auto-update `CHANGELOG.md` during deployment.
- [ ] **Docs**: Complete overhaul of `CHANGELOG.md` updates.
- [ ] proper group name for group though out the collecion
- [ ] group images by like in storage
