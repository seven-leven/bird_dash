/// <reference lib="deno.ns" />
import {
  CollectionData,
  CollectionEntry,
  COLLECTIONS,
  FILES,
  formatVersion,
  fullDir,
  IntegrityIssues,
  listFiles,
  ProcessResult,
  readJson,
  thumbDir,
  VersionData,
  writeJson,
} from './utils.ts';
import {
  createMissingThumbnail,
  processImage,
  verifyIntegrity,
} from './imageProcessor.ts';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CollectionBuildResult {
  collection: CollectionEntry;
  processed: ProcessResult[];
  integrity: IntegrityIssues;
  drawnCount: number;
}

interface BuildResult {
  version: VersionData;
  collections: CollectionBuildResult[];
}

// ---------------------------------------------------------------------------
// Version management
// ---------------------------------------------------------------------------

async function loadVersion(): Promise<VersionData> {
  try {
    return await readJson<VersionData>(FILES.version);
  } catch {
    const defaultVer: VersionData = { major: 0, minor: 7, patch: 0, count: 0, updated: new Date().toISOString() };
    await writeJson(FILES.version, defaultVer);
    return defaultVer;
  }
}

async function bumpVersion(totalDrawnCount: number): Promise<VersionData> {
  const version = await loadVersion();
  version.patch += 1;
  version.count = totalDrawnCount;
  version.updated = new Date().toISOString();
  await writeJson(FILES.version, version);
  return version;
}

// ---------------------------------------------------------------------------
// Collection data helpers — generic, no hardcoded collection names
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
    const item = group.find(i => i.id === itemId);
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

async function buildCollection(collection: CollectionEntry): Promise<CollectionBuildResult> {
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
    integrity.missingInRaw.forEach(id => console.log(`     • ${id}`));
  }

  // 4. Process raw PNGs not yet in JSON (mark as drawn today + generate images)
  if (integrity.missingInJson.length > 0) {
    console.log(`  📝 Adding ${integrity.missingInJson.length} new PNG(s) to ${collection.id}.json...`);

    for (const itemId of integrity.missingInJson) {
      const name = await markItemAsDrawn(collection, itemId, today);
      if (name) {
        drawnIds.add(itemId);
        try {
          const result = await processImage(collection, `${itemId}.png`);
          processed.push(result);
          console.log(`  ✅ Added & processed: ${name} (${itemId})`);
        } catch (err) {
          console.error(`  ❌ Failed to process ${itemId}:`, err instanceof Error ? err.message : String(err));
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

// ---------------------------------------------------------------------------
// Full build across all collections
// ---------------------------------------------------------------------------

async function runComprehensiveBuild(): Promise<BuildResult> {
  console.log('\n🚀 Starting comprehensive build...');
  const startTime = Date.now();

  const collectionResults: CollectionBuildResult[] = [];

  for (const collection of COLLECTIONS) {
    const result = await buildCollection(collection);
    collectionResults.push(result);
  }

  // Bump version — w = total drawn across ALL collections
  const totalDrawn = collectionResults.reduce((sum, r) => sum + r.drawnCount, 0);
  const newVersion = await bumpVersion(totalDrawn);

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  printSummary(newVersion, collectionResults, duration);

  return { version: newVersion, collections: collectionResults };
}

// ---------------------------------------------------------------------------
// Quick check (read-only)
// ---------------------------------------------------------------------------

async function runQuickCheck(): Promise<void> {
  console.log('\n🔍 Running integrity check...\n');

  const version = await loadVersion();
  console.log(`  Version: ${formatVersion(version)}\n`);

  for (const collection of COLLECTIONS) {
    const drawnIds = await getDrawnIds(collection);
    const integrity = await verifyIntegrity(collection, drawnIds);

    const fullFiles  = await listFiles(fullDir(collection.id),  n => n.endsWith('.webp'));
    const thumbFiles = await listFiles(thumbDir(collection.id), n => n.endsWith('.webp'));
    const rawFiles   = await listFiles(collection.raw,          n => n.endsWith('.png'));

    console.log(`${collection.emoji} ${collection.label}s`);
    console.log(`  Drawn in JSON: ${drawnIds.size}`);
    console.log(`  Raw PNGs:      ${rawFiles.length}`);
    console.log(`  Full WebPs:    ${fullFiles.length}`);
    console.log(`  Thumbnails:    ${thumbFiles.length}`);

    const checks = [
      { label: 'Missing PNGs for drawn items', items: integrity.missingInRaw },
      { label: 'PNGs not in JSON',             items: integrity.missingInJson },
      { label: 'Missing full WebPs',           items: integrity.missingFull   },
      { label: 'Missing thumbnails',           items: integrity.missingThumb  },
      { label: 'Orphaned full WebPs',          items: integrity.orphanedFull  },
      { label: 'Orphaned thumbnails',          items: integrity.orphanedThumb },
    ];

    let allGood = true;
    for (const { label, items } of checks) {
      if (items.length > 0) {
        allGood = false;
        console.log(`  ⚠️  ${label} (${items.length}): ${items.join(', ')}`);
      }
    }
    if (allGood) console.log('  ✅ All checks passed');
    console.log('');
  }
}

// ---------------------------------------------------------------------------
// Summary printer
// ---------------------------------------------------------------------------

function printSummary(
  version: VersionData,
  results: CollectionBuildResult[],
  duration: string,
): void {
  console.log('\n' + '='.repeat(50));
  console.log('📦 BUILD COMPLETE');
  console.log('='.repeat(50));
  console.log(`  Version:   ${formatVersion(version)}`);
  console.log(`  Duration:  ${duration}s`);
  console.log('');

  for (const { collection, processed, integrity, drawnCount } of results) {
    const totalIssues =
      integrity.missingInRaw.length +
      integrity.missingFull.length +
      integrity.missingThumb.length;

    console.log(`${collection.emoji} ${collection.label}s`);
    console.log(`  Drawn:     ${drawnCount}`);
    console.log(`  Processed: ${processed.length} new image(s)`);
    console.log(`  Status:    ${totalIssues === 0 ? '✅ Clean' : `⚠️  ${totalIssues} issue(s)`}`);

    if (integrity.orphanedFull.length > 0 || integrity.orphanedThumb.length > 0) {
      console.log(`  ⚠️  Orphaned files (not in JSON):`);
      integrity.orphanedFull.forEach(id  => console.log(`     • full/${collection.id}/${id}.webp`));
      integrity.orphanedThumb.forEach(id => console.log(`     • thumb/${collection.id}/${id}.webp`));
    }
    console.log('');
  }

  console.log('='.repeat(50));
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

async function handleCommand(command: string): Promise<void> {
  const actions: Record<string, () => Promise<void>> = {
    build: async () => {
      try {
        const result = await runComprehensiveBuild();
        const hasIssues = result.collections.some(r =>
          r.integrity.missingInRaw.length > 0 ||
          r.integrity.missingFull.length > 0 ||
          r.integrity.missingThumb.length > 0
        );
        if (hasIssues) {
          console.error('\n❌ Build completed with integrity issues');
          Deno.exit(1);
        }
      } catch (err) {
        console.error('❌ Build failed:', err instanceof Error ? err.message : String(err));
        Deno.exit(1);
      }
    },

    check: async () => {
      try {
        await runQuickCheck();
      } catch (err) {
        console.error('❌ Check failed:', err instanceof Error ? err.message : String(err));
        Deno.exit(1);
      }
    },

    help: async () => {
      console.log('Usage: deno run -A build.ts [command]');
      console.log('\nCommands:');
      console.log('  build  - Full build across all collections with integrity fixes');
      console.log('  check  - Read-only integrity check for all collections');
      console.log('  help   - Show this help message');
      console.log('\nCollections registered in utils.ts:');
      COLLECTIONS.forEach(c => console.log(`  ${c.emoji} ${c.id} → ${c.json}`));
      Deno.exit(0);
    },
  };

  await (actions[command] ?? actions.help)();
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

if (import.meta.main) {
  handleCommand(Deno.args[0] || 'build').catch(err => {
    console.error('❌ Unexpected error:', err instanceof Error ? err.message : String(err));
    Deno.exit(1);
  });
}

export { runComprehensiveBuild, runQuickCheck };
