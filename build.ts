import { build, stop } from "https://deno.land/x/esbuild@v0.25.0/mod.js";
import { copy, ensureDir } from "jsr:@std/fs";


// Ensure the build directory exists
await ensureDir("build");

// Run the build process
await build({
  entryPoints: ["src/index.tsx"],
  bundle: true,
  outfile: "public/bundle.js",
  sourcemap: true,
  format: "esm",
  loader: { ".tsx": "tsx", ".ts": "ts" },
  external: ["react", "react-dom", "react-router-dom"],
});

// Copy the public directory to build/
await copy("public", "build", { overwrite: true });

console.log("Build completed. Files moved to 'build/'.");

stop();
