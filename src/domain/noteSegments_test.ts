import { test } from 'vitest';
import { assertEquals } from '@std/assert';
import { noteSegments } from './noteSegments.ts';

test('a reference to another drawing becomes a link, padded to the id length', () => {
  assertEquals(noteSegments('See note for #11 (Greater Flamingo).', 'birds', 3), [
    { text: 'See note for ' },
    { text: '#11', href: '#birds/011' },
    { text: ' (Greater Flamingo).' },
  ]);
});

test('a note that is only a reference, or has several, keeps every part in order', () => {
  assertEquals(noteSegments('#7', 'shells', 3), [{ text: '#7', href: '#shells/007' }]);
  assertEquals(noteSegments('Compare #001 and #2', 'birds', 3), [
    { text: 'Compare ' },
    { text: '#001', href: '#birds/001' },
    { text: ' and ' },
    { text: '#2', href: '#birds/002' },
  ]);
});

test('a note with no reference is one plain segment', () => {
  assertEquals(noteSegments('Drawn from life.', 'birds', 3), [{ text: 'Drawn from life.' }]);
});
