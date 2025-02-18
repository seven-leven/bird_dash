// build.ts
import { build, stop } from "https://deno.land/x/esbuild@v0.25.0/mod.js";
import { copy, ensureDir } from "jsr:@std/fs";
import { dirname, fromFileUrl, join } from "jsr:@std/path";

// Get absolute build directory path
const __dirname = dirname(fromFileUrl(import.meta.url));
const BUILD_DIR = join(__dirname, "build");

try {
  await ensureDir(BUILD_DIR);

  await build({
    entryPoints: ["src/index.tsx"],
    bundle: true,
    outfile: join(BUILD_DIR, "bundle.js"),
    sourcemap: true,
    minify: true,
    target: ["es2022", "chrome100", "firefox100"],
    format: "esm",
    loader: { ".tsx": "tsx", ".ts": "ts" },
    external: ["react", "react-dom", "react-router-dom"],
  });

  await copy("public", BUILD_DIR, { overwrite: true });
  console.log("Build completed. Files moved to 'build/'.");
} catch (error) {
  console.error("Build failed:", error);
  Deno.exit(1);
} finally {
  stop();
}
