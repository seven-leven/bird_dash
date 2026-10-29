// Keeps: viewerKeys (docs/TESTING.md, "Promises").
import { test } from 'vitest';
import { assert, assertEquals } from '@std/assert';
import { nextTick, ref } from 'vue';
import { useDialogKeys } from './useDialogKeys.ts';
import { mountComposable, runInScope } from '../testing/mount.ts';
import { press } from '../testing/events.ts';

/** A dialog (two buttons and a link inside) and the keys it answers, closed to begin with. */
function mountDialog(element: 'div' | 'dialog' = 'div') {
  const isOpen = ref(false);
  const pressed: string[] = [];
  const keys = Object.fromEntries(['+', 'Escape'].map((k) => [k, () => pressed.push(k)]));
  const dialog = document.createElement(element);
  dialog.tabIndex = -1;
  dialog.innerHTML = '<button>a</button><button>b</button><a href="#">c</a>';
  document.body.append(dialog);

  const { value, stop } = runInScope(() => useDialogKeys({ isOpen: () => isOpen.value, keys }));
  value.dialogRef.value = dialog;
  const open = async () => {
    isOpen.value = true;
    await nextTick();
    await nextTick();
  };
  const close = async () => {
    isOpen.value = false;
    await nextTick();
  };
  return { dialog, pressed, open, close, stop, dialogRef: value.dialogRef };
}

test('opening moves focus into the dialog and locks page scroll', async () => {
  const t = mountDialog();
  await t.open();
  assertEquals(document.activeElement, t.dialog);
  assertEquals(document.body.style.overflow, 'hidden');
  t.stop();
});

test('closing gives focus back to what opened it and unlocks scroll', async () => {
  const opener = document.createElement('button');
  document.body.append(opener);
  opener.focus();

  const t = mountDialog();
  await t.open();
  assert(document.activeElement !== opener, 'focus moved into the dialog');

  await t.close();
  assertEquals(document.activeElement, opener);
  assertEquals(document.body.style.overflow, '');
  t.stop();
});

test('while open, each key runs its handler; keys typed into a text field are left alone', async () => {
  const t = mountDialog();
  await t.open();
  const input = document.createElement('input');
  document.body.append(input);

  press('+', document.body);
  press('Escape', document.body);
  press('+', input);
  assertEquals(t.pressed, ['+', 'Escape']);
  t.stop();
});

test('keys are ignored before it first opens and after it closes', async () => {
  const t = mountDialog();
  press('+', document.body); // never opened: no listener yet
  await t.open();
  await t.close();
  press('+', document.body); // closed again: the listener is gone
  assertEquals(t.pressed, []);
  t.stop();
});

test('if nothing focusable had focus when it opened, closing leaves focus alone', async () => {
  const t = mountDialog();
  // Shadow the inherited getter for the moment of opening, then remove the shadow.
  Object.defineProperty(document, 'activeElement', { configurable: true, get: () => null });
  try {
    await t.open();
  } finally {
    delete (document as unknown as Record<string, unknown>).activeElement;
  }
  await t.close(); // must not throw trying to focus nothing
  assertEquals(document.body.style.overflow, '');
  t.stop();
});

test('unmounting while open unlocks the page and stops listening for keys', async () => {
  const isOpen = ref(false);
  const pressed: string[] = [];
  const { unmount } = mountComposable(() =>
    useDialogKeys({ isOpen: () => isOpen.value, keys: { Escape: () => pressed.push('Escape') } })
  );
  isOpen.value = true;
  await nextTick();
  assertEquals(document.body.style.overflow, 'hidden');

  unmount();
  assertEquals(document.body.style.overflow, '');
  press('Escape', document.body);
  assertEquals(pressed, []);
});

test('a <dialog> opens as a modal (the page behind inert, Tab kept in by the browser)', async () => {
  const t = mountDialog('dialog');
  await t.open();
  assertEquals([(t.dialog as HTMLDialogElement).open, document.activeElement === t.dialog], [
    true,
    true,
  ]);
  // Closed before focus goes back, or the page would still be inert.
  await t.close();
  assertEquals((t.dialog as HTMLDialogElement).open, false);
  t.stop();
});

test('with no dialog element to open, opening still listens for its keys', async () => {
  const t = mountDialog();
  t.dialogRef.value = null;
  await t.open();
  press('+', document.body);
  assertEquals(t.pressed, ['+']);
  t.stop();
});
