/// <reference lib="deno.ns" />

/// === imageProcessor.ts ===

import sharp from 'sharp';
import { DIRS, ensureDir, getBaseName, THUMB_SIZE } from './utils.ts';

export interface ProcessResult {
  filename: string;
  baseName: string;
  fullPath: string;
  thumbPath: string;
  isNew: boolean;
}

/**
 * Check which PNGs exist that don't have corresponding entries in birds.json
 * Returns list of PNGs that need processing
 */
export async function findNewImages(existingBirdIds: Set<string>): Promise<string[]> {
  const rawFiles = await getRawPngFiles();
  return rawFiles.filter((filename) => {
    const baseName = getBaseName(filename);
    return !existingBirdIds.has(baseName);
  });
}

async function getRawPngFiles(): Promise<string[]> {
  const files: string[] = [];
  try {
    for await (const entry of Deno.readDir(DIRS.raw)) {
      if (entry.isFile && entry.name.toLowerCase().endsWith('.png')) {
        files.push(entry.name);
      }
    }
  } catch (err) {
    if (err instanceof Deno.errors.NotFound) {
      return [];
    }
    throw err;
  }
  return files.sort();
}

/**
 * Process a single PNG: create full WebP and thumbnail
 * Only called when PNG is confirmed new (not in JSON)
 */
export async function processImage(filename: string): Promise<ProcessResult> {
  const baseName = getBaseName(filename);
  const rawPath = `${DIRS.raw}${filename}`;
  const fullPath = `${DIRS.full}${baseName}.webp`;
  const thumbPath = `${DIRS.thumb}${baseName}.webp`;

  console.log(`  📸 Processing: ${filename}`);

  // Ensure output directories exist
  await ensureDir(DIRS.full);
  await ensureDir(DIRS.thumb);

  // Create full-size WebP (squared with white padding)
  await makeSquareAndConvert(rawPath, fullPath);
  console.log(`    ✅ Created full: ${baseName}.webp`);

  // Create thumbnail (400x400)
  await makeSquareAndConvert(rawPath, thumbPath, THUMB_SIZE);
  console.log(`    ✅ Created thumb: ${baseName}.webp`);

  return {
    filename,
    baseName,
    fullPath,
    thumbPath,
    isNew: true,
  };
}

async function makeSquareAndConvert(
  inputPath: string,
  outputPath: string,
  size?: number,
) {
  const image = sharp(inputPath);
  const metadata = await image.metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error(`Could not read dimensions for ${inputPath}`);
  }

  // Calculate padding needed to make it square
  const maxDim = Math.max(metadata.width, metadata.height);
  const padLeft = Math.floor((maxDim - metadata.width) / 2);
  const padTop = Math.floor((maxDim - metadata.height) / 2);
  const padRight = Math.ceil((maxDim - metadata.width) / 2);
  const padBottom = Math.ceil((maxDim - metadata.height) / 2);

  let pipeline = image.extend({
    top: padTop,
    bottom: padBottom,
    left: padLeft,
    right: padRight,
    background: { r: 255, g: 255, b: 255, alpha: 1 },
  });

  // Resize if requested
  if (size) {
    pipeline = pipeline.resize(size, size, {
      fit: 'fill',
    });
  }

  // Convert to WebP
  await pipeline.webp({ quality: 90 }).toFile(outputPath);
}

/**
 * Verify that all birds with "drawn" dates have corresponding WebP files
 * Returns mismatches for debugging
 */
export async function verifyImageIntegrity(birdIds: Set<string>): Promise<{
  missingFull: string[];
  missingThumb: string[];
  orphanedFull: string[];
  orphanedThumb: string[];
}> {
  const fullFiles = await getImageFiles(DIRS.full, '.webp');
  const thumbFiles = await getImageFiles(DIRS.thumb, '.webp');

  const fullIds = new Set(fullFiles.map(getBaseName));
  const thumbIds = new Set(thumbFiles.map(getBaseName));

  const missingFull: string[] = [];
  const missingThumb: string[] = [];

  // Check that every bird in JSON has images
  for (const id of birdIds) {
    if (!fullIds.has(id)) missingFull.push(id);
    if (!thumbIds.has(id)) missingThumb.push(id);
  }

  // Check for orphaned images (have WebP but no JSON entry)
  const orphanedFull = [...fullIds].filter((id) => !birdIds.has(id));
  const orphanedThumb = [...thumbIds].filter((id) => !birdIds.has(id));

  return { missingFull, missingThumb, orphanedFull, orphanedThumb };
}

async function getImageFiles(dir: string, ext: string): Promise<string[]> {
  const files: string[] = [];
  try {
    for await (const entry of Deno.readDir(dir)) {
      if (entry.isFile && entry.name.toLowerCase().endsWith(ext)) {
        files.push(entry.name);
      }
    }
  } catch (err) {
    if (err instanceof Deno.errors.NotFound) {
      return [];
    }
    throw err;
  }
  return files;
}
