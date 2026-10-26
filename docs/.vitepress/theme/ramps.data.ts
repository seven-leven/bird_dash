// Build-time data for <AccentRamps />: slate and every accent hue in src/styles/main.css,
// with their colours from Tailwind's theme (a VitePress data loader: it runs in Node).
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { accentHues, type Ramp, rampOf } from '../../../script/docs/accents.ts';

const MAIN_CSS = new URL('../../../src/styles/main.css', import.meta.url);
const THEME_CSS = createRequire(import.meta.url).resolve('tailwindcss/theme.css');

export interface RampData {
  slate: Ramp;
  accents: Ramp[];
}
declare const data: RampData;
export { data };

export default {
  watch: ['../../../src/styles/main.css'],
  load(): RampData {
    const theme = readFileSync(THEME_CSS, 'utf8');
    return {
      slate: rampOf('slate', theme),
      accents: accentHues(readFileSync(MAIN_CSS, 'utf8')).map((hue) => rampOf(hue, theme)),
    };
  },
};
