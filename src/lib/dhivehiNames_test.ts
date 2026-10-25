import { test } from 'vitest';
import { assertEquals } from '@std/assert';
import { dhivehiNames } from './dhivehiNames.ts';

test('one name, with how to say it', () => {
  assertEquals(dhivehiNames('ރޭރު', 'Reyru'), [{ script: 'ރޭރު', roman: 'Reyru' }]);
});

test('alternative names are paired with their own romanisations, in order', () => {
  assertEquals(dhivehiNames('ވަލު ކުކުޅު / ކުލީ ކުކުޅު', 'Valu Kukulhu / Kulhee Kukulhu'), [
    { script: 'ވަލު ކުކުޅު', roman: 'Valu Kukulhu' },
    { script: 'ކުލީ ކުކުޅު', roman: 'Kulhee Kukulhu' },
  ]);
});

test('one name spelt two ways in Latin keeps both spellings together', () => {
  assertEquals(dhivehiNames('ފުރެއްދެ އިލޮޅި', 'Furedhdhe Ilolhi / Furehdhi Ilolhi'), [
    { script: 'ފުރެއްދެ އިލޮޅި', roman: 'Furedhdhe Ilolhi / Furehdhi Ilolhi' },
  ]);
});

test('names without a romanisation stand alone; uneven extras get none', () => {
  assertEquals(dhivehiNames('ރޭރު'), [{ script: 'ރޭރު' }]);
  assertEquals(dhivehiNames('ކޮވެލި / ދިވެހި ކޮވެލި', ''), [
    { script: 'ކޮވެލި' },
    { script: 'ދިވެހި ކޮވެލި' },
  ]);
  assertEquals(dhivehiNames('A / B / C', 'a / b'), [
    { script: 'A', roman: 'a / b' },
    { script: 'B' },
    { script: 'C' },
  ]);
  assertEquals(dhivehiNames(''), []);
});
