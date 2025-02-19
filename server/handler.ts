// server/handler.ts
import { contentType } from "@std/media-types";
import { join, resolve } from "@std/path";

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
    if (!filePath.startsWith(buildDir)) {
      return new Response("Forbidden", { status: 403 });
    }

    try {
      const file = await Deno.readFile(filePath);
      const headers = new Headers(commonHeaders);

      // Set the proper Content-Type header.
      const type = contentType(pathname.split(".").pop() || "");
      if (type) headers.set("Content-Type", type);

      // Cache static assets (1 year immutable).
      if (pathname.startsWith("/assets/")) {
        headers.set("Cache-Control", "public, max-age=31536000, immutable");
      }
      return new Response(file, { headers });
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        // SPA fallback: Serve index.html for HTML requests.
        const acceptsHtml = req.headers.get("Accept")?.includes("text/html");
        if (acceptsHtml) {
          try {
            const file = await Deno.readFile(join(buildDir, "index.html"));
            return new Response(file, {
              headers: { ...commonHeaders, "Content-Type": "text/html" },
            });
          } catch {
            return new Response("Not Found", { status: 404 });
          }
        }
      }
      return new Response("Not Found", { status: 404 });
    }
  };
}
