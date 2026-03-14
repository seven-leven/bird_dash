/// <reference lib="deno.ns" />
import {
  COLLECTIONS,
  formatVersion,
  fullDir,
  listFiles,
  thumbDir,
  VersionData,
} from '../lib/index.ts';
import { bumpPatchVersion, getDrawnIds, loadVersion } from '../version/manager.ts';
import { verifyIntegrity } from './processor.ts';
import { buildCollection } from './collection.ts';
import { BuildResult, CollectionBuildResult } from '../../src/types/index.ts';
// ---------------------------------------------------------------------------
// Full build across all collections
// ---------------------------------------------------------------------------

export async function runComprehensiveBuild(): Promise<BuildResult> {
  console.log('\n🚀 Starting comprehensive build...');
  const startTime = Date.now();

  const collectionResults: CollectionBuildResult[] = [];

  for (const collection of COLLECTIONS) {
    const result = await buildCollection(collection);
    collectionResults.push(result);
  }

  // Bump version — total drawn across ALL collections
  const totalDrawn = collectionResults.reduce((sum, r) => sum + r.drawnCount, 0);
  const newVersion = await bumpPatchVersion(totalDrawn);

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  printSummary(newVersion, collectionResults, duration);

  return { version: newVersion, collections: collectionResults };
}

// ---------------------------------------------------------------------------
// Quick check (read-only)
// ---------------------------------------------------------------------------

export async function runQuickCheck(): Promise<void> {
  console.log('\n🔍 Running integrity check...\n');

  const version = await loadVersion();
  console.log(`  Version: ${formatVersion(version)}\n`);

  for (const collection of COLLECTIONS) {
    const drawnIds = await getDrawnIds(collection.id);
    const integrity = await verifyIntegrity(collection, drawnIds);

    const fullFiles = await listFiles(fullDir(collection.id), (n) => n.endsWith('.webp'));
    const thumbFiles = await listFiles(thumbDir(collection.id), (n) => n.endsWith('.webp'));
    const rawFiles = await listFiles(collection.raw, (n) => n.endsWith('.png'));

    console.log(`${collection.emoji} ${collection.label}s`);
    console.log(`  Drawn in JSON: ${drawnIds.size}`);
    console.log(`  Raw PNGs:      ${rawFiles.length}`);
    console.log(`  Full WebPs:    ${fullFiles.length}`);
    console.log(`  Thumbnails:    ${thumbFiles.length}`);

    const checks = [
      { label: 'Missing PNGs for drawn items', items: integrity.missingInRaw },
      { label: 'PNGs not in JSON', items: integrity.missingInJson },
      { label: 'Missing full WebPs', items: integrity.missingFull },
      { label: 'Missing thumbnails', items: integrity.missingThumb },
      { label: 'Orphaned full WebPs', items: integrity.orphanedFull },
      { label: 'Orphaned thumbnails', items: integrity.orphanedThumb },
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
    const totalIssues = integrity.missingInRaw.length +
      integrity.missingFull.length +
      integrity.missingThumb.length;

    console.log(`${collection.emoji} ${collection.label}s`);
    console.log(`  Drawn:     ${drawnCount}`);
    console.log(`  Processed: ${processed.length} new image(s)`);
    console.log(`  Status:    ${totalIssues === 0 ? '✅ Clean' : `⚠️  ${totalIssues} issue(s)`}`);

    if (integrity.orphanedFull.length > 0 || integrity.orphanedThumb.length > 0) {
      console.log(`  ⚠️  Orphaned files (not in JSON):`);
      integrity.orphanedFull.forEach((id) =>
        console.log(`     • full/${collection.id}/${id}.webp`)
      );
      integrity.orphanedThumb.forEach((id) =>
        console.log(`     • thumb/${collection.id}/${id}.webp`)
      );
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
        const hasIssues = result.collections.some((r) =>
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

    help: () => {
      console.log('Usage: deno run -A scripts/build/index.ts [command]');
      console.log('\nCommands:');
      console.log('  build  - Full build across all collections with integrity fixes');
      console.log('  check  - Read-only integrity check for all collections');
      console.log('  help   - Show this help message');
      console.log('\nCollections registered in lib/collections.ts:');
      COLLECTIONS.forEach((c) => console.log(`  ${c.emoji} ${c.id} → ${c.json}`));
      Deno.exit(0);
    },
  };

  await (actions[command] ?? actions.help)();
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

if (import.meta.main) {
  handleCommand(Deno.args[0] || 'build').catch((err) => {
    console.error('❌ Unexpected error:', err instanceof Error ? err.message : String(err));
    Deno.exit(1);
  });
}

export { handleCommand };
