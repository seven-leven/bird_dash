/// <reference lib="deno.ns" />
import sharp from 'sharp';

// =============================================================================
// CONSTANTS & TYPES
// =============================================================================
const DIRS = {
  raw: './raw_png/',
  full: './public/full/',
  thumb: './public/thumb/',
} as const;

const FILES = {
  birds: './public/birds.json',
  version: './src/version.json',
  changelog: './CHANGELOG.md',
} as const;

const THUMB_SIZE = 400;

interface Bird {
  id: string;
  name: string;
  sci: string;
  drawn?: string;
}

interface BirdsData {
  [category: string]: Bird[];
}

interface VersionData {
  major: number;
  minor: number;
  patch: number;
  count: number;
  updated: string;
}

interface ProcessResult {
  filename: string;
  baseName: string;
}

interface IntegrityIssues {
  missingInJson: string[]; // PNGs not in birds.json
  missingInRaw: string[]; // Birds with drawn date but no PNG
  missingFull: string[]; // Birds missing full WebP
  missingThumb: string[]; // Birds missing thumbnail
  orphanedFull: string[]; // Full WebPs without JSON entry
  orphanedThumb: string[]; // Thumb WebPs without JSON entry
}

interface BuildResult {
  version: VersionData;
  processed: ProcessResult[];
  stats: {
    jsonCount: number;
    rawCount: number;
    fullCount: number;
    thumbCount: number;
  };
  integrity: IntegrityIssues;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================
async function ensureDir(path: string): Promise<void> {
  try {
    await Deno.mkdir(path, { recursive: true });
  } catch (err) {
    if (!(err instanceof Deno.errors.AlreadyExists)) throw err;
  }
}

function getBaseName(filename: string): string {
  return filename.replace(/\.(png|webp)$/i, '');
}

async function listFiles(dir: string, filter: (name: string) => boolean): Promise<string[]> {
  try {
    const files: string[] = [];
    for await (const entry of Deno.readDir(dir)) {
      if (entry.isFile && filter(entry.name)) files.push(entry.name);
    }
    return files.sort();
  } catch (err) {
    if (err instanceof Deno.errors.NotFound) return [];
    throw err;
  }
}

async function readJson<T>(path: string): Promise<T> {
  const content = await Deno.readTextFile(path);
  return JSON.parse(content);
}

async function writeJson(path: string, data: unknown): Promise<void> {
  await Deno.writeTextFile(path, JSON.stringify(data, null, 2) + '\n');
}

async function appendText(path: string, text: string): Promise<void> {
  await Deno.writeTextFile(path, text, { append: true });
}

function formatVersion(v: VersionData): string {
  return `${v.major}.${v.minor}.${v.patch}+${v.count}`;
}

// =============================================================================
// VERSION MANAGEMENT
// =============================================================================
async function loadVersion(): Promise<VersionData> {
  try {
    return await readJson<VersionData>(FILES.version);
  } catch {
    const defaultVer: VersionData = {
      major: 0,
      minor: 7,
      patch: 0,
      count: 0,
      updated: new Date().toISOString(),
    };
    await writeJson(FILES.version, defaultVer);
    return defaultVer;
  }
}

async function bumpVersion(newCount: number): Promise<VersionData> {
  const version = await loadVersion();
  version.patch += 1;
  version.count = newCount;
  version.updated = new Date().toISOString();
  await writeJson(FILES.version, version);
  return version;
}

async function getDrawnBirds(): Promise<Set<string>> {
  const data = await readJson<BirdsData>(FILES.birds);
  const drawn = new Set<string>();

  for (const category of Object.keys(data)) {
    for (const bird of data[category]) {
      if (bird.drawn) drawn.add(bird.id);
    }
  }

  return drawn;
}

async function addBirdToJson(birdId: string, today: string): Promise<string | null> {
  const data = await readJson<BirdsData>(FILES.birds);

  for (const category of Object.keys(data)) {
    const bird = data[category].find((b) => b.id === birdId);
    if (bird) {
      if (!bird.drawn) {
        bird.drawn = today;
        await writeJson(FILES.birds, data);
        return bird.name;
      }
      return bird.name; // Already exists
    }
  }

  console.warn(`  ⚠️  Bird ID ${birdId} not found in any category of birds.json`);
  return null;
}

async function addToChangelog(birdId: string, birdName: string, date: string): Promise<void> {
  const logLine = `- **Bird ${birdId}**: Added ${birdName} illustration (${date})\n`;

  try {
    await appendText(FILES.changelog, logLine);
  } catch {
    await Deno.writeTextFile(FILES.changelog, `# Changelog\n\n${logLine}`);
  }
}

// =============================================================================
// IMAGE PROCESSING
// =============================================================================
async function createWebPImage(input: string, output: string, size?: number): Promise<void> {
  const image = sharp(input);
  const metadata = await image.metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error(`Could not read dimensions for ${input}`);
  }

  const maxDim = Math.max(metadata.width, metadata.height);
  const padded = image.extend({
    top: Math.floor((maxDim - metadata.height) / 2),
    bottom: Math.ceil((maxDim - metadata.height) / 2),
    left: Math.floor((maxDim - metadata.width) / 2),
    right: Math.ceil((maxDim - metadata.width) / 2),
    background: { r: 255, g: 255, b: 255, alpha: 1 },
  });

  const resized = size ? padded.resize(size, size, { fit: 'fill' }) : padded;
  await resized.webp({ quality: 90 }).toFile(output);
}

async function processNewImage(filename: string): Promise<ProcessResult> {
  const baseName = getBaseName(filename);
  const rawPath = `${DIRS.raw}${filename}`;

  await ensureDir(DIRS.full);
  await ensureDir(DIRS.thumb);

  // Create both full and thumbnail in parallel
  await Promise.all([
    createWebPImage(rawPath, `${DIRS.full}${baseName}.webp`),
    createWebPImage(rawPath, `${DIRS.thumb}${baseName}.webp`, THUMB_SIZE),
  ]);

  return { filename, baseName };
}

async function createMissingThumbnail(birdId: string): Promise<boolean> {
  const fullPath = `${DIRS.full}${birdId}.webp`;
  const thumbPath = `${DIRS.thumb}${birdId}.webp`;

  try {
    await sharp(fullPath)
      .resize(THUMB_SIZE, THUMB_SIZE, { fit: 'fill' })
      .webp({ quality: 90 })
      .toFile(thumbPath);
    return true;
  } catch (err: unknown) {
    // FIXED: Handle unknown error type
    const message = err instanceof Error ? err.message : String(err);
    console.error(`  ❌ Failed to create thumbnail for ${birdId}:`, message);
    return false;
  }
}

// =============================================================================
// INTEGRITY CHECKING
// =============================================================================
async function checkIntegrity(drawnIds: Set<string>): Promise<IntegrityIssues> {
  const rawFiles = await listFiles(DIRS.raw, (n) => n.endsWith('.png'));
  const fullFiles = await listFiles(DIRS.full, (n) => n.endsWith('.webp'));
  const thumbFiles = await listFiles(DIRS.thumb, (n) => n.endsWith('.webp'));

  const rawIds = new Set(rawFiles.map(getBaseName));
  const fullIds = new Set(fullFiles.map(getBaseName));
  const thumbIds = new Set(thumbFiles.map(getBaseName));

  return {
    missingInJson: Array.from(rawIds).filter((id) => !drawnIds.has(id)),
    missingInRaw: Array.from(drawnIds).filter((id) => !rawIds.has(id)),
    missingFull: Array.from(drawnIds).filter((id) => !fullIds.has(id)),
    missingThumb: Array.from(drawnIds).filter((id) => !thumbIds.has(id)),
    orphanedFull: Array.from(fullIds).filter((id) => !drawnIds.has(id)),
    orphanedThumb: Array.from(thumbIds).filter((id) => !drawnIds.has(id)),
  };
}

// =============================================================================
// MAIN BUILD LOGIC
// =============================================================================
async function runComprehensiveBuild(): Promise<BuildResult> {
  console.log('\n🚀 Starting comprehensive build...\n');
  const startTime = Date.now();
  const processed: ProcessResult[] = [];
  const today = new Date().toISOString().split('T')[0];

  // 1. Load current state
  console.log('📊 Checking current state...');
  const drawnIds = await getDrawnBirds();
  const _version = await loadVersion();

  // 2. Check integrity before changes
  const integrity = await checkIntegrity(drawnIds);

  const _stats = {
    jsonCount: drawnIds.size,
    rawCount: integrity.missingInJson.length + drawnIds.size - integrity.missingInRaw.length,
    fullCount: 0,
    thumbCount: 0,
  };

  // 3. Alert about missing raw PNGs
  if (integrity.missingInRaw.length > 0) {
    console.log(`\n⚠️  ${integrity.missingInRaw.length} birds marked as drawn but missing PNGs:`);
    integrity.missingInRaw.forEach((id) => console.log(`  • ${id}`));
  }

  // 4. Process PNGs not in JSON (add them with today's date)
  if (integrity.missingInJson.length > 0) {
    console.log(`\n📝 Adding ${integrity.missingInJson.length} new PNGs to birds.json...`);

    for (const birdId of integrity.missingInJson) {
      const birdName = await addBirdToJson(birdId, today);
      if (birdName) {
        await addToChangelog(birdId, birdName, today);
        drawnIds.add(birdId); // Add to our working set

        // Process the image
        try {
          const result = await processNewImage(`${birdId}.png`);
          processed.push(result);
          console.log(`  ✅ Added & processed: ${birdName} (${birdId})`);
        } catch (err: unknown) {
          // FIXED: Handle unknown error type
          const message = err instanceof Error ? err.message : String(err);
          console.error(`  ❌ Failed to process ${birdId}:`, message);
        }
      }
    }
  }

  // 5. Ensure all drawn birds have full WebP images
  const updatedIntegrity = await checkIntegrity(drawnIds);

  if (updatedIntegrity.missingFull.length > 0) {
    console.log(
      `\n🖼️  Creating ${updatedIntegrity.missingFull.length} missing full WebP images...`,
    );

    for (const birdId of updatedIntegrity.missingFull) {
      if (integrity.missingInJson.includes(birdId)) continue; // Already processed above

      try {
        await processNewImage(`${birdId}.png`);
        console.log(`  ✅ Created full WebP: ${birdId}`);
      } catch (err: unknown) {
        // FIXED: Handle unknown error type
        const message = err instanceof Error ? err.message : String(err);
        console.error(`  ❌ Failed to create full WebP for ${birdId}:`, message);
      }
    }
  }

  // 6. Create missing thumbnails from full images
  const finalIntegrity = await checkIntegrity(drawnIds);

  if (finalIntegrity.missingThumb.length > 0) {
    console.log(`\n🖼️  Creating ${finalIntegrity.missingThumb.length} missing thumbnails...`);

    await ensureDir(DIRS.thumb);

    for (const birdId of finalIntegrity.missingThumb) {
      const success = await createMissingThumbnail(birdId);
      if (success) console.log(`  ✅ Created thumbnail: ${birdId}`);
    }
  }

  // 7. Update version with new total
  const finalDrawnIds = await getDrawnBirds();
  const newVersion = await bumpVersion(finalDrawnIds.size);

  // 8. Final integrity check
  const finalCheck = await checkIntegrity(finalDrawnIds);

  // 9. Calculate final stats
  const finalFullFiles = await listFiles(DIRS.full, (n) => n.endsWith('.webp'));
  const finalThumbFiles = await listFiles(DIRS.thumb, (n) => n.endsWith('.webp'));

  const finalStats = {
    jsonCount: finalDrawnIds.size,
    rawCount: (await listFiles(DIRS.raw, (n) => n.endsWith('.png'))).length,
    fullCount: finalFullFiles.length,
    thumbCount: finalThumbFiles.length,
  };

  // 10. Report
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  printSummary(newVersion, processed, finalStats, finalCheck, duration);

  // 11. Alerts for orphaned files
  if (finalCheck.orphanedFull.length > 0 || finalCheck.orphanedThumb.length > 0) {
    console.log('\n⚠️  ALERT: Orphaned files found (not in birds.json):');
    finalCheck.orphanedFull.forEach((id) => console.log(`  • Full: ${id}.webp`));
    finalCheck.orphanedThumb.forEach((id) => console.log(`  • Thumb: ${id}.webp`));
  }

  return {
    version: newVersion,
    processed,
    stats: finalStats,
    integrity: finalCheck,
  };
}

// =============================================================================
// QUICK CHECK FUNCTION
// =============================================================================
async function runQuickCheck(): Promise<void> {
  console.log('\n🔍 Running integrity check...\n');

  const version = await loadVersion();
  const drawnIds = await getDrawnBirds();
  const integrity = await checkIntegrity(drawnIds);

  const rawFiles = await listFiles(DIRS.raw, (n) => n.endsWith('.png'));
  const fullFiles = await listFiles(DIRS.full, (n) => n.endsWith('.webp'));
  const thumbFiles = await listFiles(DIRS.thumb, (n) => n.endsWith('.webp'));

  console.log('📊 CURRENT STATE:');
  console.log(`  Version:       ${formatVersion(version)}`);
  console.log(`  Birds in JSON: ${drawnIds.size}`);
  console.log(`  Raw PNGs:      ${rawFiles.length}`);
  console.log(`  Full WebPs:    ${fullFiles.length}`);
  console.log(`  Thumb WebPs:   ${thumbFiles.length}`);
  console.log('');

  const checks = [
    { label: 'Missing PNGs for drawn birds', items: integrity.missingInRaw, icon: '❌' },
    { label: 'PNGs not in birds.json', items: integrity.missingInJson, icon: '🆕' },
    { label: 'Missing full WebPs', items: integrity.missingFull, icon: '🖼️' },
    { label: 'Missing thumbnails', items: integrity.missingThumb, icon: '🖼️' },
    { label: 'Orphaned full WebPs', items: integrity.orphanedFull, icon: '⚠️' },
    { label: 'Orphaned thumbnails', items: integrity.orphanedThumb, icon: '⚠️' },
  ];

  let hasIssues = false;

  for (const { label, items, icon } of checks) {
    if (items.length > 0) {
      hasIssues = true;
      console.log(`${icon} ${label} (${items.length}):`);
      items.forEach((id) => console.log(`   • ${id}`));
      console.log('');
    }
  }

  // Verify counts match
  console.log('🔍 COUNT VERIFICATION:');
  console.log(
    `  JSON vs Raw PNGs:   ${drawnIds.size} ${
      drawnIds.size === rawFiles.length ? '✅' : '❌'
    } ${rawFiles.length}`,
  );
  console.log(
    `  JSON vs Full WebPs: ${drawnIds.size} ${
      drawnIds.size === fullFiles.length ? '✅' : '❌'
    } ${fullFiles.length}`,
  );
  console.log(
    `  JSON vs Thumbs:     ${drawnIds.size} ${
      drawnIds.size === thumbFiles.length ? '✅' : '❌'
    } ${thumbFiles.length}`,
  );

  if (
    !hasIssues &&
    drawnIds.size === rawFiles.length &&
    drawnIds.size === fullFiles.length &&
    drawnIds.size === thumbFiles.length
  ) {
    console.log('\n✅ All checks passed! Everything is synchronized.');
  } else {
    console.log('\n⚠️  Issues found. Run "deno run -A build.ts build" to fix.');
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================
function printSummary(
  version: VersionData,
  processed: ProcessResult[],
  stats: { jsonCount: number; rawCount: number; fullCount: number; thumbCount: number },
  integrity: IntegrityIssues,
  duration: string,
): void {
  console.log('\n' + '='.repeat(50));
  console.log('📦 BUILD COMPLETE');
  console.log('='.repeat(50));
  console.log(`  Version:      ${formatVersion(version)}`);
  console.log(`  Processed:    ${processed.length} new image(s)`);
  console.log('');
  console.log('📊 FINAL COUNTS:');
  console.log(`  Birds.json:   ${stats.jsonCount} drawn birds`);
  console.log(`  Raw PNGs:     ${stats.rawCount}`);
  console.log(`  Full WebPs:   ${stats.fullCount}`);
  console.log(`  Thumbnails:   ${stats.thumbCount}`);
  console.log('');
  console.log('🔍 INTEGRITY:');

  const issues = [
    { label: 'Missing in JSON', count: integrity.missingInJson.length },
    { label: 'Missing PNGs', count: integrity.missingInRaw.length },
    { label: 'Missing full WebPs', count: integrity.missingFull.length },
    { label: 'Missing thumbnails', count: integrity.missingThumb.length },
    { label: 'Orphaned full WebPs', count: integrity.orphanedFull.length },
    { label: 'Orphaned thumbnails', count: integrity.orphanedThumb.length },
  ];

  let allGood = true;
  for (const { label, count } of issues) {
    const status = count === 0 ? '✅' : '⚠️';
    if (count > 0) allGood = false;
    console.log(`  ${status} ${label}: ${count}`);
  }

  console.log('');
  console.log(`⏱️  Duration: ${duration}s`);
  console.log('='.repeat(50));

  if (!allGood) {
    console.log('\n⚠️  Some issues remain. Check the alerts above.');
  }
}

// =============================================================================
// CLI ENTRY POINT
// =============================================================================
async function handleCommand(command: string): Promise<void> {
  const actions: Record<string, () => Promise<void>> = {
    build: async () => {
      try {
        const result = await runComprehensiveBuild();

        // Exit with error code if there are integrity issues
        const hasIssues = result.integrity.missingInRaw.length > 0 ||
          result.integrity.missingFull.length > 0 ||
          result.integrity.missingThumb.length > 0;

        if (hasIssues) {
          console.error('\n❌ Build completed with integrity issues');
          Deno.exit(1);
        }
      } catch (err: unknown) {
        // FIXED: Handle unknown error type
        const message = err instanceof Error ? err.message : String(err);
        console.error('❌ Build failed:', message);
        Deno.exit(1);
      }
    },

    check: async () => {
      try {
        await runQuickCheck();
      } catch (err: unknown) {
        // FIXED: Handle unknown error type
        const message = err instanceof Error ? err.message : String(err);
        console.error('❌ Check failed:', message);
        Deno.exit(1);
      }
    },

    help: () => {
      console.log('Usage: deno run -A build.ts [command]');
      console.log('\nCommands:');
      console.log('  build    - Comprehensive build with integrity checks and fixes');
      console.log('  check    - Quick integrity check without making changes');
      console.log('  help     - Show this help message');
      console.log('\nExamples:');
      console.log('  deno run -A build.ts build    # Run full build process');
      console.log('  deno run -A build.ts check    # Check integrity only');
      Deno.exit(0);
    },
  };

  const action = actions[command] || actions.help;
  await action();
}

// =============================================================================
// MAIN
// =============================================================================
if (import.meta.main) {
  const command = Deno.args[0] || 'build';
  handleCommand(command).catch((err: unknown) => {
    // FIXED: Handle unknown error type
    const message = err instanceof Error ? err.message : String(err);
    console.error('❌ Unexpected error:', message);
    Deno.exit(1);
  });
}

// =============================================================================
// EXPORTS (for use as a module)
// =============================================================================
export { runComprehensiveBuild, runQuickCheck };
