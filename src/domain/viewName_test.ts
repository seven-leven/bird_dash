import { test } from 'vitest';
import { assertEquals } from '@std/assert';
import { viewName } from './viewName.ts';

test('the group view is named after the groups, in the plural', () => {
  assertEquals(viewName('group', 'Family'), 'Families');
  assertEquals(viewName('group', 'Order'), 'Orders');
  assertEquals(viewName('group', 'Group'), 'Groups');
});

test('the month view is "Months", whatever the collection groups by', () => {
  assertEquals(viewName('month', 'Family'), 'Months');
});
