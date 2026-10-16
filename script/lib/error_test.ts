import { test } from 'vitest';
import { assertEquals } from '@std/assert';
import { errorMessage } from './error.ts';

test('errorMessage takes the message of an Error and stringifies anything else', () => {
  assertEquals(errorMessage(new Error('boom')), 'boom');
  assertEquals(errorMessage('plain text'), 'plain text');
  assertEquals(errorMessage(42), '42');
});
