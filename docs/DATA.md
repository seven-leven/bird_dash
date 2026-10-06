# Data reference

Everything the site shows comes from the files in `public/`. Adding a drawing or a whole collection
is a change to these files, not to the code. Their shape is typed in
[`src/types/data.ts`](../src/types/data.ts) and checked by the contract tests
([`script/collection/data_contract_test.ts`](../script/collection/data_contract_test.ts)), which run
on every pull request.

```
public/
  collections.json            the list of collections
  lists/<id>.json             the items of one collection, grouped
  full/<id>/<item>.webp       full-size drawing (generated)
  thumb/<id>/<item>.webp      grid thumbnail (generated)
  placeholders/<id>.webp      shown for undrawn items, light theme (generated)
  placeholders/<id>-dark.webp the same for the dark theme (generated)
raw_png/<id>/<item>.png       your source art; not in git
```

## `collections.json`

An array, in the order the tabs appear. The first entry is the collection shown on load.

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
    { "label": "eBird", "color": "…", "url": "https://www.google.com/search?q={{common}}+ebird" }
  ]
}
```

| Field        | Required | Meaning                                                                                      |
| ------------ | -------- | -------------------------------------------------------------------------------------------- |
| `id`         | yes      | Used in the URL (`#birds`), file names and folder names. Lowercase, no spaces, unique        |
| `label`      | yes      | The name on the tab                                                                          |
| `emoji`      | yes      | Shown in terminal reports, and on the tab if there is no `icon`                              |
| `icon`       | no       | Name of an icon in `src/components/icons/icons.ts`. Also what the placeholder is drawn from  |
| `accent`     | no       | The collection's accent colour: a hue from the menu in `src/assets/main.css`. Default `teal` |
| `groupLabel` | yes      | What a group is called ("Family", "Order"); labels the group view and the sidebar            |
| `itemLabel`  | yes      | The singular noun for an item ("bird")                                                       |
| `links`      | yes      | "Learn more" links in the viewer; may be an empty array                                      |

In a link, `url` must start with `http://` or `https://` and may contain `{{common}}` (the common
name) and `{{sci}}` (the scientific name); both are URL-encoded when filled in. No other placeholder
is allowed.

## `lists/<id>.json`

An object whose keys are group names and whose values are arrays of items. Groups appear in the
order written; within a group, drawn items come first, then by id.

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

| Field             | Required | Meaning                                                                                                           |
| ----------------- | -------- | ----------------------------------------------------------------------------------------------------------------- |
| `id`              | yes      | Digits only, unique within the collection. Used in the URL, image file names and sorting                          |
| `name`            | yes      | Common (English) name                                                                                             |
| `sci`             | no       | Scientific name, shown in italics                                                                                 |
| `drawn`           | no       | `YYYY-MM-DD`. Present means drawn; absent or `""` means a placeholder is shown                                    |
| `illustratorNote` | no       | A note shown in the viewer                                                                                        |
| `dhiv`            | no       | Dhivehi name, romanised                                                                                           |
| `dhiv_script`     | no       | Dhivehi name in Thaana script; becomes the title on the tile and in the viewer                                    |
| anything else     | no       | Any other **string** field is shown in the viewer under its name and is searchable. Non-string values are ignored |

Notes:

- **`drawn` is what makes an item real.** The site looks for `thumb/<id>/<item>.webp` and
  `full/<id>/<item>.webp` only when it is set.
- **Dates are read as UTC,** so a drawing dated the 1st stays in that month for every visitor.
- **A group with no items is allowed** and simply does not appear.
- **Search covers** the common name, scientific name, group name, id and every extra string field,
  including both Dhivehi forms.

## Generated files

Do not edit these by hand; run the task that makes them.

| Files                                   | Made by                  | From                                 |
| --------------------------------------- | ------------------------ | ------------------------------------ |
| `full/<id>/*.webp`, `thumb/<id>/*.webp` | `deno task build:assets` | `raw_png/<id>/*.png`                 |
| `placeholders/<id>[-dark].webp`         | `deno task placeholders` | the collection's `icon`              |
| `drawn` dates on newly added items      | `deno task build:assets` | a new PNG whose item has no date yet |

## What the checks enforce

`deno task test` (contract tier) fails if:

- `collections.json` is empty or has a duplicate `id`;
- an `icon` is not in the icon registry, or an `accent` is not on the menu in `main.css`;
- a link has no label, is not `http(s)`, or uses an unknown `{{placeholder}}`;
- a collection has no list file, or is missing either placeholder image;
- an item's `id` is not digits or is repeated, its `name` is empty, or its `drawn` is not a real
  `YYYY-MM-DD` date; or a group name is blank.

`deno task check` fails if:

- an item is marked drawn but its full or thumbnail image is missing;
- an image exists for an item that is not marked drawn (an orphan);
- a source PNG exists for an item that has no `drawn` date yet (run `build:assets`).

## Recipes

**Add a drawing**

1. Save the PNG as `raw_png/<collection>/<id>.png`.
2. Make sure the item exists in `public/lists/<collection>.json`. You can leave `drawn` out; the
   build dates it today.
3. Run `deno task build:assets`, then `deno task check`.

**Add an item that is not drawn yet:** add it to the list file with `id` and `name` and no `drawn`.

**Add a collection**

1. Add an entry to `collections.json`. Pick an `icon` (add one to `icons.ts` if needed) and an
   `accent` from the menu in [DESIGN.md](DESIGN.md).
2. Create `public/lists/<id>.json`.
3. Run `deno task placeholders` to draw its two placeholder images.
4. Add source art under `raw_png/<id>/` and run `deno task build:assets`.

**Add a new kind of information** (conservation status, season): add a string field to the items. It
appears in the viewer and in search with no code change. Give it its own treatment later by adding
it to `RawItem` in `src/types/data.ts` and handling it in `src/lib/collectionItems.ts`.
