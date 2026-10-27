// Sharing a drawing. The address handed out is the drawing's link preview, a small page the
// build writes for it (script/build/linkPreviews.ts) with its own title and image, which sends
// a visitor on to the drawing in the gallery. The gallery's own address, after `#`, never
// reaches a link preview, so every shared gallery link would show the same picture.

/** The address of a drawing's link preview, beside the gallery page `page`. */
export const previewUrl = (page: string, collectionId: string, itemId: string): string =>
  new URL(`${collectionId}/${itemId}/`, page.split('#')[0]).href;

/** How a share went: the device's share sheet opened, the link was copied, or neither. */
export type ShareOutcome = 'sheet' | 'copied' | 'failed';

/** Share a link: the device's share sheet where there is one (phones), else copy it. */
export async function shareLink(url: string, title: string): Promise<ShareOutcome> {
  if (navigator.share) {
    try {
      await navigator.share({ title, url });
      return 'sheet';
    } catch (err) {
      // Closing the sheet is the visitor's choice, not a failure; anything else falls back.
      if (err instanceof DOMException && err.name === 'AbortError') return 'sheet';
    }
  }
  try {
    await navigator.clipboard.writeText(url);
    return 'copied';
  } catch {
    return 'failed';
  }
}
