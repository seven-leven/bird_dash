// Fixtures for the scripts' tests (script/), as fixtures.ts is for the site's: a collection as
// the scripts see it, a shared little list, and a transcoder that makes no images.
import type { Collection, CollectionPaths } from '../../script/lib/collections.ts';
import { PATHS } from '../../script/lib/paths.ts';
import type { Transcoder } from '../../script/ingest/transcodeImages.ts';
import type { ListFile } from '../data/files.ts';
import { archiveLists } from './scenarios/archive.ts';

/**
 * A collection as the scripts see it, at the repository's own paths unless `paths` moves some
 * (into a temporary folder, say). The label is the id, capitalised.
 */
export function makeScriptCollection(
  id: string,
  overrides: { label?: string; emoji?: string; paths?: Partial<CollectionPaths> } = {},
): Collection {
  return {
    id,
    label: overrides.label ?? id[0].toUpperCase() + id.slice(1),
    emoji: overrides.emoji ?? '🐦',
    paths: {
      json: PATHS.list(id),
      sourceArt: PATHS.sourceArt(id),
      full: PATHS.full(id),
      thumb: PATHS.thumb(id),
      ...overrides.paths,
    },
  };
}

/** The fixture archive's two ducks: 001 Mallard, drawn, and 002 Garganey, not drawn yet. */
export const twoDucks = (): ListFile => ({ Ducks: archiveLists().birds.Ducks });

/**
 * A transcoder that makes no image: it records what it was asked for (`made`, as
 * `full 001`) and fails, with `boom`, for the ids in `failing`.
 */
export function fakeTranscoder(failing: string[] = []): { transcoder: Transcoder; made: string[] } {
  const made: string[] = [];
  const answer = (kind: string, id: string) => {
    made.push(`${kind} ${id}`);
    return Promise.resolve(
      failing.includes(id) ? { ok: false as const, error: 'boom' } : { ok: true as const },
    );
  };
  return {
    transcoder: { full: (_, id) => answer('full', id), thumb: (_, id) => answer('thumb', id) },
    made,
  };
}
