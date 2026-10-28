// A link preview per drawing (docs/plans/PLATFORM.md, phase 3c). The gallery's addresses keep
// the drawing after `#`, which a link preview never sees, so every shared link showed the
// same picture. The build writes a small page per drawn item, `<collection>/<id>/`, with its
// own title, description and image, which sends a visitor on to the drawing in the gallery.
// The viewer's Share button hands out its address (src/viewer/shareLink.ts).
import type { Plugin } from 'vite';
import { type Collection, COLLECTIONS } from '../lib/collections.ts';
import { eachDrawnItem, readList } from '../lib/lists.ts';
import { realIo } from '../lib/io.ts';
import { SITE_URL } from '../../src/domain/links.ts';
import type { ListEntry } from '../../src/data/files.ts';

/** Folders the built site already has; a collection with one of these ids would collide. */
export const TAKEN = ['assets', 'docs', 'full', 'thumb', 'lists'];

const escape = (text: string): string =>
  text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

/** "10 October 2024", for a `YYYY-MM-DD` date. */
const longDate = (date: string): string =>
  new Date(date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });

/** The one sentence a preview shows under the title. */
export function previewDescription(collection: Collection, item: ListEntry): string {
  const sci = item.sci ? ` (${item.sci})` : '';
  const dhivehi = item.dhiv ? `, ${item.dhiv} in Dhivehi` : '';
  return `${item.name}${sci}${dhivehi}. Drawn ${
    longDate(item.drawn!)
  }; ${collection.label}, no. ${item.id}.`;
}

/** The preview page for one drawn item: where it lives in dist/, and its HTML. */
export function previewPage(
  collection: Collection,
  item: ListEntry,
  siteUrl = SITE_URL,
): { fileName: string; html: string } {
  const path = `${collection.id}/${item.id}/`;
  const gallery = `../../#${collection.id}/${item.id}`;
  const title = escape(`${item.name} · Wildlife Illustrated`);
  const description = escape(previewDescription(collection, item));
  const image = `${siteUrl}full/${collection.id}/${item.id}.webp`;
  const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <link rel="canonical" href="${siteUrl}${path}" />
    <meta property="og:type" content="article" />
    <meta property="og:site_name" content="Wildlife Illustrated" />
    <meta property="og:title" content="${escape(item.name)}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:url" content="${siteUrl}${path}" />
    <meta property="og:image" content="${image}" />
    <meta property="og:image:alt" content="${escape(`A hand-drawn ${item.name}`)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta http-equiv="refresh" content="0; url=${gallery}" />
  </head>
  <body>
    <p><a href="${gallery}">${escape(item.name)}</a>, in Wildlife Illustrated</p>
  </body>
</html>
`;
  return { fileName: `${path}index.html`, html };
}

/** Every drawn item's preview page, collection by collection, in list order. */
export async function previewPages(
  collections: Collection[] = COLLECTIONS,
  io = realIo,
): Promise<{ fileName: string; html: string }[]> {
  const taken = collections.filter((collection) => TAKEN.includes(collection.id));
  if (taken.length > 0) {
    throw new Error(
      `a collection id is a folder the site already has: ${taken.map((c) => c.id).join(', ')}`,
    );
  }
  const pages = [];
  for (const collection of collections) {
    for (const item of eachDrawnItem(await readList(collection, io))) {
      pages.push(previewPage(collection, item));
    }
  }
  return pages;
}

/** The Vite plugin: write the preview pages into the build. */
export function linkPreviews(): Plugin {
  return {
    name: 'link-previews',
    apply: 'build',
    async generateBundle() {
      for (const page of await previewPages()) {
        this.emitFile({ type: 'asset', fileName: page.fileName, source: page.html });
      }
    },
  };
}
