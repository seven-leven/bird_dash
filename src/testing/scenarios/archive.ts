// The fixture archive: a small, whole archive the way the site serves it, shared by every test
// that needs "an archive" rather than one edge case (docs/TESTING.md, rule 8). Two collections:
//
//   Birds   Ducks: 001 Mallard (drawn 2025-01-10), 002 Garganey (not drawn)
//           Herons: 003 Grey Heron (drawn 2025-03-05)
//   Sharks  Requiem: 001 Grey Reef Shark (not drawn)
//
// Each call returns fresh objects, so a test may change what it is given.
import type { RawCollectionConfig, RawCollectionData } from '../../types/data.ts';
import { json, type Route } from '../fakes/fakeFetch.ts';

/** `public/collections.json`. */
export const archiveCollections = (): RawCollectionConfig[] => [
  { id: 'birds', label: 'Birds', emoji: '', groupLabel: 'Family', itemLabel: 'item', links: [] },
  { id: 'sharks', label: 'Sharks', emoji: '', groupLabel: 'Family', itemLabel: 'item', links: [] },
];

/** `public/lists/<id>.json`, by collection. */
export const archiveLists = (): Record<'birds' | 'sharks', RawCollectionData> => ({
  birds: {
    Ducks: [
      { id: '001', name: 'Mallard', sci: 'Anas platyrhynchos', drawn: '2025-01-10' },
      { id: '002', name: 'Garganey', sci: 'Spatula querquedula' },
    ],
    Herons: [{ id: '003', name: 'Grey Heron', sci: 'Ardea cinerea', drawn: '2025-03-05' }],
  },
  sharks: {
    Requiem: [{ id: '001', name: 'Grey Reef Shark', sci: 'Carcharhinus amblyrhynchos' }],
  },
});

/** The archive as `fakeFetch` serves it, by the paths the site fetches. */
export function archiveRoutes(): Record<string, Route> {
  const lists = archiveLists();
  return {
    '/collections.json': json(archiveCollections()),
    '/lists/birds.json': json(lists.birds),
    '/lists/sharks.json': json(lists.sharks),
  };
}
