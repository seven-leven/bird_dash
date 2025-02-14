import { build, stop } from "https://deno.land/x/esbuild@v0.25.0/mod.js";
import { copy, ensureDir } from "jsr:@std/fs";


// Ensure the build directory exists
await ensureDir("build");

// Build the project, replacing process.env.PUBLIC_URL with "."
await build({
  entryPoints: ["src/index.tsx"],
  bundle: true,
  outfile: "build/bundle.js",
  sourcemap: true,
  format: "esm",
  loader: { ".tsx": "tsx", ".ts": "ts" },
  define: {
    "process.env.PUBLIC_URL": JSON.stringify("."),
  },
  external: ["react", "react-dom", "react-router-dom"],
});

await copy("public", "build", { overwrite: true });

console.log("Build completed. Files moved to 'build/'.");
stop();
