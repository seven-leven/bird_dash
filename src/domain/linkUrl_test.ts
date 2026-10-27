import { test } from 'vitest';
import { assertEquals } from '@std/assert';
import { linkUrl } from './linkUrl.ts';
import { makeItem } from '../testing/fixtures.ts';

test('a link template gets every placeholder filled, the values encoded', () => {
  const item = makeItem({ commonName: 'Black & White Tern', scientificName: 'A b' });
  assertEquals(
    linkUrl('https://x.test/{{common}}/{{sci}}?again={{common}}', item),
    'https://x.test/Black%20%26%20White%20Tern/A%20b?again=Black%20%26%20White%20Tern',
  );
});
