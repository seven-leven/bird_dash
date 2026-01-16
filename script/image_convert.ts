/// <reference lib="deno.ns" />
import sharp from 'sharp';

const DIRS = {
  raw: './raw_png/',
  full: './public/full/',
  thumb: './public/thumb/',
};

const THUMB_SIZE = 400;

async function ensureDir(path: string) {
  try {
    await Deno.mkdir(path, { recursive: true });
  } catch (err) {
    if (!(err instanceof Deno.errors.AlreadyExists)) {
      throw err;
    }
  }
}

async function getImageFiles(dir: string): Promise<string[]> {
  try {
    const files: string[] = [];
    for await (const entry of Deno.readDir(dir)) {
      if (entry.isFile && entry.name.toLowerCase().endsWith('.png')) {
        files.push(entry.name);
      }
    }
    return files;
  } catch (err) {
    if (err instanceof Deno.errors.NotFound) {
      return [];
    }
    throw err;
  }
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

async function processImage(filename: string) {
  const baseName = filename.replace(/\.png$/i, '');
  const rawPath = `${DIRS.raw}${filename}`;
  const fullPath = `${DIRS.full}${baseName}.webp`;
  const thumbPath = `${DIRS.thumb}${baseName}.webp`;

  console.log(`  📸 Processing: ${filename}`);

  try {
    // Create full-size WebP (squared with white padding)
    await makeSquareAndConvert(rawPath, fullPath);

    // Create thumbnail (400x400)
    await makeSquareAndConvert(rawPath, thumbPath, THUMB_SIZE);

    console.log(`  ✅ Created: ${baseName}.webp (full + thumb)`);
  } catch (err) {
    console.error(`  ❌ Failed to process ${filename}:`, err);
    throw err;
  }
}

export async function processImages() {
  console.log('🖼️  Checking for new images...');

  // Ensure directories exist
  await ensureDir(DIRS.full);
  await ensureDir(DIRS.thumb);

  // Get file counts
  const rawFiles = await getImageFiles(DIRS.raw);
  const fullFiles = await getImageFiles(DIRS.full);
  const thumbFiles = await getImageFiles(DIRS.thumb);

  console.log(
    `  Raw: ${rawFiles.length} | Full: ${fullFiles.length} | Thumb: ${thumbFiles.length}`,
  );

  // Check if counts match
  if (rawFiles.length === fullFiles.length && rawFiles.length === thumbFiles.length) {
    console.log('  ✨ All images processed. Nothing to do.');
    return;
  }

  // Find images that need processing
  const fullSet = new Set(fullFiles.map((f) => f.replace(/\.webp$/i, '')));
  const toProcess = rawFiles.filter((f) => {
    const base = f.replace(/\.png$/i, '');
    return !fullSet.has(base);
  });

  if (toProcess.length === 0) {
    console.log('  ✨ No new images to process.');
    return;
  }

  console.log(`  🔄 Processing ${toProcess.length} new image(s)...`);

  for (const file of toProcess) {
    await processImage(file);
  }

  console.log('  🎉 Image processing complete!');
}

// Allow running standalone
if (import.meta.main) {
  try {
    await processImages();
  } catch (err) {
    console.error('❌ Image processing failed:', err);
    Deno.exit(1);
  }
}
