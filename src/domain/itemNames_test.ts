import { test } from 'vitest';
import { assertEquals } from '@std/assert';
import { buildNames, nameLines, nameWords } from './itemNames.ts';

test('the Dhivehi name heads an item, then the English, then the Latin', () => {
  assertEquals(
    buildNames({ name: 'Grey Heron', sci: 'Ardea cinerea', dhiv: 'Maakanaa', dhiv_script: 'މާކަނާ' }),
    [
      { text: 'މާކަނާ', lang: 'dv', role: 'title', roman: 'Maakanaa' },
      { text: 'Grey Heron', lang: 'en', role: 'common' },
      { text: 'Ardea cinerea', lang: 'la', role: 'latin' },
    ],
  );
});

test('without a Dhivehi name, the English name is the title', () => {
  assertEquals(buildNames({ name: 'Garganey', sci: 'Spatula querquedula' }), [
    { text: 'Garganey', lang: 'en', role: 'title' },
    { text: 'Spatula querquedula', lang: 'la', role: 'latin' },
  ]);
});

test('a second Dhivehi name is "also", each with its own romanisation', () => {
  const names = buildNames({
    name: 'Watercock',
    dhiv: 'Valu Kukulhu / Kulhee Kukulhu',
    dhiv_script: 'ވަލު ކުކުޅު / ކުލީ ކުކުޅު',
  });
  assertEquals(names.map((n) => [n.role, n.roman]), [
    ['title', 'Valu Kukulhu'],
    ['also', 'Kulhee Kukulhu'],
    ['common', undefined],
  ]);
});

test('Thaana without a romanisation has no roman, and blank names are dropped', () => {
  assertEquals(buildNames({ name: '  ', sci: '', dhiv_script: 'ރޭރު' }), [
    { text: 'ރޭރު', lang: 'dv', role: 'title' },
  ]);
  assertEquals(buildNames({}), []);
});

test('the words to search are every name and every romanisation', () => {
  const names = buildNames({ name: 'Grey Heron', dhiv: 'Maakanaa', dhiv_script: 'މާކަނާ' });
  assertEquals(nameWords(names), ['މާކަނާ', 'Maakanaa', 'Grey Heron']);
});

test('the names read as one line per language, in order, joined with " / "', () => {
  const names = buildNames({
    name: 'Watercock',
    sci: 'Gallicrex cinerea',
    dhiv_script: 'ވަލު ކުކުޅު / ކުލީ ކުކުޅު',
  });
  assertEquals(nameLines(names), [
    { text: 'ވަލު ކުކުޅު / ކުލީ ކުކުޅު', lang: 'dv' },
    { text: 'Watercock', lang: 'en' },
    { text: 'Gallicrex cinerea', lang: 'la' },
  ]);
});
