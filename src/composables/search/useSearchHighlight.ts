const MARK_OPEN =
  '<mark class="bg-accent-200/80 dark:bg-accent-500/30 text-inherit rounded-[2px] px-[1px]">';
const MARK_CLOSE = '</mark>';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function useSearchHighlight() {
  function highlightText(text: string, query: string): string {
    if (!query.trim()) return escapeHtml(text);
    const escaped = escapeHtml(text);
    const escapedQuery = escapeHtml(query.trim()).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return escaped.replace(
      new RegExp(`(${escapedQuery})`, 'gi'),
      `${MARK_OPEN}$1${MARK_CLOSE}`,
    );
  }

  return { highlightText };
}
