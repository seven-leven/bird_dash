/// <reference lib="deno.ns" />
import { updateVersion } from './update_version.ts';

const FILES = {
  changelog: './CHANGELOG.md',
};

async function main() {
  const message = Deno.args[0];
  if (!message) {
    console.error("❌ Message required. usage: deno task ship 'message'");
    Deno.exit(1);
  }

  // 1. Lint & Format
  console.log('🧹 Cleaning code...');
  await new Deno.Command('deno', { args: ['fmt'] }).output();
  const lint = await new Deno.Command('deno', { args: ['lint'] }).output();
  if (lint.code !== 0) {
    console.log(new TextDecoder().decode(lint.stderr));
    Deno.exit(1);
  }

  // 2. Update Version (Counts drawn birds only)
  const fullVersion = await updateVersion();

  // 3. Update Changelog
  const date = new Date().toISOString().split('T')[0];
  const logLine = `- **${fullVersion}**: ${message} (${date})\n`;
  await Deno.writeTextFile(FILES.changelog, logLine, { append: true });

  console.log(`🚀 Shipping v${fullVersion}...`);

  // 4. Commit & Push
  await new Deno.Command('git', { args: ['commit', '-a', '-m', `${message} (v${fullVersion})`] })
    .output();
  await new Deno.Command('git', { args: ['push'] }).output();
}

if (import.meta.main) main();
