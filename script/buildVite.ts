// scripts/BuildVite.ts
/// <reference lib="deno.ns" />

export async function runViteBuild(): Promise<void> {
  const start = performance.now();

  console.log('\n  ──────────────────────────────────────────────────');
  console.log('  ⚡ Running Vite build...');
  console.log('  ──────────────────────────────────────────────────\n');

  const cmd = new Deno.Command('deno', {
    args: ['run', '-A', '--node-modules-dir', 'npm:vite', 'build'],
    stdout: 'inherit',
    stderr: 'inherit',
  });

  const { code } = await cmd.output();
  const duration = ((performance.now() - start) / 1000).toFixed(2);

  console.log('\n  ──────────────────────────────────────────────────');
  if (code === 0) {
    console.log(`  ✅ Vite build complete (${duration}s)`);
  } else {
    console.error('  ❌ Vite build failed');
    throw new Error(`Vite build exited with code ${code}`);
  }
  console.log('  ──────────────────────────────────────────────────\n');
}

if (import.meta.main) {
  runViteBuild().catch((err) => {
    console.error(err.message);
    Deno.exit(1);
  });
}
