// server/handler.ts
import { contentType } from "@std/media-types";
import { join, relative, resolve } from "@std/path";

let indexHtmlCache: Uint8Array | null = null;

async function getIndexHtml(buildDir: string) {
  if (indexHtmlCache) return indexHtmlCache;
  indexHtmlCache = await Deno.readFile(join(buildDir, "index.html"));
  return indexHtmlCache;
}

export function createHandler({
  buildDir,
  commonHeaders,
}: {
  buildDir: string;
  commonHeaders: Record<string, string>;
}) {
  return async (req: Request): Promise<Response> => {
    // Only allow GET and HEAD requests.
    if (!["GET", "HEAD"].includes(req.method)) {
      return new Response("Method Not Allowed", { status: 405 });
    }

    const url = new URL(req.url);
    // Default to index.html if root is requested.
    const pathname = url.pathname === "/" ? "/index.html" : url.pathname;
    const filePath = resolve(buildDir, `.${pathname}`);

    // Prevent directory traversal.
    if (relative(buildDir, filePath).startsWith("..")) {
      return new Response("Forbidden", { status: 403 });
    }

    // Optimize HEAD requests.
    if (req.method === "HEAD") {
      try {
        const fileInfo = await Deno.stat(filePath);
        const headers = new Headers(commonHeaders);
        const type = contentType(pathname.split(".").pop() || "");
        if (type) headers.set("Content-Type", type);
        if (pathname.startsWith("/assets/")) {
          headers.set("Cache-Control", "public, max-age=31536000, immutable");
        }
        headers.set("Content-Length", fileInfo.size.toString());
        return new Response(null, { headers });
      } catch {
        // Fallback to GET logic if HEAD fails.
      }
    }

    try {
      const file = await Deno.readFile(filePath);
      const headers = new Headers(commonHeaders);
      const type = contentType(pathname.split(".").pop() || "");
      if (type) headers.set("Content-Type", type);
      if (pathname.startsWith("/assets/")) {
        headers.set("Cache-Control", "public, max-age=31536000, immutable");
      }
      return new Response(file, { headers });
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        const acceptsHtml = req.headers.get("Accept")?.includes("text/html");
        if (acceptsHtml) {
          try {
            const file = await getIndexHtml(buildDir);
            return new Response(file, {
              headers: { ...commonHeaders, "Content-Type": "text/html" },
            });
          } catch (innerError) {
            console.error("Error reading index.html fallback:", innerError);
            return new Response("Not Found", { status: 404 });
          }
        }
        return new Response("Not Found", { status: 404 });
      }

      console.error("Unexpected error:", error);
      return new Response("Internal Server Error", { status: 500 });
    }
  };
}
