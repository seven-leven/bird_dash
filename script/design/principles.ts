/**
 * The five design principles, as the design guide image draws them. docs/DESIGN.md
 * explains each one and tags every rule with the principle it comes from; a contract
 * test checks that the page and this list keep the same titles, in the same order.
 */
import type { IconName } from '../../src/lib/icons.ts';

export interface Principle {
  title: string;
  /** One line for the image; the page has the full explanation. */
  summary: string;
  icon: IconName;
}

export const PRINCIPLES: Principle[] = [
  {
    title: 'Drawings first',
    summary: 'The drawings carry the colour; the interface stays quiet and never covers them.',
    icon: 'easel',
  },
  {
    title: 'Show progress honestly',
    summary: 'A drawing and a gap never look alike, and every count means exactly what it says.',
    icon: 'progress',
  },
  {
    title: 'Always say where you are',
    summary: 'The current collection, view, section and drawing are always named and marked.',
    icon: 'pin',
  },
  {
    title: 'One way to do each thing',
    summary: 'The same tokens, components and words everywhere, so the site reads as one.',
    icon: 'grid',
  },
  {
    title: 'For everyone, on every screen',
    summary: 'Phone first, both themes, keyboard and touch, readable contrast, Thaana and English.',
    icon: 'person',
  },
];
