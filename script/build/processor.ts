/// <reference lib="deno.ns" />
import sharp from 'sharp';

import {
  ensureDir,
  type ScriptCollectionEntry,
  fullDir,
  getBaseName,
  IntegrityIssues,
  listFiles,
  ProcessResult,
  thumbDir,
} from '../lib/index.ts';

const THUMB_SIZE = 400;
// Use all CPU cores
sharp.concurrency(0);

// --------------------------------------------------
// Internal helper
// --------------------------------------------------

function squareResize(
  pipeline: sharp.Sharp,
  size?: number,
): sharp.Sharp {
  if (size) {
    return pipeline.resize(size, size, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 0 },
    });
  }

  // full image (large but not unlimited)
  return pipeline.resize({
    width: 2048,
    height: 2048,
    fit: 'contain',
    withoutEnlargement: true,
    background: { r: 255, g: 255, b: 255, alpha: 0 },
  });
}

// --------------------------------------------------
// Process a new raw PNG
// --------------------------------------------------

export async function processImage(
  collection: ScriptCollectionEntry,
  filename: string,
): Promise<ProcessResult> {
  const baseName = getBaseName(filename);

  const rawPath = `${collection.raw}${filename}`;
  const fullPath = `${fullDir(collection.id)}${baseName}.webp`;
  const thumbPath = `${thumbDir(collection.id)}${baseName}.webp`;

  await ensureDir(fullDir(collection.id));
  await ensureDir(thumbDir(collection.id));

  // Decode once
  const base = sharp(rawPath).rotate(); // auto-orient

  await Promise.all([
    squareResize(base.clone(), undefined)
      .webp({ quality: 90 })
      .toFile(fullPath),

    squareResize(base.clone(), THUMB_SIZE)
      .webp({ quality: 90 })
      .toFile(thumbPath),
  ]);

  console.log(`  ✅ Processed: ${baseName} (${collection.label})`);

  return {
    filename,
    baseName,
    isNew: true,
  };
}

// --------------------------------------------------
// Thumbnail regeneration (from RAW PNG only)
// --------------------------------------------------

export async function createMissingThumbnail(
  collection: ScriptCollectionEntry,
  itemId: string,
): Promise<boolean> {
  const rawPath = `${collection.raw}${itemId}.png`;
  const thumbPath = `${thumbDir(collection.id)}${itemId}.webp`;

  try {
    await ensureDir(thumbDir(collection.id));

    await sharp(rawPath)
      .rotate()
      .resize(THUMB_SIZE, THUMB_SIZE, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 },
      })
      .webp({ quality: 90 })
      .toFile(thumbPath);

    return true;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);

    console.error(
      `❌ Failed to create thumbnail for ${itemId} (${collection.label}):`,
      message,
    );

    return false;
  }
}

// --------------------------------------------------
// Integrity check
// --------------------------------------------------

export async function verifyIntegrity(
  collection: ScriptCollectionEntry,
  drawnIds: Set<string>,
): Promise<IntegrityIssues> {
  const rawFiles = await listFiles(collection.raw, (n) => n.endsWith('.png'));
  const fullFiles = await listFiles(fullDir(collection.id), (n) => n.endsWith('.webp'));
  const thumbFiles = await listFiles(thumbDir(collection.id), (n) => n.endsWith('.webp'));

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
