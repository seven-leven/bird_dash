import { dirname, fromFileUrl, resolve } from "@std/path";

export function getConfig() {
  const __dirname = dirname(fromFileUrl(import.meta.url));
  const buildDir = resolve(__dirname, "..", "build");
  const port = Number(Deno.env.get("PORT")) || 3000;
  const commonHeaders = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    // Optionally add more security headers here.
  };
  return { buildDir, port, commonHeaders };
}
