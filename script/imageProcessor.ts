/// <reference lib="deno.ns" />
import sharp from 'sharp';
import {
  checkIntegrity,
  DIRS,
  ensureDir,
  getBaseName,
  ProcessResult,
  THUMB_SIZE,
} from './utils.ts';

export { checkIntegrity };

// Find PNGs not yet in birds.json
export async function findNewImages(existingBirdIds: Set<string>): Promise<string[]> {
  const rawFiles = await listFiles(DIRS.raw, (n) => n.toLowerCase().endsWith('.png'));
  return rawFiles.filter((filename) => !existingBirdIds.has(getBaseName(filename)));
}

// Create both full and thumbnail WebP images
export async function processImage(filename: string): Promise<ProcessResult> {
  const baseName = getBaseName(filename);

  await ensureDir(DIRS.full);
  await ensureDir(DIRS.thumb);

  // Process both sizes in parallel
  await Promise.all([
    createWebPImage(`${DIRS.raw}${filename}`, `${DIRS.full}${baseName}.webp`),
    createWebPImage(`${DIRS.raw}${filename}`, `${DIRS.thumb}${baseName}.webp`, THUMB_SIZE),
  ]);

  console.log(`  ✅ Processed: ${baseName}`);
  return { filename, baseName, isNew: true };
}

// Helper function to create WebP image
async function createWebPImage(input: string, output: string, size?: number): Promise<void> {
  const image = sharp(input);
  const metadata = await image.metadata();

  const maxDim = Math.max(metadata.width || 0, metadata.height || 0);
  const padded = image.extend({
    top: Math.floor((maxDim - (metadata.height || 0)) / 2),
    bottom: Math.ceil((maxDim - (metadata.height || 0)) / 2),
    left: Math.floor((maxDim - (metadata.width || 0)) / 2),
    right: Math.ceil((maxDim - (metadata.width || 0)) / 2),
    background: { r: 255, g: 255, b: 255, alpha: 1 },
  });

  const resized = size ? padded.resize(size, size, { fit: 'fill' }) : padded;
  await resized.webp({ quality: 90 }).toFile(output);
}

// File listing helper
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

// New simplified integrity check matching your requirements
export async function verifyImageIntegrity(birdIds: Set<string>): Promise<{
  missingFull: string[];
  missingThumb: string[];
  orphanedFull: string[];
  orphanedThumb: string[];
}> {
  const fullFiles = await listFiles(DIRS.full, (n) => n.endsWith('.webp'));
  const thumbFiles = await listFiles(DIRS.thumb, (n) => n.endsWith('.webp'));

  const fullIds = new Set(fullFiles.map(getBaseName));
  const thumbIds = new Set(thumbFiles.map(getBaseName));

  const missingFull: string[] = [];
  const missingThumb: string[] = [];

  // Check birds in JSON have images
  for (const id of birdIds) {
    if (!fullIds.has(id)) missingFull.push(id);
    if (!thumbIds.has(id)) missingThumb.push(id);
  }

  // Check for orphaned images
  const orphanedFull = Array.from(fullIds).filter((id) => !birdIds.has(id));
  const orphanedThumb = Array.from(thumbIds).filter((id) => !birdIds.has(id));

  return { missingFull, missingThumb, orphanedFull, orphanedThumb };
}
