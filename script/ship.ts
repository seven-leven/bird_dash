/// <reference lib="deno.ns" />
import { updateVersion } from './update_version.ts';
import { processImages } from './image_convert.ts';

const FILES = {
  changelog: './CHANGELOG.md',
};

async function main() {
  const message = Deno.args[0];
  if (!message) {
    console.error("❌ Message required. usage: deno task ship 'message'");
    Deno.exit(1);
  }

  // 1. Process Images
  try {
    await processImages();
  } catch (err) {
    console.error('❌ Image processing failed:', err);
    Deno.exit(1);
  }

  // 2. Lint & Format
  console.log('🧹 Cleaning code...');
  await new Deno.Command('deno', { args: ['fmt'] }).output();
  const lint = await new Deno.Command('deno', { args: ['lint'] }).output();
  if (lint.code !== 0) {
    console.log(new TextDecoder().decode(lint.stderr));
    Deno.exit(1);
  }

  // 3. Update Version (includes Integrity Check)
  let fullVersion = '';
  try {
    fullVersion = await updateVersion();
  } catch (_e) {
    console.error('❌ Aborting ship due to version error.');
    Deno.exit(1);
  }

  // 4. Update Changelog
  const date = new Date().toISOString().split('T')[0];
  const logLine = `- **${fullVersion}**: ${message} (${date})\n`;
  await Deno.writeTextFile(FILES.changelog, logLine, { append: true });

  console.log(`🚀 Shipping v${fullVersion}...`);

  // 5. Commit & Push
  await new Deno.Command('git', {
    args: ['commit', '-a', '-m', `${message} (v${fullVersion})`],
  }).output();
  await new Deno.Command('git', { args: ['push'] }).output();
}

if (import.meta.main) main();
