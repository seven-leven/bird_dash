// server/server_config.ts
import { dirname, fromFileUrl, resolve } from "@std/path";

export function getConfig() {
  const __dirname = dirname(fromFileUrl(import.meta.url));
  const buildDir = resolve(__dirname, "..", "build");
  const port = 3000;
  const commonHeaders = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
  };
  return { buildDir, port, commonHeaders };
}
