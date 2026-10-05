/// <reference lib="deno.ns" />
import { assert, assertEquals } from '@std/assert';
import { nextTick, reactive } from 'vue';
import { useLightbox } from './useLightBox.ts';
import { at, makeCollection, makeItem, runInScope } from '../../../test/fixtures.ts';
import { withDom } from '../../../test/dom.ts';
import type { CollectionItem } from '../../types/index.ts';

const items = [
  makeItem({ itemId: '001', drawnTime: at(2025, 1, 10) }),
  makeItem({ itemId: '002', drawnTime: at(2025, 2, 10) }),
  makeItem({ itemId: '003', drawnTime: at(2025, 3, 10) }),
];

/** A lightbox with a real dialog element (2 buttons + 1 link) attached to the fake DOM. */
function setup(startAt = 0) {
  const props = reactive({
    isOpen: false,
    item: items[startAt] as CollectionItem | undefined,
    drawnItems: items,
    fullImageBaseUrl: '/full/x/',
    collection: makeCollection('x'),
  });
  const emitted: Array<[string, CollectionItem | undefined]> = [];
  const emit =
    ((event: string, payload?: CollectionItem) => emitted.push([event, payload])) as never;

  const dialog = document.createElement('div');
  dialog.tabIndex = -1;
  dialog.innerHTML =
    '<button id="first">a</button><button id="mid">b</button><a id="last" href="#">c</a>';
  document.body.append(dialog);

  const { value: lb, stop } = runInScope(() => useLightbox({ props, emit }));
  lb.dialogRef.value = dialog;

  const key = (k: string, init: KeyboardEventInit = {}, target: EventTarget = document.body) => {
    const e = new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...init });
    target.dispatchEvent(e);
    return e;
  };
  const open = async () => {
    props.isOpen = true;
    await nextTick();
    await nextTick();
  };
  const el = (id: string) => dialog.querySelector<HTMLElement>(`#${id}`)!;

  return { props, lb, emitted, dialog, key, open, el, stop };
}

const pointer = (type: string, id: number, x: number, y: number, kind = 'touch') =>
  new PointerEvent(type, { pointerId: id, clientX: x, clientY: y, pointerType: kind });

Deno.test('opening moves focus into the dialog and locks page scroll', () =>
  withDom(async () => {
    const t = setup();
    await t.open();
    assertEquals(document.activeElement, t.dialog);
    assertEquals(document.body.style.overflow, 'hidden');
    t.stop();
  }));

Deno.test('closing restores focus to what opened it and unlocks scroll', () =>
  withDom(async () => {
    const opener = document.createElement('button');
    document.body.append(opener);
    opener.focus();

    const t = setup();
    await t.open();
    assert(document.activeElement !== opener);

    t.props.isOpen = false;
    await nextTick();
    assertEquals(document.activeElement, opener);
    assertEquals(document.body.style.overflow, '');
    t.stop();
  }));

Deno.test('+ / - / 0 zoom, and Escape asks the parent to close', () =>
  withDom(async () => {
    const t = setup();
    await t.open();

    t.key('+');
    t.key('+');
    assertEquals(t.lb.scale.value, 1.5);
    t.key('-');
    assertEquals(t.lb.scale.value, 1.25);
    t.key('0');
    assertEquals(t.lb.scale.value, 1);

    t.key('Escape');
    assertEquals(t.emitted, [['close', undefined]]);
    t.stop();
  }));

Deno.test('arrow keys page through the drawn items and stop at the ends', () =>
  withDom(async () => {
    const t = setup(0);
    await t.open();

    t.key('ArrowLeft'); // already first: nothing to go back to
    assertEquals(t.emitted, []);

    t.key('ArrowRight');
    assertEquals(t.emitted.map(([e, p]) => [e, p?.itemId]), [['update:item', '002']]);
    t.stop();
  }));

Deno.test('keys typed into a text field do not zoom or page the image', () =>
  withDom(async () => {
    const t = setup();
    await t.open();
    const input = document.createElement('input');
    document.body.append(input);

    t.key('+', {}, input);
    t.key('ArrowRight', {}, input);
    assertEquals(t.lb.scale.value, 1);
    assertEquals(t.emitted, []);
    t.stop();
  }));

Deno.test('Tab wraps from the last control to the first, Shift+Tab the other way', () =>
  withDom(async () => {
    const t = setup();
    await t.open();

    t.el('last').focus();
    const forward = t.key('Tab', {}, t.el('last'));
    assert(forward.defaultPrevented, 'Tab on the last control must be intercepted');
    assertEquals(document.activeElement, t.el('first'));

    const back = t.key('Tab', { shiftKey: true }, t.el('first'));
    assert(back.defaultPrevented, 'Shift+Tab on the first control must be intercepted');
    assertEquals(document.activeElement, t.el('last'));

    t.el('mid').focus();
    const middle = t.key('Tab', {}, t.el('mid'));
    assert(!middle.defaultPrevented, 'Tab in the middle is left to the browser');
    t.stop();
  }));

Deno.test('keys are ignored while closed', () =>
  withDom(async () => {
    const t = setup();
    t.key('+'); // never opened, so the window listener was never attached
    assertEquals(t.lb.scale.value, 1);
    await t.open();
    t.props.isOpen = false;
    await nextTick();
    t.key('+'); // closed again: listener removed
    assertEquals(t.lb.scale.value, 1);
    t.stop();
  }));

Deno.test('a two-finger pinch zooms by how far the fingers spread', () =>
  withDom(async () => {
    const t = setup();
    await t.open();

    t.lb.handlePointerDown(pointer('pointerdown', 1, 300, 300));
    t.lb.handlePointerDown(pointer('pointerdown', 2, 400, 300)); // 100px apart
    t.lb.handlePointerMove(pointer('pointermove', 2, 550, 300)); // 250px apart
    assertEquals(t.lb.scale.value, 2.5);

    t.lb.handlePointerUp(pointer('pointerup', 2, 550, 300));
    t.lb.handlePointerUp(pointer('pointerup', 1, 300, 300));
    t.stop();
  }));

Deno.test('a finger swipe pages; a mouse drag at 1x does not', () =>
  withDom(async () => {
    const t = setup(0);
    await t.open();

    // mouse drag left at 1x: no paging
    t.lb.handlePointerDown(pointer('pointerdown', 1, 400, 300, 'mouse'));
    t.lb.handlePointerUp(pointer('pointerup', 1, 200, 300, 'mouse'));
    assertEquals(t.emitted, []);

    // finger swipe left: next item
    t.lb.handlePointerDown(pointer('pointerdown', 1, 400, 300));
    t.lb.handlePointerUp(pointer('pointerup', 1, 250, 305));
    assertEquals(t.emitted.map(([e, p]) => [e, p?.itemId]), [['update:item', '002']]);
    t.stop();
  }));

Deno.test('dragging while zoomed pans by the distance divided by the scale', () =>
  withDom(async () => {
    const t = setup();
    await t.open();
    t.key('+');
    t.key('+'); // 1.5x

    t.lb.handlePointerDown(pointer('pointerdown', 1, 300, 300));
    t.lb.handlePointerMove(pointer('pointermove', 1, 360, 330)); // (60, 30) / 1.5
    await new Promise((r) => requestAnimationFrame(() => r(null))); // the write is per-frame
    assertEquals([t.lb.translateX.value, t.lb.translateY.value], [40, 20]);
    assertEquals(t.lb.isDragging.value, true);

    t.lb.handlePointerUp(pointer('pointerup', 1, 360, 330));
    assertEquals(t.lb.isDragging.value, false);
    t.stop();
  }));

const clickOn = (target: object, currentTarget: object = target) =>
  ({ target, currentTarget }) as unknown as MouseEvent;

Deno.test('a click on empty space closes; a click that bubbled from a child does not', () =>
  withDom(async () => {
    const t = setup();
    await t.open();
    t.lb.handleBackdropClick(clickOn(t.el('first'), t.dialog)); // came from a control
    assertEquals(t.emitted, []);
    t.lb.handleBackdropClick(clickOn(t.dialog));
    assertEquals(t.emitted.map(([e]) => e), ['close']);
    t.stop();
  }));

Deno.test('the click that ends a drag does not close; the next plain click does', () =>
  withDom(async () => {
    const t = setup();
    await t.open();
    t.lb.handlePointerDown(pointer('pointerdown', 1, 400, 300, 'mouse'));
    t.lb.handlePointerUp(pointer('pointerup', 1, 300, 300, 'mouse')); // moved 100px
    t.lb.handleBackdropClick(clickOn(t.dialog));
    assertEquals(t.emitted, [], 'a drag was treated as a click');

    t.lb.handlePointerDown(pointer('pointerdown', 2, 400, 300, 'mouse'));
    t.lb.handlePointerUp(pointer('pointerup', 2, 402, 301, 'mouse')); // a real click
    t.lb.handleBackdropClick(clickOn(t.dialog));
    assertEquals(t.emitted.map(([e]) => e), ['close']);
    t.stop();
  }));

Deno.test('position reports where the open item sits among the drawn items', () =>
  withDom(() => {
    const t = setup(1);
    assertEquals(t.lb.position.value, '2 of 3');
    t.props.item = undefined;
    assertEquals(t.lb.position.value, '');
    t.stop();
  }));
