/**
 * The five design principles, as the design guide image draws them. docs/DESIGN.md
 * explains each one, and every numbered section there names the principles it
 * serves; a contract test checks that the page and this list agree.
 */
import type { IconName } from '../../src/ui/icons.ts';

export interface Principle {
  title: string;
  /** The principle in one sentence: the bold line under its heading in DESIGN.md. */
  summary: string;
  icon: IconName;
}

export const PRINCIPLES: Principle[] = [
  {
    title: 'Drawings first',
    summary: 'The work is the most vivid thing on the screen.',
    icon: 'easel',
  },
  {
    title: 'Show progress honestly',
    summary: 'A drawing and an empty space are not the same thing.',
    icon: 'progress',
  },
  {
    title: 'Always say where you are',
    summary: 'A visitor should never have to guess.',
    icon: 'pin',
  },
  {
    title: 'One way to do each thing',
    summary: 'Consistency is a feature, not a constraint.',
    icon: 'grid',
  },
  {
    title: 'For everyone, on every screen',
    summary: 'Access is part of the design, not a finishing pass.',
    icon: 'person',
  },
];
