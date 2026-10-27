// What a visitor does, as the browser reports it: a key, typing, a click. A test drives the page
// through these rather than calling a component's handlers, so it goes the way a visitor would.
//
//   press('Escape')                     on the focused element (the page if none)
//   press('ArrowDown', input)           on `input`
//   type(input, 'grey')                 replaces the field's text, as typing does

/** Press `key` on `target` (the focused element by default); returns the event, to check `defaultPrevented`. */
export function press(
  key: string,
  target: EventTarget = document.activeElement ?? document.body,
  init: KeyboardEventInit = {},
): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init });
  target.dispatchEvent(event);
  return event;
}

/** Put `text` in `field` and report it, as typing into it does. */
export function type(field: HTMLInputElement, text: string): void {
  field.focus();
  field.value = text;
  field.dispatchEvent(new Event('input', { bubbles: true }));
}
