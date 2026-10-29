# Data reference

Everything the site shows comes from the files in `public/`. Adding a drawing or a whole collection
is a change to these files, not to the code. Their shape is typed in
[`src/data/files.ts`](../src/data/files.ts) and checked by the contract tests
([`script/lib/collections_contract_test.ts`](../script/lib/collections_contract_test.ts)), which run
on every pull request.

```
public/
  collections.json            the list of collections
  lists/<id>.json             the items of one collection, grouped
  stats.json                  the archive's numbers, worked out from the lists (generated)
  full/<id>/<item>.webp       full-size drawing; <item>-2.webp and on for its other images (generated)
  thumb/<id>/<item>.webp      grid thumbnail, 400px (generated)
  small/<id>/<item>.webp      the same at 240px, for a screen that needs no more (generated)
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
    { "label": "eBird", "url": "https://www.google.com/search?q={{common}}+ebird" }
  ]
}
```

| Field        | Required | Meaning                                                                                         |
| ------------ | -------- | ----------------------------------------------------------------------------------------------- |
| `id`         | yes      | Used in the URL (`#birds`), file names and folder names. Lowercase, no spaces, unique           |
| `medium`     | no       | What every piece in the collection is drawn in ("colour pencil"); the viewer names it           |
| `label`      | yes      | The name on the tab                                                                             |
| `emoji`      | yes      | Shown in terminal reports, and on the tab if there is no `icon`                                 |
| `icon`       | no       | Name of an icon in `src/ui/icons.ts`. Also what an undrawn tile shows                           |
| `accent`     | no       | The collection's accent colour: a hue from the menu in `src/styles/accents.css`. Default `teal` |
| `groupLabel` | yes      | What a group is called ("Family", "Order"); labels the group view and the sidebar               |
| `itemLabel`  | yes      | The singular noun for an item ("bird")                                                          |
| `links`      | yes      | "Learn more" links in the viewer; may be an empty array                                         |

**Every collection is the same kind of thing.** A list of birds and a series of studies in one
medium (a 30-day challenge, grouped by week or difficulty) take the same fields: an item's `name` is
its common name or its prompt, and `sci`, `dhiv` and `dhiv_script` are there where it has them. A
series names its `medium`; a link that fills in `{{sci}}` suits only a list whose items have one.

In a link, `url` must start with `http://` or `https://` and may contain `{{common}}` (the common
name) and `{{sci}}` (the scientific name); both are URL-encoded when filled in. No other placeholder
is allowed.

## `lists/<id>.json`

An object whose keys are group names and whose values are arrays of items. Groups appear in the
order written; within a group, drawn items come first, then by id.

A group is a real rank, the one its collection's `groupLabel` names, under its English name: the
birds by family as eBird names them ("Sandpipers and Allies"), the sharks by order ("Ground Sharks",
Carcharhiniformes), the shells by class ("Gastropods").

```json
{
  "Ducks, Geese, and Waterfowl": [
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
| `images`          | no       | How many images the item has, 1 when absent: the drawing, then its sketches or a series piece's other parts       |
| `dhiv`            | no       | Dhivehi name, romanised                                                                                           |
| `dhiv_script`     | no       | Dhivehi name in Thaana script; becomes the title on the tile and in the viewer                                    |
| anything else     | no       | Any other **string** field is shown in the viewer under its name and is searchable. Non-string values are ignored |

Notes:

- **`drawn` is what makes an item real.** The site looks for `thumb/<id>/<item>.webp` and
  `full/<id>/<item>.webp` only when it is set.
- **More than one image.** With `"images": 3` the viewer pages through `<item>.webp`, then
  `<item>-2.webp` and `<item>-3.webp` in `full/<id>/`, before the next drawing. The tile shows the
  first. `npm run ingest` makes each from `raw_png/<id>/<item>-2.png` and so on; `check` fails if
  one the list counts is missing, and warns of source art for one it does not count.
- **Dates are read as UTC,** so a drawing dated the 1st stays in that month for every visitor.
- **A group with no items is allowed** and simply does not appear.
- **Search covers** the common name, scientific name, group name, id and every extra string field,
  including both Dhivehi forms.

## Generated files

Do not edit these by hand; run the task that makes them.

| Files                                  | Made by          | From                                 |
| -------------------------------------- | ---------------- | ------------------------------------ |
| `full/`, `thumb/`, `small/<id>/*.webp` | `npm run ingest` | `raw_png/<id>/*.png`                 |
| `drawn` dates on newly added items     | `npm run ingest` | a new PNG whose item has no date yet |
| `stats.json`                           | `npm run ingest` | every `lists/<id>.json`              |

### `stats.json`

The numbers a page such as the About page shows, so none of them is typed by hand: for each
collection its `total` species, how many are `drawn`, its number of `groups`, how many are `named`
in Dhivehi (have a `dhiv_script`), and the dates of its `firstDrawn` and `lastDrawn` drawing (`null`
while nothing is drawn); the `drawn` and `total` across every collection; the archive's `first`
drawing (`null` if none); and the `newest` eight drawings across all of them, newest first (on the
same day, in collection order, then by id). Each drawing has its collection, id, name, date, and,
when the list gives them, its Dhivehi name in Thaana (`dhivehi`) and how to say it (`roman`). The
shape is `Stats` in [`src/data/files.ts`](../src/data/files.ts), which the build and the page share.
[`script/generate/stats.ts`](../script/generate/stats.ts) writes it as the last step of the asset
build. It holds no build time, so the same lists always write the same file. A new collection
appears in it with no other change.

## What the checks enforce

The site checks every file's shape as it loads it (`check…` in
[`src/data/files.ts`](../src/data/files.ts)): a field missing or of the wrong kind shows the page's
error, naming the file and the field ("Birds is not as expected: Ducks[1].name is missing"), and the
contract tests run the same checks on the committed files.

`npm test` (contract tier) fails if:

- `collections.json` is empty or has a duplicate `id`;
- an `icon` is not in the icon registry, or an `accent` is not on the menu in `accents.css`;
- a link has no label, is not `http(s)`, or uses an unknown `{{placeholder}}`;
- a `medium` is empty;
- a collection has no list file;
- an item's `id` is not digits or is repeated, its `name` is empty, its `drawn` is not a real
  `YYYY-MM-DD` date, or its `images` is not a whole number of 1 or more; or a group name is blank.

`npm run check` fails if:

- an item is marked drawn but its full image, or its thumbnail in either size, is missing;
- an image exists for an item that is not marked drawn (an orphan);
- a source PNG exists for an item that has no `drawn` date yet (run `npm run ingest`);
- `stats.json` does not match the lists, as after a hand edit to a list (run `npm run ingest`);
- the favicon or a logo file is not what `npm run generate` would draw now (run it).

## Recipes

**Add a drawing**

1. Save the PNG as `raw_png/<collection>/<id>.png`.
2. Make sure the item exists in `public/lists/<collection>.json`. You can leave `drawn` out; the
   build dates it today.
3. Run `npm run ingest` (`-- --dry-run` first shows what it will do), then `npm run check`.

**Add sketches to a drawing** (or the other parts of a series piece): put them in `raw_png/<id>/` as
`<item>-2.png`, `<item>-3.png`, set `"images"` on the item to the count, drawing included, and run
`npm run ingest`.

**Add an item that is not drawn yet:** add it to the list file with `id` and `name` and no `drawn`.

**Add a collection**

1. Add an entry to `collections.json`. Pick an `icon` (add one to `icons.ts` if needed) and an
   `accent` from the menu in [DESIGN.md](DESIGN.md).
2. Create `public/lists/<id>.json`. Until something is drawn, each tile shows the collection's icon
   (or its emoji).
3. Add source art under `raw_png/<id>/` and run `npm run ingest`.

**Add a new kind of information** (a habitat, where it was seen): add a string field to the items.
It appears in the viewer and in search with no code change. Give it its own treatment later by
adding it to `ListEntry` in `src/data/files.ts` and handling it in
`src/domain/toCollectionItems.ts`.
