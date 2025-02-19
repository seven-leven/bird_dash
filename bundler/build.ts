// bundler/build.ts
import { build, stop } from "https://deno.land/x/esbuild@v0.25.0/mod.js";
import { copy, ensureDir } from "@std/fs";
import { BUILD_DIR, buildConfig } from "./build_config.ts";

try {
  await ensureDir(BUILD_DIR);
  await build(buildConfig);
  await copy("public", BUILD_DIR, { overwrite: true });
  console.log("Build completed. Files moved to 'build/'.");
} catch (error) {
  console.error("Build failed:", error);
  Deno.exit(1);
} finally {
  stop();
}
