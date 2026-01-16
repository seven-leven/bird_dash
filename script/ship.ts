/// <reference lib="deno.ns" />
import sharp from 'sharp';

const DIRS = {
  raw: './raw_png/',
  full: './public/full/',
  thumb: './public/thumb/',
};

const FILES = {
  birds: './public/birds.json',
  changelog: './CHANGELOG.md',
};

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

async function loadBirdsData(): Promise<BirdsData> {
  const content = await Deno.readTextFile(FILES.birds);
  return JSON.parse(content);
}

async function saveBirdsData(data: BirdsData) {
  await Deno.writeTextFile(FILES.birds, JSON.stringify(data, null, 2) + '\n');
}

async function updateBirdEntry(birdId: string): Promise<string | null> {
  const data = await loadBirdsData();
  const today = new Date().toISOString().split('T')[0];
  
  for (const category of Object.keys(data)) {
    const bird = data[category].find(b => b.id === birdId);
    if (bird) {
      if (!bird.drawn) {
        bird.drawn = today;
        await saveBirdsData(data);
        console.log(`  📝 Updated birds.json: ${bird.name} (${bird.id})`);
        return bird.name;
      }
      return null; // Already has drawn date
    }
  }
  
  console.warn(`  ⚠️  Bird ID ${birdId} not found in birds.json`);
  return null;
}

async function addToChangelog(birdId: string, birdName: string) {
  const date = new Date().toISOString().split('T')[0];
  const logLine = `- **Bird ${birdId}**: Added ${birdName} illustration (${date})\n`;
  await Deno.writeTextFile(FILES.changelog, logLine, { append: true });
  console.log(`  📋 Added to CHANGELOG.md`);
}

async function makeSquareAndConvert(
  inputPath: string,
  outputPath: string,
  size?: number
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

async function processImage(filename: string, fullFiles: string[], thumbFiles: string[]) {
  const baseName = filename.replace(/\.png$/i, '');
  const rawPath = `${DIRS.raw}${filename}`;
  const fullPath = `${DIRS.full}${baseName}.webp`;
  const thumbPath = `${DIRS.thumb}${baseName}.webp`;

  const fullExists = fullFiles.some(f => f.replace(/\.webp$/i, '') === baseName);
  const thumbExists = thumbFiles.some(f => f.replace(/\.webp$/i, '') === baseName);

  console.log(`  📸 Processing: ${filename}`);

  try {
    // Only create full-size if it doesn't exist
    if (!fullExists) {
      await makeSquareAndConvert(rawPath, fullPath);
      console.log(`  ✅ Created full: ${baseName}.webp`);
    } else {
      console.log(`  ⏭️  Skipped full (already exists): ${baseName}.webp`);
    }

    // Only create thumbnail if it doesn't exist
    if (!thumbExists) {
      await makeSquareAndConvert(rawPath, thumbPath, THUMB_SIZE);
      console.log(`  ✅ Created thumb: ${baseName}.webp`);
    } else {
      console.log(`  ⏭️  Skipped thumb (already exists): ${baseName}.webp`);
    }

    // Update birds.json and changelog only if this is a new bird (neither exists)
    if (!fullExists && !thumbExists) {
      const birdName = await updateBirdEntry(baseName);
      if (birdName) {
        await addToChangelog(baseName, birdName);
      }
    }
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

  console.log(`  Raw: ${rawFiles.length} | Full: ${fullFiles.length} | Thumb: ${thumbFiles.length}`);

  // Find images that need processing (missing in BOTH full and thumb)
  const fullSet = new Set(fullFiles.map(f => f.replace(/\.webp$/i, '')));
  const thumbSet = new Set(thumbFiles.map(f => f.replace(/\.webp$/i, '')));
  
  const toProcess = rawFiles.filter(f => {
    const base = f.replace(/\.png$/i, '');
    return !fullSet.has(base) || !thumbSet.has(base);
  });

  // Check if counts match
  if (toProcess.length === 0) {
    console.log('  ✨ All images processed. Nothing to do.');
    return;
  }

  if (toProcess.length === 0) {
    console.log('  ✨ No new images to process.');
    return;
  }

  console.log(`  🔄 Processing ${toProcess.length} image(s)...`);

  for (const file of toProcess) {
    await processImage(file, fullFiles, thumbFiles);
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