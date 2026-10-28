import { test } from 'vitest';
import { assertEquals } from '@std/assert';
import { h, nextTick } from 'vue';
import ViewSwitch from './ViewSwitch.vue';
import { appStores } from '../testing/appStores.ts';
import { mountComponent } from '../testing/mount.ts';

test("both views are named, the group view by the collection's groups, plain before one is known", () => {
  const host = mountComponent(() => h(ViewSwitch), { stores: appStores() });
  const buttons = [...host.querySelectorAll('[aria-label="View"] button')];
  assertEquals(buttons.map((b) => b.getAttribute('aria-label')), ['Groups view', 'Months view']);
});

test('the current view is pressed; pressing the other switches to it', async () => {
  const stores = appStores();
  const host = mountComponent(() => h(ViewSwitch), { stores });
  const [group, month] = [...host.querySelectorAll<HTMLButtonElement>('button')];
  assertEquals([group!.getAttribute('aria-pressed'), month!.getAttribute('aria-pressed')], [
    'true',
    'false',
  ]);
  month!.click();
  await nextTick();
  assertEquals(stores.view.viewMode.value, 'month');
  assertEquals([group!.getAttribute('aria-pressed'), month!.getAttribute('aria-pressed')], [
    'false',
    'true',
  ]);
});
