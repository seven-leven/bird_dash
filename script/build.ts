/// <reference lib="deno.ns" />
import {
  findNewImages,
  processImage,
  ProcessResult,
  verifyImageIntegrity,
} from './imageProcessor.ts';
import {
  addToChangelog,
  bumpPatchVersion,
  getDisplayVersion,
  getExistingBirdIds,
  loadVersion,
  markBirdAsDrawn,
  VersionData,
} from './versionManager.ts';

interface BuildResult {
  version: VersionData;
  processed: ProcessResult[];
  skipped: string[];
  integrity: {
    passed: boolean;
    issues: string[];
  };
}

/**
 * Main build orchestrator
 * 1. Check for new PNGs (not in birds.json)
 * 2. Process only new ones (convert + thumbnail)
 * 3. Update birds.json and changelog for new birds
 * 4. Bump patch version
 * 5. Verify integrity
 */
export async function runBuild(): Promise<BuildResult> {
  console.log('\n🚀 Starting build process...\n');

  const startTime = Date.now();
  const processed: ProcessResult[] = [];
  const skipped: string[] = [];

  // Step 1: Get current state
  console.log('📊 Checking current state...');
  const existingIds = await getExistingBirdIds();
  const initialCount = existingIds.size;
  console.log(`  Found ${initialCount} birds with illustrations`);

  // Step 2: Find new PNGs that aren't in JSON yet
  console.log('\n🔍 Checking for new images...');
  const newPngs = await findNewImages(existingIds);

  if (newPngs.length === 0) {
    console.log('  ✨ No new images to process');
  } else {
    console.log(`  🆕 Found ${newPngs.length} new image(s):`);
    for (const png of newPngs) {
      console.log(`     - ${png}`);
    }

    // Step 3: Process each new image
    console.log('\n🖼️  Processing images...');
    for (const filename of newPngs) {
      try {
        const result = await processImage(filename);
        processed.push(result);

        // Update birds.json and changelog
        const birdName = await markBirdAsDrawn(result.baseName);
        if (birdName) {
          await addToChangelog(result.baseName, birdName);
        }
      } catch (err) {
        console.error(`  ❌ Failed to process ${filename}:`, err);
        skipped.push(filename);
      }
    }
  }

  // Step 4: Update version (bump patch on every build)
  console.log('\n🔢 Updating version...');
  const newCount = initialCount + processed.length;
  const version = await bumpPatchVersion(newCount);

  // Step 5: Verify integrity
  console.log('\n🔒 Running integrity check...');
  const updatedIds = await getExistingBirdIds();
  const integrity = await verifyImageIntegrity(updatedIds);

  const issues: string[] = [];

  if (integrity.missingFull.length > 0) {
    issues.push(`Missing full images: ${integrity.missingFull.join(', ')}`);
  }
  if (integrity.missingThumb.length > 0) {
    issues.push(`Missing thumbnails: ${integrity.missingThumb.join(', ')}`);
  }
  if (integrity.orphanedFull.length > 0) {
    issues.push(`Orphaned full images (no JSON entry): ${integrity.orphanedFull.join(', ')}`);
  }
  if (integrity.orphanedThumb.length > 0) {
    issues.push(`Orphaned thumbnails (no JSON entry): ${integrity.orphanedThumb.join(', ')}`);
  }

  const passed = issues.length === 0;

  if (passed) {
    console.log('  ✅ Integrity check passed');
  } else {
    console.warn('  ⚠️  Integrity issues found:');
    for (const issue of issues) {
      console.warn(`     - ${issue}`);
    }
  }

  // Summary
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log('\n' + '='.repeat(50));
  console.log('📦 BUILD SUMMARY');
  console.log('='.repeat(50));
  console.log(`  Version:    ${getDisplayVersion(version)}`);
  console.log(`  Processed:  ${processed.length} new image(s)`);
  console.log(`  Skipped:    ${skipped.length} failed`);
  console.log(`  Total birds: ${version.count}`);
  console.log(`  Integrity:  ${passed ? '✅ PASS' : '⚠️  WARN'}`);
  console.log(`  Duration:   ${duration}s`);
  console.log('='.repeat(50) + '\n');

  return {
    version,
    processed,
    skipped,
    integrity: { passed, issues },
  };
}

/**
 * Quick check - just validates integrity without processing
 */
export async function runCheck(): Promise<void> {
  console.log('\n🔍 Running integrity check...\n');

  const version = await loadVersion();
  const ids = await getExistingBirdIds();
  const integrity = await verifyImageIntegrity(ids);

  console.log(`Current version: ${getDisplayVersion(version)}`);
  console.log(`Birds in JSON: ${ids.size}`);

  let hasIssues = false;

  if (integrity.missingFull.length > 0) {
    console.error(`\n❌ Missing full images (${integrity.missingFull.length}):`);
    for (const id of integrity.missingFull) {
      console.error(`   - ${id}`);
    }
    hasIssues = true;
  }

  if (integrity.missingThumb.length > 0) {
    console.error(`\n❌ Missing thumbnails (${integrity.missingThumb.length}):`);
    for (const id of integrity.missingThumb) {
      console.error(`   - ${id}`);
    }
    hasIssues = true;
  }

  if (integrity.orphanedFull.length > 0) {
    console.warn(`\n⚠️  Orphaned full images (${integrity.orphanedFull.length}):`);
    for (const id of integrity.orphanedFull) {
      console.warn(`   - ${id}`);
    }
    hasIssues = true;
  }

  if (integrity.orphanedThumb.length > 0) {
    console.warn(`\n⚠️  Orphaned thumbnails (${integrity.orphanedThumb.length}):`);
    for (const id of integrity.orphanedThumb) {
      console.warn(`   - ${id}`);
    }
    hasIssues = true;
  }

  if (!hasIssues) {
    console.log('\n✅ All checks passed!');
  }

  console.log('');
}

// CLI entry points
if (import.meta.main) {
  const command = Deno.args[0] || 'build';

  try {
    switch (command) {
      case 'build': {
        const result = await runBuild();
        if (!result.integrity.passed) {
          console.error('❌ Build completed with integrity warnings');
          Deno.exit(1);
        }
        if (result.skipped.length > 0) {
          console.error('❌ Build completed with processing failures');
          Deno.exit(1);
        }
        break;
      }

      case 'check': {
        await runCheck();
        break;
      }

      default: {
        console.log(`Usage: deno run -A script/build.ts [build|check]`);
        console.log('  build - Process new images and update version (default)');
        console.log('  check - Verify integrity without making changes');
        Deno.exit(1);
      }
    }
  } catch (err) {
    console.error('❌ Build failed:', err);
    Deno.exit(1);
  }
}
