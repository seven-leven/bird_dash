import { contentType } from "@std/media-types";
import { dirname, fromFileUrl, join, resolve } from "@std/path";

const PORT = 3000;
const __dirname = dirname(fromFileUrl(import.meta.url));
const BUILD_DIR = resolve(__dirname, "build");

// Security headers
const COMMON_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
};

export const handler = async (req: Request): Promise<Response> => {
  // Handle only GET and HEAD requests
  if (!["GET", "HEAD"].includes(req.method)) {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const url = new URL(req.url);
  const pathname = url.pathname === "/" ? "/index.html" : url.pathname;
  const filePath = resolve(BUILD_DIR, `.${pathname}`);

  // Prevent directory traversal
  if (!filePath.startsWith(BUILD_DIR)) {
    return new Response("Forbidden", { status: 403 });
  }

  try {
    const file = await Deno.readFile(filePath);
    const headers = new Headers(COMMON_HEADERS);

    // Set content type using standard library
    const type = contentType(pathname.split(".").pop() || "");
    if (type) headers.set("Content-Type", type);

    // Cache static assets (1 year immutable)
    if (pathname.startsWith("/assets/")) {
      headers.set("Cache-Control", "public, max-age=31536000, immutable");
    }

    return new Response(file, { headers });
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      // Only handle HTML requests for SPA fallback
      const acceptsHtml = req.headers.get("Accept")?.includes("text/html");

      if (acceptsHtml) {
        try {
          const file = await Deno.readFile(join(BUILD_DIR, "index.html"));
          return new Response(file, {
            headers: { ...COMMON_HEADERS, "Content-Type": "text/html" },
          });
        } catch {
          return new Response("Not Found", { status: 404 });
        }
      }
    }
    return new Response("Not Found", { status: 404 });
  }
};

// Graceful shutdown
const server = Deno.serve({ port: PORT }, handler);
console.log(`Server running at http://localhost:${PORT}`);

Deno.addSignalListener("SIGINT", () => {
  console.log("\nShutting down...");
  server.shutdown();
  Deno.exit();
});
