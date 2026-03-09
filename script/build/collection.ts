/// <reference lib="deno.ns" />
import {
  CollectionData,
  CollectionEntry,
  IntegrityIssues,
  ProcessResult,
  readJson,
  writeJson,
} from '../lib/index.ts';
import { createMissingThumbnail, processImage, verifyIntegrity } from './processor.ts';

// ---------------------------------------------------------------------------
// Collection data helpers
// ---------------------------------------------------------------------------

async function getDrawnIds(collection: CollectionEntry): Promise<Set<string>> {
  const data = await readJson<CollectionData>(collection.json);
  const ids = new Set<string>();
  for (const group of Object.values(data)) {
    for (const item of group) {
      if (item.drawn) ids.add(item.id);
    }
  }
  return ids;
}

async function markItemAsDrawn(
  collection: CollectionEntry,
  itemId: string,
  today: string,
): Promise<string | null> {
  const data = await readJson<CollectionData>(collection.json);

  for (const group of Object.values(data)) {
    const item = group.find((i) => i.id === itemId);
    if (item) {
      if (!item.drawn) {
        item.drawn = today;
        await writeJson(collection.json, data);
      }
      return item.name;
    }
  }

  console.warn(`  ⚠️  ID ${itemId} not found in ${collection.json}`);
  return null;
}

// ---------------------------------------------------------------------------
// Build logic for a single collection
// ---------------------------------------------------------------------------

export interface CollectionBuildResult {
  collection: CollectionEntry;
  processed: ProcessResult[];
  integrity: IntegrityIssues;
  drawnCount: number;
}

export async function buildCollection(collection: CollectionEntry): Promise<CollectionBuildResult> {
  const today = new Date().toISOString().split('T')[0];
  const processed: ProcessResult[] = [];

  console.log(`\n📂 Collection: ${collection.emoji} ${collection.label}s`);

  // 1. Load drawn IDs
  let drawnIds = await getDrawnIds(collection);

  // 2. Initial integrity check
  const integrity = await verifyIntegrity(collection, drawnIds);

  // 3. Warn about drawn items missing raw PNGs
  if (integrity.missingInRaw.length > 0) {
    console.log(`  ⚠️  ${integrity.missingInRaw.length} items marked drawn but missing PNGs:`);
    integrity.missingInRaw.forEach((id) => console.log(`     • ${id}`));
  }

  // 4. Process raw PNGs not yet in JSON (mark as drawn today + generate images)
  if (integrity.missingInJson.length > 0) {
    console.log(
      `  📝 Adding ${integrity.missingInJson.length} new PNG(s) to ${collection.id}.json...`,
    );

    for (const itemId of integrity.missingInJson) {
      const name = await markItemAsDrawn(collection, itemId, today);
      if (name) {
        drawnIds.add(itemId);
        try {
          const result = await processImage(collection, `${itemId}.png`);
          processed.push(result);
          console.log(`  ✅ Added & processed: ${name} (${itemId})`);
        } catch (err) {
          console.error(
            `  ❌ Failed to process ${itemId}:`,
            err instanceof Error ? err.message : String(err),
          );
        }
      }
    }
  }

  // 5. Regenerate any missing full WebPs
  const afterAdd = await verifyIntegrity(collection, drawnIds);

  if (afterAdd.missingFull.length > 0) {
    console.log(`  🖼️  Creating ${afterAdd.missingFull.length} missing full WebP(s)...`);
    for (const itemId of afterAdd.missingFull) {
      if (integrity.missingInJson.includes(itemId)) continue; // already done above
      try {
        await processImage(collection, `${itemId}.png`);
        console.log(`  ✅ Created full WebP: ${itemId}`);
      } catch (err) {
        console.error(`  ❌ Failed:`, err instanceof Error ? err.message : String(err));
      }
    }
  }

  // 6. Regenerate any missing thumbnails
  const afterFull = await verifyIntegrity(collection, drawnIds);

  if (afterFull.missingThumb.length > 0) {
    console.log(`  🖼️  Creating ${afterFull.missingThumb.length} missing thumbnail(s)...`);
    for (const itemId of afterFull.missingThumb) {
      const ok = await createMissingThumbnail(collection, itemId);
      if (ok) console.log(`  ✅ Created thumbnail: ${itemId}`);
    }
  }

  // 7. Final integrity snapshot for this collection
  drawnIds = await getDrawnIds(collection);
  const finalIntegrity = await verifyIntegrity(collection, drawnIds);

  return { collection, processed, integrity: finalIntegrity, drawnCount: drawnIds.size };
}
