import type { Item } from './toCollectionItems.ts';

/** Fill a link template's `{{common}}` / `{{sci}}` placeholders for one item. */
export function linkUrl(template: string, item: Item): string {
  return template
    .replace(/{{common}}/g, encodeURIComponent(item.commonName))
    .replace(/{{sci}}/g, encodeURIComponent(item.scientificName));
}
