/// <reference lib="deno.ns" />
import sharp from 'sharp';
import {
  CollectionEntry,
  ensureDir,
  fullDir,
  getBaseName,
  IntegrityIssues,
  listFiles,
  ProcessResult,
  thumbDir,
  THUMB_SIZE,
} from './utils.ts';

// ---------------------------------------------------------------------------
// Image creation
// ---------------------------------------------------------------------------

async function createWebPImage(input: string, output: string, size?: number): Promise<void> {
  const image = sharp(input);
  const metadata = await image.metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error(`Could not read dimensions for ${input}`);
  }

  const maxDim = Math.max(metadata.width, metadata.height);
  const padded = image.extend({
    top:    Math.floor((maxDim - metadata.height) / 2),
    bottom: Math.ceil( (maxDim - metadata.height) / 2),
    left:   Math.floor((maxDim - metadata.width)  / 2),
    right:  Math.ceil( (maxDim - metadata.width)  / 2),
    background: { r: 255, g: 255, b: 255, alpha: 1 },
  });

  const resized = size ? padded.resize(size, size, { fit: 'fill' }) : padded;
  await resized.webp({ quality: 90 }).toFile(output);
}

// ---------------------------------------------------------------------------
// Public API — all functions accept a CollectionEntry, no hardcoded paths
// ---------------------------------------------------------------------------

/** Find raw PNGs in the collection's raw folder that haven't been processed yet. */
export async function findNewImages(
  collection: CollectionEntry,
  existingIds: Set<string>,
): Promise<string[]> {
  const rawFiles = await listFiles(collection.raw, n => n.toLowerCase().endsWith('.png'));
  return rawFiles.filter(filename => !existingIds.has(getBaseName(filename)));
}

/** Process a single raw PNG → full WebP + thumbnail for the given collection. */
export async function processImage(
  collection: CollectionEntry,
  filename: string,
): Promise<ProcessResult> {
  const baseName = getBaseName(filename);
  const rawPath  = `${collection.raw}${filename}`;
  const fDir     = fullDir(collection.id);
  const tDir     = thumbDir(collection.id);

  await ensureDir(fDir);
  await ensureDir(tDir);

  await Promise.all([
    createWebPImage(rawPath, `${fDir}${baseName}.webp`),
    createWebPImage(rawPath, `${tDir}${baseName}.webp`, THUMB_SIZE),
  ]);

  console.log(`  ✅ Processed: ${baseName} (${collection.label})`);
  return { filename, baseName, isNew: true };
}

/** Create a thumbnail from an already-existing full WebP (recovery path). */
export async function createMissingThumbnail(
  collection: CollectionEntry,
  itemId: string,
): Promise<boolean> {
  const fullPath  = `${fullDir(collection.id)}${itemId}.webp`;
  const thumbPath = `${thumbDir(collection.id)}${itemId}.webp`;

  try {
    await ensureDir(thumbDir(collection.id));
    await sharp(fullPath)
      .resize(THUMB_SIZE, THUMB_SIZE, { fit: 'fill' })
      .webp({ quality: 90 })
      .toFile(thumbPath);
    return true;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`  ❌ Failed to create thumbnail for ${itemId} (${collection.label}):`, message);
    return false;
  }
}

/** Full integrity check for a single collection. */
export async function verifyIntegrity(
  collection: CollectionEntry,
  drawnIds: Set<string>,
): Promise<IntegrityIssues> {
  const rawFiles   = await listFiles(collection.raw,          n => n.endsWith('.png'));
  const fullFiles  = await listFiles(fullDir(collection.id),  n => n.endsWith('.webp'));
  const thumbFiles = await listFiles(thumbDir(collection.id), n => n.endsWith('.webp'));

  const rawIds   = new Set(rawFiles.map(getBaseName));
  const fullIds  = new Set(fullFiles.map(getBaseName));
  const thumbIds = new Set(thumbFiles.map(getBaseName));

  return {
    missingInJson: Array.from(rawIds).filter(id => !drawnIds.has(id)),
    missingInRaw:  Array.from(drawnIds).filter(id => !rawIds.has(id)),
    missingFull:   Array.from(drawnIds).filter(id => !fullIds.has(id)),
    missingThumb:  Array.from(drawnIds).filter(id => !thumbIds.has(id)),
    orphanedFull:  Array.from(fullIds).filter(id => !drawnIds.has(id)),
    orphanedThumb: Array.from(thumbIds).filter(id => !drawnIds.has(id)),
  };
}
