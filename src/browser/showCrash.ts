// The last resort, for an error the app's own boundary cannot catch (one in App.vue itself):
// a plain message where the app was, with a way to load the page again, never a blank page.
// Written with the DOM alone, as Vue may be what failed; styled by the classes the site has.

/** Put the crash message, and "Try again", in place of what `root` held. */
export function showCrash(root: Element | null, message: string, reload: () => void): void {
  if (!root) return;
  const doc = root.ownerDocument;
  const box = doc.createElement('div');
  box.setAttribute('role', 'alert');
  box.className = 'flex flex-col items-center justify-center gap-2 min-h-screen p-4 text-center';
  const title = doc.createElement('h2');
  title.className = 'text-sm font-semibold text-body';
  title.textContent = 'Something went wrong';
  const hint = doc.createElement('p');
  hint.className = 'max-w-sm text-xs text-muted';
  hint.textContent = message;
  const retry = doc.createElement('button');
  retry.className = 'btn-primary focus-ring mt-3';
  retry.textContent = 'Try again';
  retry.addEventListener('click', reload);
  box.append(title, hint, retry);
  root.replaceChildren(box);
}
