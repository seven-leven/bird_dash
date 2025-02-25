// bundler/build_config.ts
import { dirname, fromFileUrl, join } from "@std/path";
import type { BuildOptions, Loader } from "esbuild";

const __dirname = dirname(fromFileUrl(import.meta.url));
export const BUILD_DIR = join(__dirname, "..", "build");

export const buildConfig: BuildOptions = {
  entryPoints: ["src/index.tsx"],
  bundle: true,
  outfile: join(BUILD_DIR, "bundle.js"),
  sourcemap: true,
  minify: true,
  target: ["es2022", "chrome100", "firefox100"],
  format: "esm",
  loader: {
    ".tsx": "tsx" as Loader,
    ".ts": "ts" as Loader,
  },
  external: ["react", "react-dom", "react-router-dom"],
};
